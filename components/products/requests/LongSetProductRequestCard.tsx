'use client';

import { ProductRequest } from '@/hooks/use-product-requests';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminActionBadge } from '@/components/products/AdminActionBadge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LongSetProductRequestCardProps {
  request: ProductRequest;
  onStatusChange: () => Promise<void>;
}

export function LongSetProductRequestCard({
  request,
  onStatusChange
}: LongSetProductRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const parts = request.details?.longSetParts ? JSON.parse(request.details.longSetParts) : [];

  const handleStatusUpdate = async (status: 'Approved' | 'Rejected') => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/product-requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${status.toLowerCase()} request`);
      }

      toast({
        title: 'Success',
        description: `Request ${status.toLowerCase()} successfully`,
      });

      await onStatusChange();
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{request.details?.name}</h3>
              <AdminActionBadge adminAction={request.adminAction} />
            </div>
            <p className="text-sm text-gray-500">
              Request ID: {request.requestId} • {formatDate(request.requestDate)}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            By: {request.user?.firstName} {request.user?.lastName}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium mb-2">Product Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">SKU:</span> {request.details?.sku}</p>
              <p><span className="font-medium">Category:</span> {request.details?.category}</p>
              <p><span className="font-medium">Material:</span> {request.details?.material}</p>
              <p><span className="font-medium">Price:</span> ₹{request.details?.price}</p>
              <p><span className="font-medium">Stock:</span> {request.details?.stock}</p>
              {request.details?.description && (
                <p><span className="font-medium">Description:</span> {request.details.description}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Parts Information</h4>
            <div className="space-y-3">
              {parts.map((part: any, index: number) => (
                <div key={index} className="border-b pb-2 last:border-0">
                  <p className="font-medium text-sm">{part.partName}</p>
                  {part.partDescription && (
                    <p className="text-sm text-gray-600">{part.partDescription}</p>
                  )}
                  {part.costPrice && (
                    <p className="text-sm text-gray-600">Cost: ₹{part.costPrice}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50 gap-2 justify-end">
        {request.status === 'Pending' ? (
          <>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('Rejected')}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject
            </Button>
            <Button
              onClick={() => handleStatusUpdate('Approved')}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve
            </Button>
          </>
        ) : (
          <div className="text-sm font-medium">
            Status: {request.status}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
