'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  isRead: boolean;
}

export function useNotificationCount() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      // Silently handle errors in the count hook to avoid spam
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh every 30 seconds for real-time updates
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return unreadCount;
}