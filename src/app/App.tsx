"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { RealtimeClient } from "@/app/agentConfigs/realtimeClient";
import { RealtimeAgent } from "@openai/agents/realtime";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRoleplay } from "@/app/contexts/RoleplayContext";
import useAudioDownload from "./hooks/useAudioDownload";
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";
import { simpleHandoffScenario } from "@/app/agentConfigs/simpleHandoff";
import { customerServiceRetailScenario } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorScenario } from "@/app/agentConfigs/chatSupervisor";
import { therapyRoleplayScenario } from "@/app/agentConfigs/therapyRoleplay";

const sdkScenarioMap: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  therapyRoleplay: therapyRoleplayScenario,
};

type SessionStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

function App() {
  const searchParams = useSearchParams()!;
  const { selectedScenario, setSelectedScenario } = useRoleplay();
  const { 
    transcriptItems,
    addTranscriptMessage, 
    addTranscriptBreadcrumb, 
    updateTranscriptMessage, 
    updateTranscriptItem,
    clearTranscript 
  } = useTranscript();
  const { logClientEvent, logServerEvent, logHistoryItem } = useEvent();

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [userText, setUserText] = useState("");
  const [isEventsPaneExpanded, setIsEventsPaneExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(120); // 2 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const sdkClientRef = useRef<RealtimeClient | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const loggedFunctionCallsRef = useRef<Set<string>>(new Set());
  const transcriptItemsRef = useRef<TranscriptItem[]>(transcriptItems);

  useEffect(() => {
    transcriptItemsRef.current = transcriptItems;
  }, [transcriptItems]);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<RealtimeAgent[] | null>(null);

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  const sendClientEvent = (eventObj: any) => {
    if (!sdkClientRef.current) {
      console.error('SDK client not available', eventObj);
      return;
    }

    try {
      sdkClientRef.current.sendEvent(eventObj);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };

  useEffect(() => {
    let finalAgentConfig = searchParams.get("agentConfig");
    if (!finalAgentConfig || !allAgentSets[finalAgentConfig]) {
      finalAgentConfig = defaultAgentSetKey;
      const url = new URL(window.location.toString());
      url.searchParams.set("agentConfig", finalAgentConfig);
      window.location.replace(url.toString());
      return;
    }

    const agents = allAgentSets[finalAgentConfig];
    const agentKeyToUse = agents[0]?.name || "";

    // If we have a selected scenario, update the agent's instructions
    if (selectedScenario) {
      const agent = agents.find(a => a.name === agentKeyToUse);
      if (agent) {
        agent.instructions = selectedScenario.systemPrompt;
      }
    }

    setSelectedAgentName(agentKeyToUse);
    setSelectedAgentConfigSet(agents);
  }, [searchParams, selectedScenario]);

  useEffect(() => {
    if (selectedAgentName && sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    }
  }, [selectedAgentName]);

  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet &&
      selectedAgentName
    ) {
      const currentAgent = selectedAgentConfigSet.find(
        (a) => a.name === selectedAgentName
      );
      addTranscriptBreadcrumb(`Agent: ${selectedAgentName}`, currentAgent);
      updateSession(true);
    }
  }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      console.log(
        `updatingSession, isPTTACtive=${isPTTActive} sessionStatus=${sessionStatus}`
      );
      updateSession();
    }
  }, [isPTTActive]);

  useEffect(() => {
    if (selectedScenario && sessionStatus === "CONNECTED") {
      // Update the agent's system prompt with the roleplay scenario
      const currentAgent = selectedAgentConfigSet?.find(
        (a) => a.name === selectedAgentName
      );
      if (currentAgent) {
        currentAgent.instructions = selectedScenario.systemPrompt;
        updateSession(true);
      }
    }
  }, [selectedScenario, sessionStatus, selectedAgentName, selectedAgentConfigSet]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async () => {
    const agentSetKey = searchParams.get("agentConfig") || "default";
    if (sdkScenarioMap[agentSetKey]) {
      // Use new SDK path
      if (sessionStatus !== "DISCONNECTED") return;
      setSessionStatus("CONNECTING");

      // Clear previous transcript when starting a new session
      clearTranscript();

      try {
        const EPHEMERAL_KEY = await fetchEphemeralKey();
        if (!EPHEMERAL_KEY) return;

        // Ensure the selectedAgentName is first so that it becomes the root
        const reorderedAgents = [...sdkScenarioMap[agentSetKey]];
        const idx = reorderedAgents.findIndex((a) => a.name === selectedAgentName);
        if (idx > 0) {
          const [agent] = reorderedAgents.splice(idx, 1);
          reorderedAgents.unshift(agent);
        }

        // Update the root agent's instructions with the selected scenario
        if (selectedScenario && reorderedAgents[0]) {
          reorderedAgents[0].instructions = selectedScenario.systemPrompt;
        }

        const client = new RealtimeClient({
          getEphemeralKey: async () => EPHEMERAL_KEY,
          initialAgents: reorderedAgents,
          audioElement: sdkAudioElement,
          extraContext: {
            addTranscriptBreadcrumb,
          },
        } as any);

        sdkClientRef.current = client;

        client.on("connection_change", (status) => {
          if (status === "connected") setSessionStatus("CONNECTED");
          else if (status === "connecting") setSessionStatus("CONNECTING");
          else setSessionStatus("DISCONNECTED");
        });

        client.on("message", (ev) => {
          logServerEvent(ev);

          // --- Realtime streaming handling ---------------------------------
          // The Realtime transport emits granular *delta* events while the
          // assistant is speaking or while the user's audio is still being
          // transcribed. Those events were previously only logged which made
          // the UI update only once when the final conversation.item.* event
          // arrived – effectively disabling streaming. We now listen for the
          // delta events and update the transcript as they arrive so that
          // 1) assistant messages stream token-by-token, and
          // 2) the user sees a live "Transcribing…" placeholder while we are
          //    still converting their speech to text.

          // NOTE: The exact payloads are still evolving.  We intentionally
          // access properties defensively to avoid runtime crashes if fields
          // are renamed or missing.

          try {
            // Guardrail trip event – mark last assistant message as FAIL
            if (ev.type === 'guardrail_tripped') {
              const lastAssistant = [...transcriptItemsRef.current]
                .reverse()
                .find((i) => i.role === 'assistant');

              if (lastAssistant) {
                updateTranscriptItem(lastAssistant.itemId, {
                  guardrailResult: {
                    status: 'DONE',
                    category: 'OFF_BRAND',
                    rationale: 'Guardrail triggered',
                    testText: '',
                  },
                } as any);
              }
              return;
            }

            // Response finished – if we still have Pending guardrail mark as
            // Pass. This event fires once per assistant turn.
            if (ev.type === 'response.done') {
              const lastAssistant = [...transcriptItemsRef.current]
                .reverse()
                .find((i) => i.role === 'assistant');

              if (lastAssistant) {
                const existing: any = (lastAssistant as any).guardrailResult;
                if (!existing || existing.status === 'IN_PROGRESS') {
                  updateTranscriptItem(lastAssistant.itemId, {
                    guardrailResult: {
                      status: 'DONE',
                      category: 'NONE',
                      rationale: '',
                    },
                  } as any);
                }
              }
              // continue processing other logic if needed
            }
            // Assistant text (or audio-to-text) streaming
            if (
              ev.type === 'response.text.delta' ||
              ev.type === 'response.audio_transcript.delta'
            ) {
              const itemId: string | undefined = (ev as any).item_id ?? (ev as any).itemId;
              const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
              if (!itemId || !delta) return;

              // Ensure a transcript message exists for this assistant item.
              if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
                addTranscriptMessage(itemId, 'assistant', '');
                updateTranscriptItem(itemId, {
                  guardrailResult: {
                    status: 'IN_PROGRESS',
                  },
                } as any);
              }

              // Append the latest delta so the UI streams.
              updateTranscriptMessage(itemId, delta, true);
              updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
              return;
            }

            // Live user transcription streaming
            if (ev.type === 'conversation.input_audio_transcription.delta') {
              const itemId: string | undefined = (ev as any).item_id ?? (ev as any).itemId;
              const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
              if (!itemId || typeof delta !== 'string') return;

              // If this is the very first chunk, create a hidden user message
              // so that we can surface "Transcribing…" immediately.
              if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
                addTranscriptMessage(itemId, 'user', 'Transcribing…');
              }

              updateTranscriptMessage(itemId, delta, true);
              updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
            }

            // Detect start of a new user speech segment when VAD kicks in.
            if (ev.type === 'input_audio_buffer.speech_started') {
              const itemId: string | undefined = (ev as any).item_id;
              if (!itemId) return;

              const exists = transcriptItemsRef.current.some(
                (t) => t.itemId === itemId,
              );
              if (!exists) {
                addTranscriptMessage(itemId, 'user', 'Transcribing…');
                updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
              }
            }

            // Final transcript once Whisper finishes
            if (
              ev.type === 'conversation.item.input_audio_transcription.completed'
            ) {
              const itemId: string | undefined = (ev as any).item_id;
              const transcriptText: string | undefined = (ev as any).transcript;
              if (!itemId || typeof transcriptText !== 'string') return;

              const exists = transcriptItemsRef.current.some(
                (t) => t.itemId === itemId,
              );
              if (!exists) {
                addTranscriptMessage(itemId, 'user', transcriptText.trim());
              } else {
                // Replace placeholder / delta text with final transcript
                updateTranscriptMessage(itemId, transcriptText.trim(), false);
              }
              updateTranscriptItem(itemId, { status: 'DONE' });
            }

            // Assistant streaming tokens or transcript
            if (
              ev.type === 'response.text.delta' ||
              ev.type === 'response.audio_transcript.delta'
            ) {
              const responseId: string | undefined =
                (ev as any).response_id ?? (ev as any).responseId;
              const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
              if (!responseId || typeof delta !== 'string') return;

              // We'll use responseId as part of itemId to make it deterministic.
              const itemId = `assistant-${responseId}`;

              if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
                addTranscriptMessage(itemId, 'assistant', '');
              }

              updateTranscriptMessage(itemId, delta, true);
              updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
            }
          } catch (err) {
            // Streaming is best-effort – never break the session because of it.
            console.warn('streaming-ui error', err);
          }
        });

        client.on('history_added', (item) => {
          logHistoryItem(item);

          // Update the transcript view
          if (item.type === 'message') {
            const textContent = (item.content || [])
              .map((c: any) => {
                if (c.type === 'text') return c.text;
                if (c.type === 'input_text') return c.text;
                if (c.type === 'input_audio') return c.transcript ?? '';
                if (c.type === 'audio') return c.transcript ?? '';
                return '';
              })
              .join(' ')
              .trim();

            if (!textContent) return;

            const role = item.role as 'user' | 'assistant';

            // No PTT placeholder logic needed

            const exists = transcriptItemsRef.current.some(
              (t) => t.itemId === item.itemId,
            );

            if (!exists) {
              addTranscriptMessage(item.itemId, role, textContent, false);
              if (role === 'assistant') {
                updateTranscriptItem(item.itemId, {
                  guardrailResult: {
                    status: 'IN_PROGRESS',
                  },
                } as any);
              }
            } else {
              updateTranscriptMessage(item.itemId, textContent, false);
            }

            // After assistant message completes, add default guardrail PASS if none present.
            if (
              role === 'assistant' &&
              (item as any).status === 'completed'
            ) {
              const current = transcriptItemsRef.current.find(
                (t) => t.itemId === item.itemId,
              );
              const existing = (current as any)?.guardrailResult;
              if (existing && existing.status !== 'IN_PROGRESS') {
                // already final (e.g., FAIL) – leave as is.
              } else {
                updateTranscriptItem(item.itemId, {
                  guardrailResult: {
                    status: 'DONE',
                    category: 'NONE',
                    rationale: '',
                  },
                } as any);
              }
            }

            if ('status' in item) {
              updateTranscriptItem(item.itemId, {
                status:
                  (item as any).status === 'completed'
                    ? 'DONE'
                    : 'IN_PROGRESS',
              });
            }
          }

          // Surface function / hand-off calls as breadcrumbs
          if (item.type === 'function_call') {
            const title = `Tool call: ${(item as any).name}`;

            if (!loggedFunctionCallsRef.current.has(item.itemId)) {
              addTranscriptBreadcrumb(title, {
                arguments: (item as any).arguments,
              });
              loggedFunctionCallsRef.current.add(item.itemId);

              // If this looks like a handoff (transfer_to_*), switch active
              // agent so subsequent session updates & breadcrumbs reflect the
              // new agent. The Realtime SDK already updated the session on
              // the backend; this only affects the UI state.
              const toolName: string = (item as any).name ?? '';
              const handoffMatch = toolName.match(/^transfer_to_(.+)$/);
              if (handoffMatch) {
                const newAgentKey = handoffMatch[1];

                // Find agent whose name matches (case-insensitive)
                const candidate = selectedAgentConfigSet?.find(
                  (a) => a.name.toLowerCase() === newAgentKey.toLowerCase(),
                );
                if (candidate && candidate.name !== selectedAgentName) {
                  setSelectedAgentName(candidate.name);
                }
              }
            }
            return;
          }
        });

        // Handle continuous updates for existing items so streaming assistant
        // speech shows up while in_progress.
        client.on('history_updated', (history) => {
          history.forEach((item: any) => {
            if (item.type === 'function_call') {
              // Update breadcrumb data (e.g., add output) once we have more info.

              if (!loggedFunctionCallsRef.current.has(item.itemId)) {
                addTranscriptBreadcrumb(`Tool call: ${(item as any).name}`, {
                  arguments: (item as any).arguments,
                  output: (item as any).output,
                });
                loggedFunctionCallsRef.current.add(item.itemId);

                const toolName: string = (item as any).name ?? '';
                const handoffMatch = toolName.match(/^transfer_to_(.+)$/);
                if (handoffMatch) {
                  const newAgentKey = handoffMatch[1];
                  const candidate = selectedAgentConfigSet?.find(
                    (a) => a.name.toLowerCase() === newAgentKey.toLowerCase(),
                  );
                  if (candidate && candidate.name !== selectedAgentName) {
                    setSelectedAgentName(candidate.name);
                  }
                }
              }

              return;
            }

            if (item.type !== 'message') return;

            const textContent = (item.content || [])
              .map((c: any) => {
                if (c.type === 'text') return c.text;
                if (c.type === 'input_text') return c.text;
                if (c.type === 'input_audio') return c.transcript ?? '';
                if (c.type === 'audio') return c.transcript ?? '';
                return '';
              })
              .join(' ')
              .trim();

            const role = item.role as 'user' | 'assistant';

            if (!textContent) return;

            const exists = transcriptItemsRef.current.some(
              (t) => t.itemId === item.itemId,
            );
              if (!exists) {
                addTranscriptMessage(item.itemId, role, textContent, false);
                if (role === 'assistant') {
                  updateTranscriptItem(item.itemId, {
                    guardrailResult: {
                      status: 'IN_PROGRESS',
                    },
                  } as any);
                }
            } else {
              updateTranscriptMessage(item.itemId, textContent, false);
            }

            if ('status' in item) {
              updateTranscriptItem(item.itemId, {
                status:
                  (item as any).status === 'completed'
                    ? 'DONE'
                    : 'IN_PROGRESS',
              });
            }
          });
        });

        await client.connect();
      } catch (err) {
        console.error("Error connecting via SDK:", err);
        setSessionStatus("DISCONNECTED");
      }
      return;
    }
  };

  const disconnectFromRealtime = () => {
    if (sdkClientRef.current) {
      sdkClientRef.current.disconnect();
      sdkClientRef.current = null;
    }
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);

    logClientEvent({}, "disconnected");
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: "conversation.item.create",
      item: {
        id,
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    sendClientEvent({ type: "response.create" });
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // In SDK scenarios RealtimeClient manages session config automatically.
    if (sdkClientRef.current) {
      if (shouldTriggerResponse) {
        sendSimulatedUserMessage('hi');
      }

      // Reflect Push-to-Talk UI state by (de)activating server VAD on the
      // backend. The Realtime SDK supports live session updates via the
      // `session.update` event.
      const client = sdkClientRef.current;
      if (client) {
        const turnDetection = isPTTActive
          ? null
          : {
              type: 'server_vad',
              threshold: 0.9,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
              create_response: true,
            };
        try {
          client.sendEvent({
            type: 'session.update',
            session: {
              turn_detection: turnDetection,
            },
          });
        } catch (err) {
          console.warn('Failed to update session', err);
        }
      }
      return;
    }
  };

  const cancelAssistantSpeech = async () => {

    // Interrupts server response and clears local audio.
    if (sdkClientRef.current) {
      try {
        sdkClientRef.current.interrupt();
      } catch (err) {
        console.error('Failed to interrupt', err);
      }
    }
  };

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    cancelAssistantSpeech();

    if (!sdkClientRef.current) {
      console.error('SDK client not available');
      return;
    }

    try {
      sdkClientRef.current.sendUserText(userText.trim());
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }

    setUserText("");
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== 'CONNECTED' || sdkClientRef.current == null) return;
    cancelAssistantSpeech();

    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: "input_audio_buffer.clear" });

    // No placeholder; we'll rely on server transcript once ready.
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || sdkClientRef.current == null || !isPTTUserSpeaking)
      return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: "input_audio_buffer.commit" });
    sendClientEvent({ type: "response.create" });
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback. Only supported when using the SDK path.
    if (sdkClientRef.current) {
      try {
        sdkClientRef.current.mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('Failed to toggle SDK mute', err);
      }
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === 'CONNECTED' && sdkClientRef.current) {
      try {
        sdkClientRef.current.mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('mute sync after connect failed', err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  const handleBackToScenarios = () => {
    // Clear the selected scenario to return to the root page
    setSelectedScenario(null);
  };

  // Start timer when session connects
  useEffect(() => {
    if (sessionStatus === "CONNECTED" && !isTimerRunning) {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleStopScenario();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionStatus, isTimerRunning]);

  const handleStopScenario = () => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    
    // Disconnect from the session
    if (sessionStatus === "CONNECTED") {
      disconnectFromRealtime();
    }

    // Navigate to transcript review
    window.location.href = '/transcript-review';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      {/* Header with minimal controls */}
      <div className="p-5 text-lg font-semibold flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToScenarios}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Scenarios
          </button>
          <div className="flex items-center">
            <div>
              <Image
                src="/openai-logomark.svg"
                alt="OpenAI Logo"
                width={20}
                height={20}
                className="mr-2"
              />
            </div>
            <div>
              {selectedScenario?.name || 'Roleplay Practice'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer display */}
          {sessionStatus === "CONNECTED" && (
            <div className="text-lg font-mono">
              {formatTime(timeRemaining)}
            </div>
          )}
          
          {/* Debug toggle button */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>

      {/* Main content area - empty by default, shows debug panel when toggled */}
      <div className="flex-1 flex items-center justify-center">
        {showDebugPanel && (
          <div className="w-full h-full flex gap-2 p-2">
            <div className="w-1/2">
              <Transcript
                userText={userText}
                setUserText={setUserText}
                onSendMessage={handleSendTextMessage}
                downloadRecording={downloadRecording}
                canSend={sessionStatus === "CONNECTED" && sdkClientRef.current != null}
              />
            </div>
            <div className="w-1/2">
              <Events isExpanded={isEventsPaneExpanded} />
            </div>
          </div>
        )}
      </div>

      {/* Simplified bottom toolbar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center items-center gap-4">
          {sessionStatus === "CONNECTED" ? (
            <>
              <button
                onClick={handleStopScenario}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                End Session
              </button>
              <button
                onMouseDown={handleTalkButtonDown}
                onMouseUp={handleTalkButtonUp}
                onMouseLeave={handleTalkButtonUp}
                className={`px-4 py-2 rounded-lg ${
                  isPTTUserSpeaking
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white transition-colors`}
              >
                {isPTTActive ? "Hold to Talk" : "Push to Talk"}
              </button>
              <button
                onClick={() => setIsAudioPlaybackEnabled(!isAudioPlaybackEnabled)}
                className={`px-4 py-2 rounded-lg ${
                  isAudioPlaybackEnabled
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white transition-colors`}
              >
                {isAudioPlaybackEnabled ? "Mute" : "Unmute"}
              </button>
            </>
          ) : (
            <button
              onClick={onToggleConnection}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
