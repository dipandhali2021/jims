'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface Product {
  name: string;
  price: number;
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
}

interface ProductPreviewDialogProps {
  product: Product;
}

export function ProductPreviewDialog({ product }: ProductPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Format the price as currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(product.price);

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
                <h4 className="font-medium text-lg"> Price: {formattedPrice}</h4>
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
              </div>

              {product.supplier && (
                <div className="flex space-x-2 text-gray-600">
                  <span className="font-medium w-24">Supplier:</span>
                  <span className="flex-1">{product.supplier}</span>
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
