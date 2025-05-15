'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bell, RefreshCw, Trash2, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDialog() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Initial fetch when component mounts
    fetchNotifications();
    // // Set up periodic refresh every 30 seconds
    // const intervalId = setInterval(fetchNotifications, 30000);
    // // Cleanup interval on unmount
    // return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Helper function to get notification background color based on type
  const getNotificationBgColor = (type: string, isRead: boolean, message?: string) => {
    if (isRead) return 'bg-background';
    
    switch (type) {
      case 'sales_request':
        return 'bg-amber-50';
      case 'request_approved':
        return 'bg-green-50';
      case 'request_rejected':
        return 'bg-red-50';
      case 'status_update':
        // For status updates, check the message content
        if (message?.toLowerCase().includes('approved')) {
          return 'bg-green-50';
        } else if (message?.toLowerCase().includes('rejected')) {
          return 'bg-red-50';
        }
        return 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  // Helper function to get notification border color based on type
  const getNotificationBorderColor = (type: string, message?: string) => {
    switch (type) {
      case 'sales_request':
        return 'border-amber-200';
      case 'request_approved':
        return 'border-green-200';
      case 'request_rejected':
        return 'border-red-200';
      case 'status_update':
        // For status updates, check the message content
        if (message?.toLowerCase().includes('approved')) {
          return 'border-green-200';
        } else if (message?.toLowerCase().includes('rejected')) {
          return 'border-red-200';
        }
        return 'border-gray-200';
      default:
        return 'border-gray-200';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification');
      }

      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(notifications.filter((n) => n.id !== id));
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      setNotifications([]);
      toast({
        title: 'Success',
        description: 'All notifications deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete all notifications',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={5}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4">
            <h4 className="font-semibold">Notifications</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
              {notifications.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteAllNotifications}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete All</span>
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[300px] px-4">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No notifications
              </div>
            ) : (
              <div className="space-y-2">
                {notifications
                  .sort((a, b) => {
                    // First sort by read status (unread first)
                    if (a.isRead !== b.isRead) {
                      return a.isRead ? 1 : -1;
                    }
                    // Then sort by date within each group (newest first)
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getNotificationBgColor(notification.type, notification.isRead, notification.message)} ${getNotificationBorderColor(notification.type, notification.message)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm mb-1">{notification.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm text-muted-foreground"
                asChild
              >
                <Link href="/settings/notifications">
                  View all notifications
                </Link>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
