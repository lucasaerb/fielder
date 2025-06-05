"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTherapy } from '../contexts/TherapyContext';
import TherapySelectionMenu from '../components/TherapySelectionMenu';

export default function TherapyPage() {
  const { selectedVoice, selectedApproach, isConfigured } = useTherapy();
  const router = useRouter();

  const handleStartSession = () => {
    if (!isConfigured) {
      alert('Please select both a therapist voice and therapeutic approach before starting your session.');
      return;
    }
    router.push('/therapy/session');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Configure Your Therapy Experience
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select your preferred therapist voice and therapeutic approach to begin your personalized session
          </p>
        </div>

        {/* Therapy Selection Menu */}
        <TherapySelectionMenu />

        {/* Start Session Button */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg border-2 border-blue-200">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.828-.46l-5.241 1.466a.75.75 0 01-.927-.928l1.466-5.241A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Ready to Start Your Session?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Once you&apos;ve selected your preferred voice and therapeutic approach, you can begin your confidential therapy session. 
                  Your AI therapist will provide personalized support using evidence-based techniques.
                </p>
              </div>
              
              {isConfigured && (
                <div className="space-y-4 mb-6 text-sm text-gray-700">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Selected Voice: {selectedVoice?.name}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Selected Approach: {selectedApproach?.name}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartSession}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-md hover:shadow-lg ${
                  isConfigured
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isConfigured}
              >
                Start Therapy Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 