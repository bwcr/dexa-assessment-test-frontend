'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '@/lib/auth/auth-context';

interface NotificationContextType {
  showNotification: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
  notifications: Array<Notification>;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Array<Notification>>([]);
  const { user } = useAuth();

  const showNotification = (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
  ) => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Simulate profile update notifications
  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    if (!user) {
      return;
    }

    const checkForUpdates = () => {
      // This would typically be a WebSocket connection or Server-Sent Events
      // For demo purposes, we'll simulate random notifications
      const random = Math.random();
      if (random < 0.1) {
        // 10% chance every 30 seconds
        showNotification(
          'Profile update detected! Admin has been notified.',
          'info',
        );
      }
    };

    const interval = setInterval(checkForUpdates, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value: NotificationContextType = {
    showNotification,
    notifications,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
}
