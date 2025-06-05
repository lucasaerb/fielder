"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/openai-logomark.svg"
                alt="OpenAI Logo"
                width={32}
                height={32}
                className="mr-3"
              />
              <h1 className="text-2xl font-bold text-gray-900">Fielder</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Practice Difficult Conversations
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build confidence for challenging life conversations through AI-powered roleplay scenarios. 
            Work with our family therapy-trained discovery agent or choose from pre-made scenarios.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/roleplay"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Start Roleplay Practice
            </Link>
            <Link
              href="/transcript-review"
              className="bg-gray-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Review Past Sessions
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.828-.46l-5.241 1.466a.75.75 0 01-.927-.928l1.466-5.241A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Discovery Agent</h3>
            <p className="text-gray-600">
              Work with our family therapy-trained AI to identify and build personalized roleplay scenarios for your specific situations.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pre-Made Scenarios</h3>
            <p className="text-gray-600">
              Choose from professionally crafted scenarios covering job interviews, difficult conversations, negotiations, and more.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Session Review</h3>
            <p className="text-gray-600">
              Review transcripts of your practice sessions to track progress and identify areas for improvement.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Build Your Conversation Confidence?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Start practicing today with our AI-powered roleplay scenarios.
          </p>
          <Link
            href="/roleplay"
            className="bg-blue-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg inline-block"
          >
            Begin Practice Session
          </Link>
        </div>
      </main>
    </div>
  );
}
