'use client';

import { useState, useEffect } from 'react';
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
import { useVyapari, Vyapari } from '@/hooks/use-vyapari';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateSalesRequestDialogProps {
  product: Product;
  onRequestCreated: () => void;
}

export function CreateSalesRequestDialog({
  product,
  onRequestCreated,
}: CreateSalesRequestDialogProps) {  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]);
  const [selectedVyapariId, setSelectedVyapariId] = useState<string>('');
  const [isVyaparisLoading, setIsVyaparisLoading] = useState(false);
  const { toast } = useToast();
  const { fetchVyaparis } = useVyapari();

  // Load approved vyaparis when dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadVyaparis = async () => {
        try {
          setIsVyaparisLoading(true);
          const data = await fetchVyaparis();
          // Filter only approved vyaparis
          const approvedVyaparis = data.filter((v: Vyapari) => v.isApproved);
          setVyaparis(approvedVyaparis);
        } catch (error) {
          console.error('Error loading traders:', error);
          toast({
            title: 'Error',
            description: 'Failed to load traders',
            variant: 'destructive',
          });
        } finally {
          setIsVyaparisLoading(false);
        }
      };
      
      loadVyaparis();
    }
  }, [isOpen, fetchVyaparis, toast]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVyapariId || selectedVyapariId === 'none') {
      toast({
        title: 'Error',
        description: 'Please select a trader',
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
    }    try {      setIsLoading(true);

      // Find the selected trader to get the name
      const selectedVyapari = vyaparis.find(v => v.id === selectedVyapariId);
      const traderName = selectedVyapari ? selectedVyapari.name : '';

      const response = await fetch('/api/sales-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          customer: traderName, // Use trader name as customer name
          vyapariId: selectedVyapariId,
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
      });      onRequestCreated();
      setIsOpen(false);
      setQuantity(1);
      setSelectedVyapariId('');
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
        </DialogHeader>        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="vyapari" className="text-sm font-medium text-gray-700">Trader Name</Label>
            <Select
              value={selectedVyapariId}
              onValueChange={(value) => setSelectedVyapariId(value)}
            >
              <SelectTrigger id="vyapari" className="w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select a trader" />
              </SelectTrigger>
              <SelectContent>
                {vyaparis.map((vyapari) => (
                  <SelectItem key={vyapari.id} value={vyapari.id}>
                    {vyapari.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isVyaparisLoading && <p className="text-sm text-gray-500">Loading traders...</p>}
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
            </p>            </div>
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