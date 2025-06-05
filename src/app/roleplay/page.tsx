"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRoleplay, roleplayScenarios, type RoleplayScenario } from '../contexts/RoleplayContext';

export default function RoleplayPage() {
  const { setSelectedScenario } = useRoleplay();
  const router = useRouter();

  // Custom scenario for the discovery agent
  const discoveryScenario: RoleplayScenario = {
    id: 'discovery',
    name: 'Custom Scenario Discovery',
    description: 'Work with a family therapy-trained discovery agent to build a personalized roleplay scenario',
    systemPrompt: `You are a warm, experienced family therapist specializing in helping people practice and prepare for challenging life conversations through roleplay. You have years of experience in systemic family therapy, narrative therapy, and solution-focused approaches. Your expertise lies in creating safe spaces where people can explore difficult conversations and practice new ways of communicating before they face real-world situations.

Your role is to conduct a therapeutic conversation that helps users identify, explore, and fully develop a specific life event or scenario they want to roleplay. You will use family therapy techniques to uncover the deeper context, relationships, and emotional dynamics that will make their practice session meaningful and effective.

Start by greeting them warmly and explaining your purpose, then begin the discovery process to help them identify what conversation or life situation they want to practice.`
  };

  const handleDiscoveryMode = () => {
    setSelectedScenario(discoveryScenario);
    router.push('/roleplay/session');
  };

  const handlePreMadeScenario = (scenario: RoleplayScenario) => {
    setSelectedScenario(scenario);
    router.push('/roleplay/session');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Roleplay Experience
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select a pre-made scenario or work with our discovery agent to create a custom one
          </p>
        </div>

        {/* Discovery Agent Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Custom Scenario Discovery
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg border-2 border-blue-200">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.828-.46l-5.241 1.466a.75.75 0 01-.927-.928l1.466-5.241A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Work with Our Discovery Agent
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Our family therapy-trained discovery agent will guide you through a thoughtful conversation to identify and build out the perfect roleplay scenario for your specific situation. Through therapeutic techniques, we&apos;ll explore the relationships, context, and goals to create a meaningful practice experience.
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Explore your specific relationship dynamics</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Identify communication patterns and goals</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Build a personalized practice scenario</span>
                </div>
              </div>

              <button
                onClick={handleDiscoveryMode}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Start Discovery Session
              </button>
            </div>
          </div>
        </div>

        {/* Pre-made Scenarios Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Pre-Made Scenarios
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Or choose from these ready-to-use roleplay scenarios
          </p>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roleplayScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handlePreMadeScenario(scenario)}
                className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-left border border-gray-200 hover:border-gray-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {scenario.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{scenario.description}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                    Select Scenario
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 