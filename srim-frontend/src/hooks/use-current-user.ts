
"use client"

import { useState, useEffect } from 'react';
import { MOCK_USERS } from '@/lib/mock-data';
import { UserRole } from '@/types/data-quality';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);

  const switchUser = (userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // Guardar en localStorage para persistencia básica en el prototipo
      localStorage.setItem('dq_guardian_user', userId);
    }
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem('dq_guardian_user');
    if (savedUserId) {
      const user = MOCK_USERS.find(u => u.id === savedUserId);
      if (user) setCurrentUser(user);
    }
  }, []);

  return {
    user: currentUser,
    role: currentUser.role as UserRole,
    switchUser,
    isCoordinator: currentUser.role === 'Coordinator',
    isAnalyst: currentUser.role === 'Analyst',
    isUser: currentUser.role === 'User'
  };
}
