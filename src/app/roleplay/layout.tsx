import React, { Suspense } from "react";
import { TranscriptProvider } from "../contexts/TranscriptContext";
import { EventProvider } from "../contexts/EventContext";
import { RoleplayProvider } from "../contexts/RoleplayContext";

export default function RoleplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoleplayProvider>
        <TranscriptProvider>
          <EventProvider>
            {children}
          </EventProvider>
        </TranscriptProvider>
      </RoleplayProvider>
    </Suspense>
  );
} 