"use client";

import React, { Suspense } from "react";
import { TranscriptProvider } from "../contexts/TranscriptContext";
import { EventProvider } from "../contexts/EventContext";
import { TherapyProvider } from '../contexts/TherapyContext';

export default function TherapyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TherapyProvider>
        <TranscriptProvider>
          <EventProvider>
            {children}
          </EventProvider>
        </TranscriptProvider>
      </TherapyProvider>
    </Suspense>
  );
} 