import { useState, useEffect, useCallback } from 'react';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  imageUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  refreshProducts: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refreshProducts: fetchProducts };
}