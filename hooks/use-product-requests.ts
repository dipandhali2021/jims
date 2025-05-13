import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export type ProductRequestDetails = {
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  material: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  supplier?: string;
};

export type ProductRequest = {
  id: string;
  requestId: string;
  requestType: 'add' | 'edit' | 'delete';
  status: 'Pending' | 'Approved' | 'Rejected';
  adminAction: boolean;  // Flag to indicate if this was a direct admin action
  requestDate: Date | string;
  userId: string;
  productId?: string | null;
  details?: ProductRequestDetails | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    material: string;
    imageUrl?: string;
    lowStockThreshold?: number;
    supplier?: string;
  } | null;
};

export function useProductRequests() {
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all product requests
  const fetchProductRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/product-requests');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch product requests');
      }
      
      const data = await response.json();
      setProductRequests(data);
    } catch (err: any) {
      console.error('Error fetching product requests:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: `Failed to load product requests: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update a product request status (approve or reject)
  const updateProductRequestStatus = useCallback(async (
    requestId: string,
    status: 'Approved' | 'Rejected'
  ) => {
    try {
      const response = await fetch(`/api/product-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status.toLowerCase()} request`);
      }

      const updatedRequest = await response.json();
      
      // Update the local state with the updated request
      setProductRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === requestId ? updatedRequest : request
        )
      );

      toast({
        title: 'Success',
        description: `Request ${status.toLowerCase()} successfully`,
      });

      return updatedRequest;
    } catch (err: any) {
      console.error(`Error updating product request to ${status}:`, err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Delete all product requests
  const deleteAllProductRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/product-requests', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product requests');
      }

      // Clear local state
      setProductRequests([]);
      
      toast({
        title: 'Success',
        description: 'All product requests deleted successfully',
      });
    } catch (err: any) {
      console.error('Error deleting product requests:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Create a new product request
  const createProductRequest = useCallback(async (
    requestType: 'add' | 'edit' | 'delete',
    productId?: string,
    details?: ProductRequestDetails
  ) => {
    try {
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestType, productId, details }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product request');
      }

      const newRequest = await response.json();
      
      // Update the local state with the new request
      setProductRequests((prevRequests) => [newRequest, ...prevRequests]);

      toast({
        title: 'Success',
        description: `Product ${requestType} request submitted successfully`,
      });

      return newRequest;
    } catch (err: any) {
      console.error('Error creating product request:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Fetch product requests on component mount
  useEffect(() => {
    fetchProductRequests();
  }, [fetchProductRequests]);

  return {
    productRequests,
    isLoading,
    error,
    fetchProductRequests,
    updateProductRequestStatus,
    deleteAllProductRequests,
    createProductRequest,
  };
}