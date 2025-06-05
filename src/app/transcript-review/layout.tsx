"use client";

import React from 'react';
import { TranscriptProvider } from '../contexts/TranscriptContext';
import { RoleplayProvider } from '../contexts/RoleplayContext';

export default function TranscriptReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleplayProvider>
      <TranscriptProvider>
        {children}
      </TranscriptProvider>
    </RoleplayProvider>
  );
} 