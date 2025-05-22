import { useState, useEffect, useCallback } from 'react';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  material: string;
  price: number;      // Bikroy Mullo (Selling Price)
  costPrice?: number; // Kroy Mullo (Cost Price)
  stock: number;
  lowStockThreshold: number;
  imageUrl: string;
  userId: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
  // Long Set Product related fields
  isLongSet?: boolean;
  longSetProduct?: {
    id: string;
    parts: {
      partName: string;
      partDescription?: string;
      costPrice?: number;
      karigar?: {
        id: string;
        name: string;
      } | null;
    }[];
  };
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
      setError(null);
      
      console.log('Fetching products from API...');
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products fetched successfully:', data.length, 'products');
      
      // Make sure we're setting a new array reference to trigger re-renders
      setProducts([...data]);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('Initial products fetch');
    fetchProducts();
    
    // Removed the refresh interval that was causing continuous refreshes
    
  }, [fetchProducts]);

  return { products, isLoading, error, refreshProducts: fetchProducts };
}