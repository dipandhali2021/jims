'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface Product {
  name: string;
  price: number;        // Bikroy Mullo (Selling Price)
  costPrice?: number;   // Kroy Mullo (Cost Price)
  sku: string;
  stock: number;
  category: string;
  material: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  imageUrl: string;
  supplier?: string;
  lowStockThreshold: number;
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

interface ProductPreviewDialogProps {
  product: Product;
}

export function ProductPreviewDialog({ product }: ProductPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Format the selling price as currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(product.price);
  
  // Format the cost price as currency (if available)
  const formattedCostPrice = product.costPrice 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'INR',
      }).format(product.costPrice)
    : 'Not available';

  // Format the dates (with time)
  const createdAt = new Date(product.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const updatedAt = new Date(product.updatedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[600px] p-0 bg-white rounded-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="bg-gray-100 flex items-center justify-center p-6 h-full">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="max-h-96 object-contain"
            />
          </div>
          
          {/* Product Details */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
              <p className="text-sm text-gray-500">Product ID: {product.sku}</p>
            </DialogHeader>
              <div className="space-y-4 flex-grow">
              <div>
                <h4 className="font-medium text-lg">Selling Price: {formattedPrice}</h4>
                {product.costPrice && (
                  <h4 className="font-medium">Cost Price: {formattedCostPrice}</h4>
                )}
                <p className="text-sm text-gray-500">In Stock: {product.stock}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-medium">Category</p>
                  <p className="text-gray-600">{product.category}</p>
                </div>
                <div>
                  <p className="font-medium">Material</p>
                  <p className="text-gray-600">{product.material}</p>
                </div>
              </div>
              
              {product.description && (
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                </div>
              )}

              <div className="flex space-x-2 text-gray-600">
                <span className="font-medium w-24">Stock:</span>
                <span className="flex-1">
                  {product.stock}{' '}
                  {product.stock <= product.lowStockThreshold && (
                    <span className="text-amber-600 text-xs bg-amber-100 rounded-full px-2 py-1 ml-2">
                      Low Stock
                    </span>
                  )}
                </span>
              </div>              {product.supplier && (                <div className="flex space-x-2 text-gray-600">
                  <span className="font-medium w-24">Supplier:</span>
                  <span className="flex-1">{product.supplier}</span>
                </div>
              )}
              
              {/* Long Set Product Parts */}
              {(product.isLongSet || product.longSetProduct) && product.longSetProduct?.parts && (
                <div className="mt-2">
                  <h4 className="font-medium text-md mb-2">Long Set Product Parts</h4>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm max-h-40 overflow-y-auto">
                    {product.longSetProduct.parts.map((part, index) => (
                      <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{part.partName}</span>
                          {part.costPrice && (
                            <span className="text-gray-600">
                              ₹{part.costPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {part.partDescription && (
                          <p className="text-gray-500 text-xs">{part.partDescription}</p>
                        )}
                        {part.karigar && (
                          <p className="text-purple-600 text-xs mt-1">
                            Made by: {part.karigar.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-evenly text-xs text-gray-500 mt-auto pt-4 border-t border-gray-200">
                <div className="flex flex-col">
                  <p>Created:</p>
                  <p> {createdAt}</p>
                  </div>
                <div className="flex flex-col ">
                  <p>Last Updated:</p>
                  <p>{updatedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
