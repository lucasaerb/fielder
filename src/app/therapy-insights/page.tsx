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
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [insightsComplete, setInsightsComplete] = useState(false);
  const [actionsComplete, setActionsComplete] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your session...');

  useEffect(() => {
    const analyzeSession = async () => {
      try {
        setLoadingMessage('Analyzing your session...');
        setLoadingInsights(true);
        setLoadingActions(true);
        setInsightsComplete(false);
        setActionsComplete(false);

        const conversationText = transcriptItems.map((item: TranscriptItem) => item.title).join('\n');

        // Start both API calls
        const insightsPromise = fetch('/api/generate-therapy-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation: conversationText })
        }).then(async (response) => {
          if (!response.ok) throw new Error('Failed to generate insights');
          const data = await response.json();
          setLoadingInsights(false);
          setInsightsComplete(true);
          return data;
        });

        const actionsPromise = fetch('/api/generate-therapy-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation: conversationText })
        }).then(async (response) => {
          if (!response.ok) throw new Error('Failed to generate actions');
          const data = await response.json();
          setLoadingActions(false);
          setActionsComplete(true);
          return data;
        });

        // Wait for both to complete
        const [insightsData, actionsData] = await Promise.all([insightsPromise, actionsPromise]);

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
              {therapyData?.insights ? (
                // Show insights when data is ready
                therapyData.insights.map((insight, index) => (
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
                ))
              ) : (
                // Show loading wheels when data isn't ready
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative w-16 h-16 mb-6">
                    <motion.div
                      className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg text-gray-600 mb-4"
                  >
                    Analyzing your session patterns...
                  </motion.p>
                  <div className="space-y-3 w-full max-w-2xl">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400"
                      >
                        <div className="animate-pulse">
                          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-blue-100 rounded w-full mb-1"></div>
                          <div className="h-3 bg-blue-100 rounded w-5/6"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
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
              {therapyData?.actions ? (
                // Show actions when data is ready
                therapyData.actions.map((action, index) => (
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
                ))
              ) : (
                // Show loading wheels when data isn't ready
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative w-16 h-16 mb-6">
                    <motion.div
                      className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg text-gray-600 mb-4"
                  >
                    Creating your action plan...
                  </motion.p>
                  <div className="space-y-3 w-full max-w-2xl">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400"
                      >
                        <div className="animate-pulse">
                          <div className="h-4 bg-green-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-green-100 rounded w-full mb-1"></div>
                          <div className="h-3 bg-green-100 rounded w-5/6"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 mb-8"
          >
            Analyzing Your Session
          </motion.h2>
          
          {/* Main Loading Animation */}
          <div className="relative w-32 h-32 mx-auto mb-12">
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

          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Insights Loading Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-6 rounded-lg border-2 transition-all duration-500 ${
                insightsComplete 
                  ? 'bg-green-50 border-green-400' 
                  : loadingInsights 
                    ? 'bg-blue-50 border-blue-400' 
                    : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {insightsComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : loadingInsights ? (
                  <div className="w-12 h-12 relative">
                    <motion.div
                      className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Session Insights</h3>
                  <p className="text-sm text-gray-600">
                    {insightsComplete ? 'Complete!' : loadingInsights ? 'Analyzing patterns...' : 'Waiting to start'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Actions Loading Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={`p-6 rounded-lg border-2 transition-all duration-500 ${
                actionsComplete 
                  ? 'bg-green-50 border-green-400' 
                  : loadingActions 
                    ? 'bg-blue-50 border-blue-400' 
                    : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {actionsComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : loadingActions ? (
                  <div className="w-12 h-12 relative">
                    <motion.div
                      className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Action Items</h3>
                  <p className="text-sm text-gray-600">
                    {actionsComplete ? 'Complete!' : loadingActions ? 'Creating action plan...' : 'Waiting to start'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-gray-600 text-lg"
          >
            {insightsComplete && actionsComplete 
              ? 'Analysis complete! Preparing your results...' 
              : loadingMessage}
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