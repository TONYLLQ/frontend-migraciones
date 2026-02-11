"use client"

import { useState, useEffect } from 'react';
import { getCurrentUser, type User } from '@/services/user-service';
import { isAuthenticated, logout } from '@/lib/auth';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      getCurrentUser()
        .then(user => setCurrentUser(user))
        .catch(err => {
          console.error("Failed to fetch user", err);
          // If 401, maybe logout? For now just log.
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    user: currentUser,
    isLoading,
    role: currentUser?.role,
    // Helpers based on role
    isCoordinator: currentUser?.role === 'COORDINATOR',
    isAnalyst: currentUser?.role === 'ANALYST',
    isViewer: currentUser?.role === 'VIEWER',
    logout // Expose logout function
  };
}
