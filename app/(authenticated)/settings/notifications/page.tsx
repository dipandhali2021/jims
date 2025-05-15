'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bell, RefreshCw, Trash2, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

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

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data);
      // Reset to first page when new data is fetched
      setCurrentPage(1);
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
    fetchNotifications();
  }, [fetchNotifications]);

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

  // Sort notifications - unread first, then by date
  const sortedNotifications = [...notifications].sort((a, b) => {
    // First sort by read status (unread first)
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // Then sort by date within each group (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate total pages
  const totalPages = Math.ceil(sortedNotifications.length / itemsPerPage);
  
  // Get current page notifications
  const paginatedNotifications = sortedNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto max-w-3xl h-full py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
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
        </CardHeader>
        <CardContent>
          <div className="divide-y flex flex-col divide-border gap-2">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notifications
              </div>
            ) : (
              paginatedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`py-2 rounded-md border ${
                    getNotificationBgColor(notification.type, notification.isRead, notification.message)
                  } ${getNotificationBorderColor(notification.type, notification.message)}`}
                >
                  <div className="flex justify-between items-start gap-4 p-2 ">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium mb-1 truncate">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground break-words">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {notifications.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedNotifications.length)} of {sortedNotifications.length} notifications
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  // Show at most 3 page numbers
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;
                  
                  if (pageNum <= 3) {
                    return (
                      <Button
                        key={i}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isActive}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                {totalPages > 3 && (
                  <span className="mx-1">...</span>
                )}
                
                {totalPages > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    {totalPages}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}