"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleplay } from '../../contexts/RoleplayContext';
import App from '../../App';

export default function RoleplaySessionPage() {
  const { selectedScenario } = useRoleplay();
  const router = useRouter();

  // Redirect to roleplay selection if no scenario is selected
  useEffect(() => {
    if (!selectedScenario) {
      router.push('/roleplay');
    }
  }, [selectedScenario, router]);

  // Show loading state while redirecting
  if (!selectedScenario) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <App />;
} 