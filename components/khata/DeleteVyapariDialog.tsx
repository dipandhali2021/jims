'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useVyapari } from '@/hooks/use-vyapari';
import { Loader2 } from 'lucide-react';

interface DeleteVyapariDialogProps {
  open: boolean;
  vyapariId: string;
  vyapariName: string;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteVyapariDialog({
  open,
  vyapariId,
  vyapariName,
  onClose,
  onDelete,
}: DeleteVyapariDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteVyapari } = useVyapari();
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteVyapari(vyapariId);
      if (result === true) {
        // Only call onDelete when the API call is successful
        onDelete();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting trader:', error);
      // Keep the dialog open if there was an error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Force Delete Trader</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2">
              You are about to forcefully delete the trader <strong>{vyapariName}</strong>.
            </p>
            <p className="mb-2 text-red-600 font-semibold">
              This action is irreversible and will delete all associated transactions, 
              payments, and other related records.
            </p>
            <p>
              Are you sure you want to continue?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
