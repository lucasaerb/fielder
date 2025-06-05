"use client";

import React from 'react';
import Link from 'next/link';
import { useTranscript } from '../contexts/TranscriptContext';
import Image from 'next/image';
import { TranscriptItem } from '../types';

export default function TranscriptReview() {
  const { transcriptItems } = useTranscript();

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
                Therapy Session - Transcript Review
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Session Transcript
          </h2>
          
          {transcriptItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.828-.46l-5.241 1.466a.75.75 0 01-.927-.928l1.466-5.241A8.955 8.955 0 113 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Session History
              </h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t completed any therapy sessions yet. Start your first session to see your conversation history here.
              </p>
              <Link
                href="/therapy"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
              >
                Start Therapy Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {transcriptItems.map((item: TranscriptItem, index: number) => (
                <div
                  key={item.itemId || index}
                  className={`p-4 rounded-lg ${
                    item.role === 'user' 
                      ? 'bg-blue-50 border-l-4 border-blue-400' 
                      : 'bg-gray-50 border-l-4 border-gray-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      item.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {item.role === 'user' ? 'U' : 'T'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {item.role === 'user' ? 'You' : 'Therapist'}
                      </div>
                      <div className="text-gray-700">
                        {item.title || 'No content'}
                      </div>
                      {item.timestamp && (
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session Actions */}
        {transcriptItems.length > 0 && (
          <div className="mt-6 flex gap-4 justify-center">
            <Link
              href="/therapy"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Session
            </Link>
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Print Transcript
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 