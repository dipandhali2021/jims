'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { Product, useProducts } from '@/hooks/use-products';
import { useAdminProductActions } from '@/hooks/use-admin-product-actions';

interface DeleteProductDialogProps {
  product: Product;
  onProductDeleted: () => Promise<void>;
}

export function DeleteProductDialog({ product, onProductDeleted }: DeleteProductDialogProps) {  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { trackProductDeletion } = useAdminProductActions();
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      // Create product details object for the delete request
      const productDetails = {
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category,
        material: product.material,
        imageUrl: product.imageUrl,
        supplier: product.supplier || undefined
      };
      
      // Instead of directly deleting, create a product delete request
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'delete',
          productId: product.id,
          details: productDetails,
          adminAction: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create delete request');
      }

      // Call the callback to refresh products
      await onProductDeleted();      toast({
        title: 'Success',
        description: 'Product deletion request created successfully. Please approve it in the Product Requests page.',
      });

      setIsOpen(false);
        
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="ghost" 
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[400px] p-6 bg-white rounded-lg shadow-lg border-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold">Delete Product</DialogTitle>
          <DialogDescription className="text-gray-500">
            Are you sure you want to delete <span className="font-medium">{product.name}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg mb-4">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-24 h-24 object-contain rounded" 
          />
          <div className="ml-4">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">Product ID: {product.sku}</p>
            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Product'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}