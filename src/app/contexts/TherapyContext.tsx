"use client";

import React, { createContext, useContext, useState } from 'react';

export type TherapistVoice = {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
};

export type TherapyApproach = {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
};

export const therapistVoices: TherapistVoice[] = [
  {
    id: 'sage',
    name: 'Dr. Sage',
    description: 'A warm, experienced voice with a calm and nurturing presence',
    gender: 'neutral'
  },
  {
    id: 'alloy',
    name: 'Dr. Alex',
    description: 'An energetic and encouraging voice with a direct communication style',
    gender: 'male'
  },
  {
    id: 'echo',
    name: 'Dr. Maya',
    description: 'A gentle and empathetic voice with a thoughtful approach',
    gender: 'female'
  }
];

export const therapyApproaches: TherapyApproach[] = [
  {
    id: 'eft',
    name: 'Emotionally Focused Therapy',
    description: 'A structured approach that helps you understand and transform emotional patterns',
    bestFor: [
      'Relationship issues',
      'Emotional regulation',
      'Attachment concerns',
      'Trauma healing'
    ]
  },
  {
    id: 'cbt',
    name: 'Cognitive Behavioral Therapy',
    description: 'A practical approach that helps you identify and change unhelpful thought patterns',
    bestFor: [
      'Anxiety and depression',
      'Stress management',
      'Negative thinking patterns',
      'Behavioral changes'
    ]
  },
  {
    id: 'solution',
    name: 'Solution-Focused Therapy',
    description: 'A goal-oriented approach that focuses on building solutions rather than analyzing problems',
    bestFor: [
      'Quick problem-solving',
      'Goal achievement',
      'Building on strengths',
      'Future planning'
    ]
  }
];

type TherapyContextType = {
  selectedVoice: TherapistVoice | null;
  setSelectedVoice: (voice: TherapistVoice | null) => void;
  selectedApproach: TherapyApproach | null;
  setSelectedApproach: (approach: TherapyApproach | null) => void;
  isConfigured: boolean;
};

const TherapyContext = createContext<TherapyContextType | undefined>(undefined);

export function TherapyProvider({ children }: { children: React.ReactNode }) {
  const [selectedVoice, setSelectedVoice] = useState<TherapistVoice | null>(null);
  const [selectedApproach, setSelectedApproach] = useState<TherapyApproach | null>(null);

  const isConfigured = selectedVoice !== null && selectedApproach !== null;

  return (
    <TherapyContext.Provider
      value={{
        selectedVoice,
        setSelectedVoice,
        selectedApproach,
        setSelectedApproach,
        isConfigured
      }}
    >
      {children}
    </TherapyContext.Provider>
  );
}

export function useTherapy() {
  const context = useContext(TherapyContext);
  if (context === undefined) {
    throw new Error('useTherapy must be used within a TherapyProvider');
  }
  return context;
} 