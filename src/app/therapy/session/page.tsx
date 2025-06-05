"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTherapy } from '../../contexts/TherapyContext';
import App from '../../App';

export default function TherapySessionPage() {
  const { isConfigured } = useTherapy();
  const router = useRouter();

  // Redirect to therapy configuration if not configured
  useEffect(() => {
    if (!isConfigured) {
      router.push('/therapy');
    }
  }, [isConfigured, router]);

  // Show loading state while redirecting
  if (!isConfigured) {
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