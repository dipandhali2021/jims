import { useState, useEffect, useCallback } from 'react';
import { Product } from './use-products';

export interface InventoryAnalytics {
  totalProducts: number;
  totalStockCount: number;
  totalStockValue: number;
  totalCostValue: number;
  potentialProfit: number;
  lowStockItems: number;
  categoryDistribution: {
    name: string;
    count: number;
    value: number;
  }[];
  materialDistribution: {
    name: string;
    count: number;
    value: number;
  }[];
  stockTrend: {
    date: string;
    stockCount: number;
    stockValue: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    stock: number;
    value: number;
    imageUrl: string;
  }[];
}

interface UseInventoryAnalyticsReturn {
  analytics: InventoryAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  refreshAnalytics: () => Promise<void>;
}

export function useInventoryAnalytics(): UseInventoryAnalyticsReturn {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all products first
      const productsResponse = await fetch('/api/products');
      
      if (!productsResponse.ok) {
        throw new Error(`HTTP error! status: ${productsResponse.status}`);
      }
      
      const products: Product[] = await productsResponse.json();
      
      // Calculate analytics locally
      const totalProducts = products.length;
      const totalStockCount = products.reduce((sum, product) => sum + product.stock, 0);
      const totalStockValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
      const totalCostValue = products.reduce((sum, product) => sum + ((product.costPrice || 0) * product.stock), 0);
      const potentialProfit = totalStockValue - totalCostValue;
      
      // Count products below their low stock threshold
      const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold).length;
      
      // Calculate category distribution
      const categoryMap = new Map<string, { count: number, value: number }>();
      products.forEach(product => {
        const category = product.category || 'Uncategorized';
        const currentCategory = categoryMap.get(category) || { count: 0, value: 0 };
        categoryMap.set(category, {
          count: currentCategory.count + 1,
          value: currentCategory.value + (product.price * product.stock)
        });
      });
      
      const categoryDistribution = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value
      }));
      
      // Calculate material distribution
      const materialMap = new Map<string, { count: number, value: number }>();
      products.forEach(product => {
        const material = product.material || 'Unspecified';
        const currentMaterial = materialMap.get(material) || { count: 0, value: 0 };
        materialMap.set(material, {
          count: currentMaterial.count + 1,
          value: currentMaterial.value + (product.price * product.stock)
        });
      });
      
      const materialDistribution = Array.from(materialMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value
      }));
      
      // Mock stock trend data (in real app, this would come from historical data)
      // For now, we'll create a mock 7-day trend
      const today = new Date();
      const stockTrend = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        
        // Create some random variation around the current stock level
        const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
        const stockCount = Math.floor(totalStockCount * randomFactor);
        const stockValue = Math.floor(totalStockValue * randomFactor);
        
        return {
          date: date.toISOString().split('T')[0],
          stockCount,
          stockValue
        };
      });
      
      // Top products by value
      const topProducts = [...products]
        .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
        .slice(0, 5)
        .map(product => ({
          id: product.id,
          name: product.name,
          stock: product.stock,
          value: product.price * product.stock,
          imageUrl: product.imageUrl
        }));
      
      setAnalytics({
        totalProducts,
        totalStockCount,
        totalStockValue,
        totalCostValue,
        potentialProfit,
        lowStockItems,
        categoryDistribution,
        materialDistribution,
        stockTrend,
        topProducts
      });
    } catch (err) {
      console.error('Error fetching inventory analytics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory analytics'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { 
    analytics, 
    isLoading, 
    error, 
    refreshAnalytics: fetchAnalytics 
  };
}