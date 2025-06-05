"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaCalendarAlt, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

interface TherapySession {
  date: string;
  insights: {
    title: string;
    description: string;
  }[];
  actions: {
    title: string;
    description: string;
    completed?: boolean;
  }[];
}

export default function TherapyHistory() {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load sessions from localStorage
    const storedSessions = localStorage.getItem('therapy_sessions');
    if (storedSessions) {
      const parsedSessions = JSON.parse(storedSessions);
      setSessions(Object.values(parsedSessions));
      calculateStreak(Object.values(parsedSessions));
    }
    setIsLoading(false);
  }, []);

  const calculateStreak = (sessions: TherapySession[]) => {
    if (sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let lastSessionDate = new Date(sessions[0].date);
    lastSessionDate.setHours(0, 0, 0, 0);

    // Check if the last session was today or yesterday
    const diffDays = Math.floor((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;

    currentStreak = 1;
    for (let i = 1; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysBetween = Math.floor((lastSessionDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        currentStreak++;
        lastSessionDate = sessionDate;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleActionComplete = (sessionDate: string, actionIndex: number) => {
    const updatedSessions = sessions.map(session => {
      if (session.date === sessionDate) {
        const updatedActions = [...session.actions];
        updatedActions[actionIndex] = {
          ...updatedActions[actionIndex],
          completed: !updatedActions[actionIndex].completed
        };
        return { ...session, actions: updatedActions };
      }
      return session;
    });

    setSessions(updatedSessions);
    localStorage.setItem('therapy_sessions', JSON.stringify(
      updatedSessions.reduce((acc, session) => ({ ...acc, [session.date]: session }), {})
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Therapy History</h1>
          <Link
            href="/therapy"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaCalendarAlt />
            Start New Session
          </Link>
        </div>

        {/* Streak Counter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl text-orange-500">
                <FaFire />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{streak} Day Streak</h2>
                <p className="text-gray-600">Keep up the great work!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Session List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Session History</h2>
            <div className="space-y-4">
              {sessions.map(session => (
                <motion.button
                  key={session.date}
                  onClick={() => setSelectedDate(session.date)}
                  className={`
                    w-full p-4 rounded-lg text-left transition-colors
                    ${selectedDate === session.date 
                      ? 'bg-blue-50 border-2 border-blue-500' 
                      : 'bg-gray-50 hover:bg-gray-100'}
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{formatDate(session.date)}</h3>
                      <p className="text-sm text-gray-600">
                        {session.actions.length} Action Items
                      </p>
                    </div>
                    <FaArrowRight className="text-gray-400" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Session Details */}
          <AnimatePresence mode="wait">
            {selectedDate ? (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Session on {formatDate(selectedDate)}
                </h2>
                
                {/* Action Items */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Action Items</h3>
                  <div className="space-y-3">
                    {sessions.find(s => s.date === selectedDate)?.actions.map((action, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          rounded-lg p-4 border-l-4
                          ${action.completed 
                            ? 'bg-green-50 border-green-400' 
                            : 'bg-blue-50 border-blue-400'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleActionComplete(selectedDate, index)}
                            className={`mt-1 ${action.completed ? 'text-green-500' : 'text-gray-400'}`}
                          >
                            <FaCheckCircle />
                          </button>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                            <p className="text-gray-600">{action.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center"
              >
                <p className="text-gray-500">Select a session to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 