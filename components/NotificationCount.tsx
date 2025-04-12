'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  isRead: boolean;
}

export function useNotificationCount() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return unreadCount;
}