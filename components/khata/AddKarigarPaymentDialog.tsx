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

import { Loader2 } from 'lucide-react';
import { useKarigar, Karigar, CreatePaymentDto } from '@/hooks/use-karigar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddKarigarPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
  karigar: Karigar | null;
}

export function AddKarigarPaymentDialog({
  open,
  onClose,
  onPaymentAdded,
  karigar,
}: AddKarigarPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { createKarigarPayment } = useKarigar();

  const paymentModes = [
    'Cash',
    'UPI',
    'Bank Transfer',
    'Cheque',
    'Credit Card',
    'Debit Card',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    if (!paymentMode) {
      toast({
        title: 'Error',
        description: 'Payment mode is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!karigar?.id) {
      toast({
        title: 'Error',
        description: 'Invalid artisan data',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentData: CreatePaymentDto = {
        amount: Number(amount),
        paymentMode: paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined
      };
      
      await createKarigarPayment(karigar.id, paymentData);
      
      // Reset form
      setAmount('');
      setPaymentMode('Cash');
      setReferenceNumber('');
      setNotes('');
      
      onPaymentAdded();
      onClose();
      
    } catch (error: any) {
      console.error('Failed to add payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment',
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
          <DialogTitle>Add Payment for {karigar?.name || 'Artisan'}</DialogTitle>
          <DialogDescription>
            Record a payment made to or received from this artisan.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="paymentMode" className="text-right">
                Mode *
              </Label>
              <Select
                value={paymentMode}
                onValueChange={setPaymentMode}
              >
                <SelectTrigger id="paymentMode" className="col-span-3">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referenceNumber" className="text-right">
                Reference
              </Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="col-span-3"
                placeholder="Enter reference number (optional)"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Enter payment notes (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
