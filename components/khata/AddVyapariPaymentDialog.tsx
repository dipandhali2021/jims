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
import { useVyapari, Vyapari, CreatePaymentDto } from '@/hooks/use-vyapari';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@clerk/nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddVyapariPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
  vyapari: Vyapari | null;
}

export function AddVyapariPaymentDialog({
  open,
  onClose,
  onPaymentAdded,
  vyapari,
}: AddVyapariPaymentDialogProps) {  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');  
  const [paymentDirection, setPaymentDirection] = useState<'to_vyapari' | 'from_vyapari'>('to_vyapari');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { createVyapariPayment } = useVyapari();
  
  // Check if user is admin on component mount
  const { user } = useUser();
  
  useEffect(() => {
    const userRole = user?.publicMetadata?.role as string;
    setIsAdmin(userRole === 'admin');
  }, [user]);

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
        const paymentData: CreatePaymentDto = {
        amount: Number(amount),
        paymentMode: paymentMode,
        paymentDirection: paymentDirection,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined
      };
      
      await createVyapariPayment(vyapari.id, paymentData);
        // Reset form
      setAmount('');
      setPaymentMode('Cash');
      setPaymentDirection('to_vyapari');
      setReferenceNumber('');
      setNotes('');
      
      onPaymentAdded();
      onClose();
      
      // Show appropriate toast message based on admin status
      if (!isAdmin) {
        toast({
          title: 'Payment Submitted',
          description: 'Your payment has been submitted and is awaiting admin approval',
        });
      }
      
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
      <DialogContent className="sm:max-w-[425px]">        <DialogHeader>
          <DialogTitle>Add Payment for {vyapari?.name || 'Trader'}</DialogTitle>
          <DialogDescription>
            Record a payment made to or received from this trader.
          </DialogDescription>
        </DialogHeader>
        
        {!isAdmin && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Admin Approval Required</AlertTitle>
            <AlertDescription>
              This payment will require admin approval before it's reflected in the balance.
            </AlertDescription>
          </Alert>
        )}
        
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
              <Label htmlFor="paymentDirection" className="text-right">
                Direction *
              </Label>
              <Select
                value={paymentDirection}
                onValueChange={setPaymentDirection}
              >
                <SelectTrigger id="paymentDirection" className="col-span-3">
                  <SelectValue placeholder="Select payment direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_vyapari">Paid to Trader</SelectItem>
                  <SelectItem value="from_vyapari">Received from Trader</SelectItem>
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
