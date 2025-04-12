'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { Product } from '@/hooks/use-products';

interface CreateSalesRequestDialogProps {
  product: Product;
  onRequestCreated: () => void;
}

export function CreateSalesRequestDialog({
  product,
  onRequestCreated,
}: CreateSalesRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter customer name',
        variant: 'destructive',
      });
      return;
    }

    if (quantity < 1 || quantity > product.stock) {
      toast({
        title: 'Error',
        description: `Quantity must be between 1 and ${product.stock}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/sales-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerName,
          items: [
            {
              productId: product.id,
              quantity: quantity,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sales request');
      }

      toast({
        title: 'Success',
        description: 'Sales request created successfully',
      });

      onRequestCreated();
      setIsOpen(false);
      setCustomerName('');
      setQuantity(1);
    } catch (error) {
      console.error('Error creating sales request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create sales request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* <Button variant="outline" size="sm" className="flex-1"> */}
          {/* <ShoppingBag className="h-4 w-4 mr-1 flex" /> */}
          {/* Request Sale
        </Button> */}
        <Button 
                onClick={() => setIsOpen(true)}
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
      <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">Create Sales Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
            <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className={`text-sm ${quantity > product.stock ? 'text-red-500' : 'text-gray-500'}`}>
              Available stock: {product.stock}
            </p>
            </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Product Details</Label>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="font-medium text-gray-800">{product.name}</p>
              <p className="text-sm text-gray-500">Product ID: {product.sku}</p>
              <p className="text-sm font-medium mt-2 text-gray-800">
                Total: ₹{(product.price * quantity).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-4 bg-black text-white hover:bg-gray-900"
            >
              {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
              ) : (
              'Create Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}