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
import { Loader2 } from 'lucide-react';
import { useVyapari, Vyapari, UpdateVyapariDto } from '@/hooks/use-vyapari';
import { useClerk } from '@clerk/nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditVyapariDialogProps {
  open: boolean;
  onClose: () => void;
  onVyapariUpdated: () => void;
  vyapari: Vyapari | null;
}

export function EditVyapariDialog({
  open,
  onClose,
  onVyapariUpdated,
  vyapari,
}: EditVyapariDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { updateVyapari } = useVyapari();
  const { user } = useClerk();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Load vyapari data when dialog opens or vyapari changes
  useEffect(() => {
    if (vyapari) {
      setName(vyapari.name || '');
      setPhone(vyapari.phone || '');
      setEmail(vyapari.email || '');
      setAddress(vyapari.address || '');
      setStatus(vyapari.status || 'Active');
    }
  }, [vyapari]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Name is required',
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
      
      const updateData: UpdateVyapariDto = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        status: status
      };
      
      await updateVyapari(vyapari.id, updateData);
      
      onVyapariUpdated();
      onClose();
      
    } catch (error: any) {
      console.error('Failed to update vyapari:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update vyapari',
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
          <DialogTitle>Edit Vyapari</DialogTitle>
          <DialogDescription>
            Update vyapari information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Enter vyapari name"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3"
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="Enter email address"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="col-span-3"
                placeholder="Enter address"
              />
            </div>
            
            {isAdmin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value)}
                >
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
