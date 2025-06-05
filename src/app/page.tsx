import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { RoleplayProvider } from "@/app/contexts/RoleplayContext";
import MainContent from "./components/MainContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoleplayProvider>
        <TranscriptProvider>
          <EventProvider>
            <MainContent />
          </EventProvider>
        </TranscriptProvider>
      </RoleplayProvider>
    </Suspense>
  );
}
