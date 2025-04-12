import { useState, useEffect, useCallback } from 'react';

interface UseLowStockThresholdReturn {
  threshold: number;
  isLoading: boolean;
  error: Error | null;
  updateThreshold: (newThreshold: number) => Promise<void>;
  refreshThreshold: () => Promise<void>;
}

export function useLowStockThreshold(): UseLowStockThresholdReturn {
  const [threshold, setThreshold] = useState<number>(10); // Default to 10
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreshold = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/low-stock-threshold');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setThreshold(data.threshold);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch threshold'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateThreshold = useCallback(async (newThreshold: number) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/low-stock-threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threshold: newThreshold }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setThreshold(data.threshold);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update threshold'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreshold();
  }, [fetchThreshold]);

  return { 
    threshold, 
    isLoading, 
    error, 
    updateThreshold,
    refreshThreshold: fetchThreshold 
  };
}