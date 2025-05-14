'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Karigar {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  specialization?: string;
  status: string;
  isApproved: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KarigarTransaction {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  items?: any;
  createdAt: string;
}

export interface KarigarPayment {
  id: string;
  paymentId: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateKarigarDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  specialization?: string;
}

export interface UpdateKarigarDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  specialization?: string;
  status?: string;
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  items?: any;
}

export interface CreatePaymentDto {
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  notes?: string;
}

export function useKarigar() {
  const { toast } = useToast();

  // Fetch all karigars
  const fetchKarigars = useCallback(async () => {
    try {
      const response = await fetch('/api/khata/karigars');
      
      if (!response.ok) {
        throw new Error('Failed to fetch karigars');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching karigars:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch artisans',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch pending karigars (only for admin)
  const fetchPendingKarigars = useCallback(async () => {
    try {
      const response = await fetch('/api/khata/karigars/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending approval karigars');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching pending karigars:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch pending artisans',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch a single karigar by ID
  const fetchKarigarById = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch karigar details');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch artisan details',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Create a new karigar
  const createKarigar = useCallback(async (data: CreateKarigarDto) => {
    try {
      const response = await fetch('/api/khata/karigars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create artisan');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Artisan created successfully',
      });
      
      return result;
    } catch (error: any) {
      console.error('Error creating karigar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create artisan',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Update a karigar
  const updateKarigar = useCallback(async (id: string, data: UpdateKarigarDto) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update artisan');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Artisan updated successfully',
      });
      
      return result;
    } catch (error: any) {
      console.error(`Error updating karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update artisan',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);
  // Approve or reject a karigar (admin only)
  const updateKarigarStatus = useCallback(async (id: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });
      
      // Check if response is ok
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Failed to ${approve ? 'approve' : 'reject'} artisan. Status: ${response.status}`);
        }
        throw new Error(errorData.error || `Failed to ${approve ? 'approve' : 'reject'} artisan`);
      }
      
      const result = await response.json();
      
      // Don't show toast here - let the component handle it
      // This prevents duplicate toasts
      
      return result;
    } catch (error: any) {
      console.error(`Error updating karigar ${id} status:`, error);
      // Don't show toast here - let the component handle it
      throw error;
    }
  }, [toast]);

  // Fetch karigar transactions
  const fetchKarigarTransactions = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}/transactions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch artisan transactions');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching transactions for karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch artisan transactions',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Create a karigar transaction
  const createKarigarTransaction = useCallback(async (id: string, data: CreateTransactionDto) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
      
      return result;
    } catch (error: any) {
      console.error(`Error creating transaction for karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Fetch karigar payments
  const fetchKarigarPayments = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}/payments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch artisan payments');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching payments for karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch artisan payments',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Create a karigar payment
  const createKarigarPayment = useCallback(async (id: string, data: CreatePaymentDto) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Payment added successfully',
      });
      
      return result;
    } catch (error: any) {
      console.error(`Error creating payment for karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Calculate karigar balance
  const calculateKarigarBalance = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/karigars/${id}/balance`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch artisan balance');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error calculating balance for karigar ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate artisan balance',
        variant: 'destructive',
      });
      return { balance: 0 };
    }
  }, [toast]);

  return {
    fetchKarigars,
    fetchPendingKarigars,
    fetchKarigarById,
    createKarigar,
    updateKarigar,
    updateKarigarStatus,
    fetchKarigarTransactions,
    createKarigarTransaction,
    fetchKarigarPayments,
    createKarigarPayment,
    calculateKarigarBalance
  };
}
