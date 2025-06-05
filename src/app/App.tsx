"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RealtimeClient } from "@/app/agentConfigs/realtimeClient";
import { RealtimeAgent } from "@openai/agents/realtime";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useTherapy } from "@/app/contexts/TherapyContext";
import useAudioDownload from "./hooks/useAudioDownload";
import { therapyAgentScenario } from "@/app/agentConfigs/therapyAgent";
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import Metamorphosis from "./components/Metamorphosis";
import { TranscriptItem } from "@/app/types";

type SessionStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

function App() {
  const { selectedVoice, selectedApproach } = useTherapy();
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
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60); // 30 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const sdkClientRef = useRef<RealtimeClient | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
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

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

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

  // Create therapy prompt based on selected approach
  const createTherapyPrompt = () => {
    if (!selectedApproach) return '';
    
    const basePrompt = therapyAgentScenario[0].instructions;
    const approachPrompt = `

# Selected Therapeutic Approach: ${selectedApproach.name}

${selectedApproach.description}

Focus your therapeutic interventions using ${selectedApproach.name} techniques and principles. This approach is particularly effective for: ${selectedApproach.bestFor.join(', ')}.

Adapt your responses to incorporate the specific strategies and methods of this therapeutic framework while maintaining your core therapeutic principles.`;

    return basePrompt + approachPrompt;
  };

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    // Clear previous transcript when starting a new session
    clearTranscript();

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) return;

      // Create therapy agent with selected configuration
      const therapyAgent = new RealtimeAgent({
        name: 'therapyAgent',
        voice: selectedVoice?.id || 'sage',
        instructions: createTherapyPrompt(),
        tools: [],
        handoffs: [],
        handoffDescription: 'AI Therapy Agent providing supportive mental health conversations',
      });

      const client = new RealtimeClient({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: [therapyAgent],
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

        // Handle streaming and other message events (keeping existing logic)
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

          // Response finished – if we still have Pending guardrail mark as Pass
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
          }

          // Assistant text streaming
          if (
            ev.type === 'response.text.delta' ||
            ev.type === 'response.audio_transcript.delta'
          ) {
            const itemId: string | undefined = (ev as any).item_id ?? (ev as any).itemId;
            const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
            if (!itemId || !delta) return;

            if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
              addTranscriptMessage(itemId, 'assistant', '');
              updateTranscriptItem(itemId, {
                guardrailResult: {
                  status: 'IN_PROGRESS',
                },
              } as any);
            }

            updateTranscriptMessage(itemId, delta, true);
            updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
            return;
          }

          // User transcription streaming
          if (ev.type === 'conversation.input_audio_transcription.delta') {
            const itemId: string | undefined = (ev as any).item_id ?? (ev as any).itemId;
            const delta: string | undefined = (ev as any).delta ?? (ev as any).text;
            if (!itemId || typeof delta !== 'string') return;

            if (!transcriptItemsRef.current.some((t) => t.itemId === itemId)) {
              addTranscriptMessage(itemId, 'user', 'Transcribing…');
            }

            updateTranscriptMessage(itemId, delta, true);
            updateTranscriptItem(itemId, { status: 'IN_PROGRESS' });
          }

          // Speech started
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

          // Final transcript
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
              updateTranscriptMessage(itemId, transcriptText.trim(), false);
            }
            updateTranscriptItem(itemId, { status: 'DONE' });
          }
        } catch (err) {
          console.warn('streaming-ui error', err);
        }
      });

      client.on('history_added', (item) => {
        logHistoryItem(item);

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
        }
      });

      await client.connect();
    } catch (err) {
      console.error("Error connecting via SDK:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  // Auto-connect when component mounts
  useEffect(() => {
    if (selectedVoice && selectedApproach && sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    }
  }, [selectedVoice, selectedApproach]);

  const disconnectFromRealtime = () => {
    if (sdkClientRef.current) {
      sdkClientRef.current.disconnect();
      sdkClientRef.current = null;
    }
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
    logClientEvent({}, "disconnected");
  };

  const updateSession = () => {
    if (sdkClientRef.current) {
      const client = sdkClientRef.current;
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
  };

  // Update session when PTT changes
  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession();
    }
  }, [isPTTActive, sessionStatus]);

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

  const cancelAssistantSpeech = async () => {
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

  // Storage and audio effects
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
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    if (sdkClientRef.current) {
      try {
        sdkClientRef.current.mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('Failed to toggle SDK mute', err);
      }
    }
  }, [isAudioPlaybackEnabled]);

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
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  const handleBackToConfiguration = () => {
    window.location.href = '/therapy';
  };

  // Start timer when session connects
  useEffect(() => {
    if (sessionStatus === "CONNECTED" && !isTimerRunning) {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleEndSession();
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

  const handleEndSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    
    if (sessionStatus === "CONNECTED") {
      disconnectFromRealtime();
    }

    window.location.href = '/therapy-insights';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      {/* Header */}
      <div className="p-5 text-lg font-semibold flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToConfiguration}
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
            Back to Configuration
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
              Therapy Session - {selectedVoice?.name} ({selectedApproach?.name})
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {sessionStatus === "CONNECTED" && (
            <div className="text-lg font-mono">
              {formatTime(timeRemaining)}
            </div>
          )}
          
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center">
        {showDebugPanel ? (
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
        ) : sessionStatus === "CONNECTED" ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="mb-4 max-w-4xl w-full flex justify-center">
              <Metamorphosis />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedVoice?.name} is listening...
              </h2>
              <p className="text-gray-600">
                Using {selectedApproach?.name} approach
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.828-.46l-5.241 1.466a.75.75 0 01-.927-.928l1.466-5.241A8.955 8.955 0 113 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Ready to Connect
            </h2>
            <p className="text-gray-600 mb-6">
              Click &ldquo;Connect&rdquo; below to start your therapy session with {selectedVoice?.name}
            </p>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center items-center gap-4">
          {sessionStatus === "CONNECTED" ? (
            <>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                End Session
              </button>
              <button
                onMouseDown={handleTalkButtonDown}
                onMouseUp={handleTalkButtonUp}
                onMouseLeave={handleTalkButtonUp}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                  isPTTUserSpeaking
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white transition-colors font-medium shadow-sm`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {isPTTActive ? "Hold to Talk" : "Push to Talk"}
              </button>
              <button
                onClick={() => setIsAudioPlaybackEnabled(!isAudioPlaybackEnabled)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                  isAudioPlaybackEnabled
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white transition-colors font-medium shadow-sm`}
              >
                {isAudioPlaybackEnabled ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18 12a9 9 0 01-9 9m0 0a9 9 0 01-9-9m9 9v-4m0-4V8m0 0a3 3 0 013 3m-3-3a3 3 0 00-3 3" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
                {isAudioPlaybackEnabled ? "Mute" : "Unmute"}
              </button>
            </>
          ) : (
            <button
              onClick={onToggleConnection}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors font-medium shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
