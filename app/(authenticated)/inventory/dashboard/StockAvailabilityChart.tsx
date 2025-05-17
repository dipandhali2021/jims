import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Custom color palette
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface StockAvailabilityChartProps {
  data: any[];
}

export function StockAvailabilityChart({ data }: StockAvailabilityChartProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch actual product data to calculate real stock per category
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const productData = await response.json();
          setProducts(productData);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, []);
  
  // Calculate actual stock totals by category from real product data
  const enhancedData = data ? data.map(category => {
    // Get all products that belong to this category
    const categoryProducts = products.filter(product => 
      product.category === category.name
    );
    
    // Calculate actual total stock for this category
    const actualTotalStock = categoryProducts.reduce((sum, product) => 
      sum + product.stock, 0
    );
    
    // Calculate percentage of total stock
    const totalStockCount = products.reduce((sum, product) => sum + product.stock, 0);
    const stockPercentage = totalStockCount > 0 
      ? Math.round((actualTotalStock / totalStockCount) * 100) 
      : 0;
    
    return {
      ...category,
      totalStock: actualTotalStock,
      stockPercentage
    };
  }).sort((a, b) => b.totalStock - a.totalStock) : [];

  return (
    <Card className="md:col-span-2">      <CardHeader>
        <CardTitle>Stock Availability by Category</CardTitle>
        <CardDescription>
          Total units in stock for each product category
        </CardDescription>
      </CardHeader><CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading stock data...</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={enhancedData}
                margin={{ top: 20, right: 80, left: 20, bottom: 20 }}
                layout="vertical"
                barSize={40}
              >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[0, 'dataMax + 20']}
                tickFormatter={(value) => formatNumber(value)}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
                fontWeight={500}
              />              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-md shadow-lg border text-sm">
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        <div className="grid grid-cols-2 gap-x-4 mt-1.5">
                          <p className="text-muted-foreground">Products:</p>
                          <p className="font-medium">{formatNumber(data.count)}</p>
                          <p className="text-muted-foreground">Total Stock:</p>
                          <p className="font-medium">{formatNumber(data.totalStock)} units</p>
                          <p className="text-muted-foreground">Stock Value:</p>
                          <p className="font-medium">{formatCurrency(data.value)}</p>
                          <p className="text-muted-foreground">% of Inventory:</p>
                          <p className="font-medium">{data.stockPercentage}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />              <Legend 
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: 10 }}
              />
              <Bar 
                name="Total Stock Units" 
                dataKey="totalStock" 
                fill="#4f46e5"
                radius={[0, 4, 4, 0]}
                animationDuration={1500}
                background={{ fill: '#f3f4f6' }}
              >
                {enhancedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.85}
                    strokeWidth={1}
                  />
                ))}
                <LabelList 
                  dataKey="totalStock" 
                  position="right"
                  formatter={(value: number) => `${formatNumber(value)} units`}
                  style={{ fill: '#374151', fontWeight: 600, fontSize: 12 }}
                  offset={10}
                />
              </Bar>            </BarChart>
          </ResponsiveContainer>
        </div>
        )}        <div className="mt-4 p-4 bg-muted/40 rounded-md">
          <div className="flex justify-between items-center mb-2 text-sm">
            <p className="font-medium text-muted-foreground">Category</p>
            <p className="font-medium text-muted-foreground">Actual Stock Level</p>
          </div>
          {enhancedData.slice(0, 5).map((category, idx) => (
            <div key={idx} className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">({category.count} products)</span>
              </div>
              <div className="text-sm font-medium">
                {formatNumber(category.totalStock)} units ({category.stockPercentage}% of inventory)
              </div>
            </div>
          ))}
          
          <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
            <p className="text-right">
              Based on actual product stock data across categories
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
