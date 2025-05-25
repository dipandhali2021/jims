'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useVyapari } from '@/hooks/use-vyapari';
import { useKarigar } from '@/hooks/use-karigar';
import { cn } from '@/lib/utils';

interface ApprovalCounterProps {
  className?: string;
}

export function ApprovalCounter({ className }: ApprovalCounterProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState({
    vyapariTransactions: 0,
    vyapariPayments: 0,
    karigarTransactions: 0,
    karigarPayments: 0,
    total: 0
  });

  const {
    fetchPendingVyapariTransactions,
    fetchPendingVyapariPayments
  } = useVyapari();

  const {
    fetchPendingKarigarTransactions,
    fetchPendingKarigarPayments
  } = useKarigar();

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        setIsLoading(true);
        const [
          vyapariTrans,
          vyapariPay,
          karigarTrans,
          karigarPay
        ] = await Promise.all([
          fetchPendingVyapariTransactions(),
          fetchPendingVyapariPayments(),
          fetchPendingKarigarTransactions(),
          fetchPendingKarigarPayments()
        ]);

        const counts = {
          vyapariTransactions: vyapariTrans.length,
          vyapariPayments: vyapariPay.length,
          karigarTransactions: karigarTrans.length,
          karigarPayments: karigarPay.length,
          total: vyapariTrans.length + vyapariPay.length + karigarTrans.length + karigarPay.length
        };
        
        setPendingCount(counts);
      } catch (error) {
        console.error('Failed to fetch pending approval counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingCounts();
  }, [
    fetchPendingVyapariTransactions,
    fetchPendingVyapariPayments,
    fetchPendingKarigarTransactions,
    fetchPendingKarigarPayments
  ]);

  if (isLoading) {
    return (
      <Card className={cn("flex items-center justify-center h-[120px]", className)}>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading approvals...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingCount.total === 0) {
    return (
      <Card className={cn("h-[120px]", className)}>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-full">
              <ClipboardCheck className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <h3 className="font-medium">Approvals</h3>
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/khata/approvals')}
          >
            View
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-[120px]", className)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-700" />
          </div>
          <div>
            <h3 className="font-medium flex items-center">
              Pending Approvals <Badge variant="destructive" className="ml-2">{pendingCount.total}</Badge>
            </h3>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
              {pendingCount.vyapariTransactions > 0 && (
                <span className="inline-flex items-center bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                  Vyapari Trans: {pendingCount.vyapariTransactions}
                </span>
              )}
              {pendingCount.vyapariPayments > 0 && (
                <span className="inline-flex items-center bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                  Vyapari Payments: {pendingCount.vyapariPayments}
                </span>
              )}
              {pendingCount.karigarTransactions > 0 && (
                <span className="inline-flex items-center bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                  Karigar Trans: {pendingCount.karigarTransactions}
                </span>
              )}
              {pendingCount.karigarPayments > 0 && (
                <span className="inline-flex items-center bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                  Karigar Payments: {pendingCount.karigarPayments}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => router.push('/khata/approvals')}
          className="whitespace-nowrap"
        >
          Review Now
        </Button>
      </CardContent>
    </Card>
  );
}
