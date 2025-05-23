'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Vyapari {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
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

export interface VyapariTransaction {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  items?: any;
  isApproved: boolean;
  createdAt: string;
}

export interface VyapariPayment {
  id: string;
  paymentId: string;
  amount: number;
  paymentMode: string;
  paymentDirection: 'to_vyapari' | 'from_vyapari'; // Payment to vyapari (we paid) or from vyapari (they paid)
  referenceNumber?: string;
  notes?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface CreateVyapariDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateVyapariDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
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
  paymentDirection: 'to_vyapari' | 'from_vyapari'; // Payment to vyapari (we paid) or from vyapari (they paid)
  referenceNumber?: string;
  notes?: string;
}

export function useVyapari() {
  const { toast } = useToast();

  // Fetch all vyaparis
  const fetchVyaparis = useCallback(async () => {
    try {
      const response = await fetch('/api/khata/vyaparis');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vyaparis');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching vyaparis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch traders',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch pending vyaparis (only for admin)
  const fetchPendingVyaparis = useCallback(async () => {
    try {
      const response = await fetch('/api/khata/vyaparis/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending approval vyaparis');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching pending vyaparis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch pending traders',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch a single vyapari by ID
  const fetchVyapariById = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vyapari details');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch trader details',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Create a new vyapari
  const createVyapari = useCallback(async (data: CreateVyapariDto) => {
    try {
      const response = await fetch('/api/khata/vyaparis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trader');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Trader created successfully',
      });
      
      return result;
    } catch (error: any) {
      console.error('Error creating vyapari:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create trader',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Update a vyapari
  const updateVyapari = useCallback(async (id: string, data: UpdateVyapariDto) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trader');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Trader updated successfully',
      });
      
      return result;
    } catch (error: any) {
      console.error(`Error updating vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update trader',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Approve or reject a vyapari (admin only)  
  const updateVyapariStatus = useCallback(async (id: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/approve`, {
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
          throw new Error(`Failed to ${approve ? 'approve' : 'reject'} trader. Status: ${response.status}`);
        }
        throw new Error(errorData.error || `Failed to ${approve ? 'approve' : 'reject'} trader`);
      }
      
      const result = await response.json();
      
      // Don't show toast here - let the component handle it
      // This prevents duplicate toasts
      
      return result;
    } catch (error: any) {
      console.error(`Error updating vyapari ${id} status:`, error);
      // Don't show toast here - let the component handle it
      throw error;
    }
  }, [toast]);

  // Fetch vyapari transactions
  const fetchVyapariTransactions = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/transactions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trader transactions');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching transactions for vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch trader transactions',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Create a vyapari transaction
  const createVyapariTransaction = useCallback(async (id: string, data: CreateTransactionDto) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/transactions`, {
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
      console.error(`Error creating transaction for vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Fetch vyapari payments
  const fetchVyapariPayments = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/payments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trader payments');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching payments for vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch trader payments',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Create a vyapari payment
  const createVyapariPayment = useCallback(async (id: string, data: CreatePaymentDto) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/payments`, {
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
      console.error(`Error creating payment for vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Calculate vyapari balance
  const calculateVyapariBalance = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/balance`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trader balance');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error calculating balance for vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate trader balance',
        variant: 'destructive',
      });
      return { balance: 0 };
    }
  }, [toast]);

  // Delete vyapari forcefully (ignoring foreign key constraints)
  const deleteVyapari = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/${id}/force-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete trader');
      }
      
      toast({
        title: 'Success',
        description: 'Trader deleted successfully',
      });
      
      return true;
    } catch (error: any) {
      console.error(`Error deleting vyapari ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trader',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);
  
  // Fetch pending vyapari transactions
  const fetchPendingVyapariTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/khata/vyaparis/transactions/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending transactions');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching pending vyapari transactions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch pending transactions',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch pending vyapari payments
  const fetchPendingVyapariPayments = useCallback(async () => {
    try {
      const response = await fetch('/api/khata/vyaparis/payments/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending payments');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching pending vyapari payments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch pending payments',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Approve or reject vyapari transaction
  const approveVyapariTransaction = useCallback(async (id: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/transactions/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${approve ? 'approve' : 'reject'} transaction`);
      }
      
      toast({
        title: 'Success',
        description: `Transaction ${approve ? 'approved' : 'rejected'} successfully`,
      });
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error approving/rejecting transaction ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${approve ? 'approve' : 'reject'} transaction`,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Approve or reject vyapari payment
  const approveVyapariPayment = useCallback(async (id: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/khata/vyaparis/payments/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${approve ? 'approve' : 'reject'} payment`);
      }
      
      toast({
        title: 'Success',
        description: `Payment ${approve ? 'approved' : 'rejected'} successfully`,
      });
      
      return await response.json();
    } catch (error: any) {
      console.error(`Error approving/rejecting payment ${id}:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${approve ? 'approve' : 'reject'} payment`,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    fetchVyaparis,
    fetchPendingVyaparis,
    fetchVyapariById,
    createVyapari,
    updateVyapari,
    updateVyapariStatus,
    fetchVyapariTransactions,
    createVyapariTransaction,
    fetchVyapariPayments,
    createVyapariPayment,
    calculateVyapariBalance,
    fetchPendingVyapariTransactions,
    fetchPendingVyapariPayments,
    approveVyapariTransaction,
    approveVyapariPayment,
    deleteVyapari
  };
}
