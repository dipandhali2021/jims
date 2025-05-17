import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface ProductStockProps {
  products: Array<{
    id: string;
    name: string;
    stock: number;
    value: number;
    imageUrl: string;
    lowStockThreshold?: number;
  }>;
}

export function ProductStockLevelsChart({ products = [] }: ProductStockProps) {
  const [displayCount, setDisplayCount] = useState(6);
  
  const idealStock = 30; // This could be configured per product or be a default
  
  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Top Products Stock Levels</CardTitle>
          <CardDescription>
            Current inventory for your most important products
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No product data available
          </div>
        ) : (
          <div className="space-y-4">
            {products.slice(0, displayCount).map((product, index) => {
              const lowStockThreshold = product.lowStockThreshold || 5;
              const isLowStock = product.stock <= lowStockThreshold;
              const isGoodStock = product.stock >= idealStock;
              const stockPercentage = Math.min(100, (product.stock / idealStock) * 100);
              
              return (
                <div key={product.id} className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <img 
                          src={product.imageUrl || "https://via.placeholder.com/40"}
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/40";
                          }}
                        />
                      </Avatar>
                      <div>
                        <p className="font-medium truncate max-w-[180px]">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Value: {formatCurrency(product.value)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">
                          {formatNumber(product.stock)} units
                        </span>
                        {isLowStock ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : isGoodStock ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isLowStock ? 'Low Stock' : isGoodStock ? 'Well Stocked' : 'Adequate'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stock level bar */}
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isLowStock 
                          ? 'bg-amber-500' 
                          : isGoodStock 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${stockPercentage}%` 
                      }}
                    />
                  </div>
                  
                  {/* Stock level indicator */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span className="font-medium">
                      {isLowStock 
                        ? `Below threshold (${lowStockThreshold})` 
                        : isGoodStock 
                          ? 'Optimal stock'
                          : 'Moderate stock'
                      }
                    </span>
                    <span>{formatNumber(idealStock)}</span>
                  </div>
                </div>
              );
            })}
            
            {products.length > displayCount && (
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={() => setDisplayCount(prev => prev + 4)}
              >
                Show More Products
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
