"use client";

import React from 'react';
import Link from 'next/link';
import { useTranscript } from '../contexts/TranscriptContext';
import { useRoleplay } from '../contexts/RoleplayContext';
import Image from 'next/image';
import { TranscriptItem } from '../types';

export default function TranscriptReview() {
  const { transcriptItems } = useTranscript();
  const { selectedScenario } = useRoleplay();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </Link>
            <div className="flex items-center">
              <div>
                <Image
                  src="/openai-logomark.svg"
                  alt="OpenAI Logo"
                  width={20}
                  height={20}
                  className="mr-2"
                />
              </div>
              <div>
                {selectedScenario?.name || 'Roleplay Practice'} - Transcript Review
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="max-w-4xl mx-auto p-5">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {transcriptItems.map((item: TranscriptItem) => (
              <div key={item.itemId} className="flex gap-4">
                {/* Role indicator */}
                <div className="w-24 flex-shrink-0">
                  <div className={`text-sm font-medium ${
                    item.role === 'user' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {item.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                </div>

                {/* Message content */}
                <div className="flex-1">
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {item.title}
                  </div>
                  
                  {/* Breadcrumbs */}
                  {item.type === 'BREADCRUMB' && item.data && (
                    <div className="mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">→</span>
                        <span>{item.title}</span>
                      </div>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 