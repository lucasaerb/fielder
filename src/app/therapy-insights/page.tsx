"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranscript } from '../contexts/TranscriptContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptItem } from '../types';

interface Insight {
  title: string;
  description: string;
}

interface TherapyData {
  insights: Insight[];
  actions: Insight[];
}

export default function TherapyInsights() {
  const { transcriptItems } = useTranscript();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [therapyData, setTherapyData] = useState<TherapyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your session...');

  useEffect(() => {
    const analyzeSession = async () => {
      try {
        setLoadingMessage('Analyzing your session...');

        // Run both API calls in parallel
        const [insightsResponse, actionsResponse] = await Promise.all([
          fetch('/api/generate-therapy-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              conversation: transcriptItems.map((item: TranscriptItem) => item.title).join('\n') 
            })
          }),
          fetch('/api/generate-therapy-actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              conversation: transcriptItems.map((item: TranscriptItem) => item.title).join('\n') 
            })
          })
        ]);

        if (!insightsResponse.ok || !actionsResponse.ok) {
          throw new Error('Failed to analyze session');
        }

        const insightsData = await insightsResponse.json();
        const actionsData = await actionsResponse.json();

        const sessionData = {
          insights: insightsData.insights,
          actions: actionsData.actions,
        };

        setTherapyData(sessionData);

        // Store the session data in localStorage
        const date = new Date().toISOString();
        const storedSessions = localStorage.getItem('therapy_sessions');
        const sessions = storedSessions ? JSON.parse(storedSessions) : {};
        sessions[date] = {
          date,
          insights: insightsData.insights,
          actions: actionsData.actions.map((action: any) => ({
            ...action,
            completed: false
          }))
        };
        localStorage.setItem('therapy_sessions', JSON.stringify(sessions));

        setCurrentSlide(1);
      } catch (error) {
        console.error('Error analyzing session:', error);
        setLoadingMessage('Error analyzing session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    analyzeSession();
  }, [transcriptItems]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 3);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 3) % 3);
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <motion.div
            key="completion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-6"
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-gray-900 mb-4"
              >
                Great job!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-600"
              >
                You&apos;ve completed your therapy session. Let&apos;s review your progress and next steps.
              </motion.p>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Session Insights
            </h2>
            <div className="space-y-4">
              {therapyData?.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-gray-600">
                    {insight.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="actions"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Action Items
            </h2>
            <div className="space-y-4">
              {therapyData?.actions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600">
                    {action.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              className="absolute inset-0 border-4 border-blue-600 rounded-full"
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-t-transparent border-blue-600 rounded-full"
              animate={{
                rotate: -360,
                scale: [1, 0.9, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-600 text-lg"
          >
            {loadingMessage}
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {renderSlide()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={prevSlide}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            Next
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Final Actions */}
        {currentSlide === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex justify-center gap-4"
          >
            <Link
              href="/therapy"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Session
            </Link>
            <Link
              href="/therapy-history"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              View History
            </Link>
            <Link
              href="/transcript-review"
              className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              View Transcript
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
} 