'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Product } from '@/hooks/use-products';

interface DeleteProductRequestDialogProps {
  product: Product;
  onRequestCreated: () => void;
}

export function DeleteProductRequestDialog({
  product,
  onRequestCreated,
}: DeleteProductRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Create form data for API request
      const formData = new FormData();
      formData.append('requestType', 'delete');
      formData.append('productId', product.id);

      // Send request to API
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create delete product request');
      }

      toast({
        title: 'Success',
        description: 'Product deletion request submitted. Waiting for admin approval.',
      });

      setIsOpen(false);
      onRequestCreated();
    } catch (error) {
      console.error('Error creating product deletion request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create deletion request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Request Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Request Product Deletion
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            This will send a request to delete this product. An admin will need to review and approve this request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">Product ID: {product.sku}</p>
            <div className="flex items-center mt-2">
              <span className="text-sm font-medium text-gray-700">
                Price: ₹{product.price?.toLocaleString()}
              </span>
              <span className="text-sm text-gray-700 ml-4">
                Stock: {product.stock}
              </span>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-gray-600">
            Are you sure you want to request deletion of this product? This action cannot be undone once approved.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            variant="destructive"
            className="px-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Request Deletion'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}