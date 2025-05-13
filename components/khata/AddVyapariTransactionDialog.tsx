'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useVyapari, Vyapari, CreateTransactionDto } from '@/hooks/use-vyapari';

interface AddVyapariTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  vyapari: Vyapari | null;
}

export function AddVyapariTransactionDialog({
  open,
  onClose,
  onTransactionAdded,
  vyapari,
}: AddVyapariTransactionDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isCredit, setIsCredit] = useState(true); // true = we owe trader, false = trader owes us
  const [items, setItems] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { createVyapariTransaction } = useVyapari();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: 'Error',
        description: 'Description is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    if (!vyapari?.id) {
      toast({
        title: 'Error',
        description: 'Invalid trader data',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert amount to number and apply sign based on transaction type
      const numAmount = Number(amount);
      const finalAmount = isCredit ? numAmount : -numAmount;
      
      let parsedItems;
      if (items.trim()) {
        try {
          // Try to parse items as JSON if provided
          parsedItems = JSON.parse(items);
        } catch (error) {
          // If not valid JSON, store as a string
          parsedItems = items.trim();
        }
      }
      
      const transactionData: CreateTransactionDto = {
        description: description.trim(),
        amount: finalAmount,
        items: parsedItems || undefined
      };
      
      await createVyapariTransaction(vyapari.id, transactionData);
      
      // Reset form
      setDescription('');
      setAmount('');
      setIsCredit(true);
      setItems('');
      
      onTransactionAdded();
      onClose();
      
    } catch (error: any) {
      console.error('Failed to add transaction:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add transaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction for {vyapari?.name || 'Trader'}</DialogTitle>
          <DialogDescription>
            Add a new transaction to the trader's account.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Enter transaction description"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Type *
              </Label>
              <div className="col-span-3 flex gap-4">
                <Button
                  type="button"
                  variant={isCredit ? "default" : "outline"}
                  onClick={() => setIsCredit(true)}
                  className="flex-1"
                >
                  We Owe Trader
                </Button>
                <Button
                  type="button"
                  variant={!isCredit ? "default" : "outline"}
                  onClick={() => setIsCredit(false)}
                  className="flex-1"
                >
                  Trader Owes Us
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="items" className="text-right">
                Items
              </Label>
              <Textarea
                id="items"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                className="col-span-3"
                placeholder="Enter items data (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
