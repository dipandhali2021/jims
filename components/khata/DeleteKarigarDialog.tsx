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
import { useKarigar } from '@/hooks/use-karigar';
import { Loader2 } from 'lucide-react';

interface DeleteKarigarDialogProps {
  open: boolean;
  karigarId: string;
  karigarName: string;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteKarigarDialog({
  open,
  karigarId,
  karigarName,
  onClose,
  onDelete,
}: DeleteKarigarDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteKarigar } = useKarigar();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteKarigar(karigarId);
      if (result === true) {
        // Only call onDelete when the API call is successful
        onDelete();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting karigar:', error);
      // Keep the dialog open if there was an error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Force Delete Karigar</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2">
              You are about to forcefully delete the karigar <strong>{karigarName}</strong>.
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
