import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface BillItem {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  hsn?: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  billType: string; // "GST" or "Non-GST"
  date: string;
  dateOfSupply?: string;
  timeOfSupply?: string;
  customerName: string;
  customerAddress?: string;
  customerState?: string;
  customerGSTIN?: string;
  items: BillItem[];
  totalAmount: number;
  sgst?: number;
  cgst?: number;
  igst?: number;
  hsnCodes?: any;
  transportMode?: string;
  vehicleNo?: string;
  placeOfSupply?: string;
  isTaxable?: boolean;
  isReverseCharge?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isFakeBill?: boolean;
}

export function useBills() {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all bills with optional search filter
  const fetchBills = useCallback(async (searchTerm?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/bills${searchParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      const data = await response.json();
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setError('Failed to load bills. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load bills. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch single bill by ID
  const fetchBill = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bills/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bill');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching bill:', error);
      setError('Failed to load bill. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load bill. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create a new bill
  const createBill = useCallback(async (billData: Partial<Bill>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bill');
      }
      
      const newBill = await response.json();
      // Don't update state for fake bills
      if (!billData.isFakeBill) {
        setBills((prevBills) => [newBill, ...prevBills]);
      }
      
      toast({
        title: 'Success',
        description: billData.isFakeBill 
          ? 'Temporary bill created successfully' 
          : 'Bill created successfully',
      });
      
      return newBill;
    } catch (error: any) {
      console.error('Error creating bill:', error);
      setError(error.message || 'Failed to create bill. Please try again.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bill. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update an existing bill
  const updateBill = useCallback(async (id: string, billData: Partial<Bill>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bill');
      }
      
      const updatedBill = await response.json();
      setBills((prevBills) => 
        prevBills.map((bill) => 
          bill.id === id ? updatedBill : bill
        )
      );
      
      toast({
        title: 'Success',
        description: 'Bill updated successfully',
      });
      
      return updatedBill;
    } catch (error: any) {
      console.error('Error updating bill:', error);
      setError(error.message || 'Failed to update bill. Please try again.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bill. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete a bill
  const deleteBill = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bill');
      }
      
      setBills((prevBills) => 
        prevBills.filter((bill) => bill.id !== id)
      );
      
      toast({
        title: 'Success',
        description: 'Bill deleted successfully',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      setError(error.message || 'Failed to delete bill. Please try again.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bill. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete old bills (older than two months)
  const deleteOldBills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bills', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete old bills');
      }
      
      const result = await response.json();
      
      // Refresh bills list
      fetchBills();
      
      toast({
        title: 'Success',
        description: result.message || 'Old bills deleted successfully',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting old bills:', error);
      setError(error.message || 'Failed to delete old bills. Please try again.');
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete old bills. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchBills]);

  return {
    bills,
    isLoading,
    error,
    fetchBills,
    fetchBill,
    createBill,
    updateBill,
    deleteBill,
    deleteOldBills,
  };
}
