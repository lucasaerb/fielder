"use client";

import React from 'react';
import { useTherapy, therapistVoices, therapyApproaches } from '../contexts/TherapyContext';

export default function TherapySelectionMenu() {
  const { 
    selectedVoice, 
    setSelectedVoice, 
    selectedApproach, 
    setSelectedApproach 
  } = useTherapy();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Therapist Voice Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Choose Your Therapist&apos;s Voice
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {therapistVoices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setSelectedVoice(voice)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedVoice?.id === voice.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {voice.name}
                </h3>
                {selectedVoice?.id === voice.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-2">{voice.description}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)} Voice
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Therapy Approach Selection */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Select Your Therapeutic Approach
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {therapyApproaches.map((approach) => (
            <button
              key={approach.id}
              onClick={() => setSelectedApproach(approach)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedApproach?.id === approach.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {approach.name}
                </h3>
                {selectedApproach?.id === approach.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-4">{approach.description}</p>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Best for:</div>
                <div className="flex flex-wrap gap-2">
                  {approach.bestFor.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 