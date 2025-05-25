'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import { useVyapari, Vyapari, CreateTransactionDto } from '@/hooks/use-vyapari';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@clerk/nextjs';

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
  const [isCredit, setIsCredit] = useState(true); // true = we owe Vyapari, false = Vyapari owes us
  const [items, setItems] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);  const [isAdmin, setIsAdmin] = useState(false);
  
  const { toast } = useToast();
  const { createVyapariTransaction } = useVyapari();
    // Check if user is admin on component mount
  const { user } = useUser();
  
  useEffect(() => {
    const userRole = user?.publicMetadata?.role as string;
    setIsAdmin(userRole === 'admin');
  }, [user]);

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
        description: 'Invalid vyapari data',
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
      
      // Show appropriate toast message based on admin status
      if (!isAdmin) {
        toast({
          title: 'Transaction Submitted',
          description: 'Your transaction has been submitted and is awaiting admin approval',
        });
      }
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
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transaction for {vyapari?.name || 'Vyapari'}</DialogTitle>
          <DialogDescription>
            Add a new transaction to the vyapari's account.
          </DialogDescription>
        </DialogHeader>
        
        {!isAdmin && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Admin Approval Required</AlertTitle>
            <AlertDescription>
              This transaction will require admin approval before it's reflected in the balance.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter transaction description"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                Type *
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant={isCredit ? "default" : "outline"}
                  onClick={() => setIsCredit(true)}
                  className="flex-1 sm:flex-[1_0_auto]"
                >
                  Vyapari Sold Us
                </Button>
                <Button
                  type="button"
                  variant={!isCredit ? "default" : "outline"}
                  onClick={() => setIsCredit(false)}
                  className="flex-1 sm:flex-[1_0_auto]"
                >
                  We Sold Vyapari
                </Button>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="items" className="text-sm font-medium">
                Items
              </Label>
              <Textarea
                id="items"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="Enter items data (optional)"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
