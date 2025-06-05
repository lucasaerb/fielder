"use client";

import React, { createContext, useContext, useState } from 'react';

export type RoleplayScenario = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
};

export const roleplayScenarios: RoleplayScenario[] = [
  {
    id: 'interview',
    name: 'Job Interview',
    description: 'Practice your interview skills with an AI interviewer',
    systemPrompt: 'You are a hiring manager conducting a job interview. Be friendly but professional. Start by introducing yourself and asking about their background. Ask follow-up questions based on their responses. Show genuine interest in their experience and career goals. Give specific feedback when appropriate.'
  },
  {
    id: 'investment-pitch',
    name: 'Investment Pitch',
    description: 'Practice your startup pitch with potential investors',
    systemPrompt: 'You are a venture capitalist who has seen hundreds of pitches. You\'re direct and to the point. Ask tough questions about their business model and market. Challenge their assumptions. Show skepticism but remain open to compelling ideas. Focus on the problem they\'re solving and why people would pay for it.'
  },
  {
    id: 'party',
    name: 'Party Conversation',
    description: 'Practice your social skills in a party setting',
    systemPrompt: 'You are a friendly person at a party. Be casual and relaxed. Talk about current events, music, movies, or whatever comes up naturally. Share your own experiences and opinions. Show interest in what others have to say. Keep the conversation light and fun.'
  },
  {
    id: 'therapy',
    name: 'Therapy Session',
    description: 'Practice expressing yourself in a therapeutic setting',
    systemPrompt: 'You are a therapist who creates a safe, non-judgmental space. Listen carefully and ask thoughtful questions. Notice emotional cues and patterns. Help the person explore their feelings and experiences. Be patient and supportive, but don\'t shy away from challenging them when needed.'
  },
  {
    id: 'negotiation',
    name: 'Business Negotiation',
    description: 'Practice your negotiation skills in a business context',
    systemPrompt: 'You are a business executive who values direct communication. Be clear about your priorities and constraints. Ask probing questions about their needs. Look for win-win solutions. Be firm but fair. Don\'t waste time on small talk - focus on the deal terms and mutual benefits.'
  }
];

type RoleplayContextType = {
  selectedScenario: RoleplayScenario | null;
  setSelectedScenario: (scenario: RoleplayScenario | null) => void;
  isSettingsComplete: boolean;
};

const RoleplayContext = createContext<RoleplayContextType | undefined>(undefined);

export function RoleplayProvider({ children }: { children: React.ReactNode }) {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);

  return (
    <RoleplayContext.Provider
      value={{
        selectedScenario,
        setSelectedScenario,
        isSettingsComplete: selectedScenario !== null,
      }}
    >
      {children}
    </RoleplayContext.Provider>
  );
}

export function useRoleplay() {
  const context = useContext(RoleplayContext);
  if (context === undefined) {
    throw new Error('useRoleplay must be used within a RoleplayProvider');
  }
  return context;
} 