"use client";

import React from 'react';
import { useRoleplay, roleplayScenarios } from '../contexts/RoleplayContext';

export default function RoleplaySettings() {
  const { setSelectedScenario } = useRoleplay();

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Choose Your Roleplay Scenario
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Select a scenario to practice your conversation skills
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {roleplayScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario)}
              className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {scenario.name}
              </h3>
              <p className="text-gray-600">{scenario.description}</p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Click to Start
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 