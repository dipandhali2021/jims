'use client';

import { useCallback } from 'react';
import { ProductRequestDetails } from './use-product-requests';

export function useAdminProductActions() {  // Create a log entry when admin creates a product
  const trackProductCreation = useCallback(async (productId: string, details: ProductRequestDetails) => {
    try {
      // Record the admin action for tracking purposes
      await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'add',
          productId,
          details,
          adminAction: true, // Flag to indicate this was a direct admin action
          // No longer auto-approved - admin will need to approve like regular requests
        }),
      });
    } catch (error) {
      console.error('Failed to track product creation:', error);
      // Don't throw error or show toast - this is background tracking
    }
  }, []);
  // Create a log entry when admin updates a product
  const trackProductUpdate = useCallback(async (productId: string, details: ProductRequestDetails) => {
    try {
      // Record the admin action for tracking purposes
      await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'edit',
          productId,
          details,
          adminAction: true, // Flag to indicate this was a direct admin action
          // No longer auto-approved - admin will need to approve like regular requests
        }),
      });
    } catch (error) {
      console.error('Failed to track product update:', error);
      // Don't throw error or show toast - this is background tracking
    }
  }, []);
  // Create a log entry when admin deletes a product
  const trackProductDeletion = useCallback(async (productId: string, productDetails: ProductRequestDetails) => {
    try {
      // Record the admin action for tracking purposes
      await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'delete',
          productId,
          details: productDetails,
          adminAction: true, // Flag to indicate this was a direct admin action
          // No longer auto-approved - admin will need to approve like regular requests
        }),
      });
    } catch (error) {
      console.error('Failed to track product deletion:', error);
      // Don't throw error or show toast - this is background tracking
    }
  }, []);

  return {
    trackProductCreation,
    trackProductUpdate,
    trackProductDeletion,
  };
}
