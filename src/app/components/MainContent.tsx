"use client";

import React from 'react';
import { useRoleplay } from '../contexts/RoleplayContext';
import App from '../App';
import RoleplaySettings from './RoleplaySettings';

export default function MainContent() {
  const { isSettingsComplete } = useRoleplay();

  return isSettingsComplete ? <App /> : <RoleplaySettings />;
} 