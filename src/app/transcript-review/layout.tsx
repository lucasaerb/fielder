"use client";

import React from 'react';
import { TranscriptProvider } from '../contexts/TranscriptContext';
import { TherapyProvider } from '../contexts/TherapyContext';

export default function TranscriptReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TherapyProvider>
      <TranscriptProvider>
        {children}
      </TranscriptProvider>
    </TherapyProvider>
  );
} 