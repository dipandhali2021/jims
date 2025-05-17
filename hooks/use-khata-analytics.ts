'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface KhataAnalytics {
  karigar: KarigarAnalytics | null;
  vyapari: VyapariAnalytics | null;
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
}

export interface KarigarAnalytics {
  totalKarigars: number;
  recentTransactions: {
    id: string;
    transactionId: string;
    karigarName: string;
    description: string;
    amount: number;
    createdAt: string;
  }[];
  totalTransactionAmount: number;
  monthlyTransactionCount: number;
  amountWeOwe: number;
  amountOwedToUs: number;
  topKarigars: {
    id: string;
    name: string;
    totalAmount: number;
  }[];
  transactionChart: {
    date: string;
    totalAmount: number;
    count: number;
  }[];
}

export interface VyapariAnalytics {
  totalVyaparis: number;
  recentTransactions: {
    id: string;
    transactionId: string;
    vyapariName: string;
    description: string;
    amount: number;
    createdAt: string;
  }[];
  totalTransactionAmount: number;
  monthlyTransactionCount: number;
  amountWeOwe: number;
  amountOwedToUs: number;
  topVyaparis: {
    id: string;
    name: string;
    totalAmount: number;
  }[];
  transactionChart: {
    date: string;
    totalAmount: number;
    count: number;
  }[];
}

export function useKhataAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch khata analytics data
  const fetchAnalytics = useCallback(async (days = 30, type = 'all') => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/khata/analytics?days=${days}&type=${type}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch khata analytics');
      }
      
      const data = await response.json();
      return data as KhataAnalytics;
    } catch (error: any) {
      console.error('Error fetching khata analytics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch khata analytics',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    fetchAnalytics,
  };
}
