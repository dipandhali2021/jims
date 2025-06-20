'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  CreditCard,
  Clock,
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
  Loader2,
  ArrowUpIcon,
  ArrowDownIcon,
  AlertCircle,
  AlarmClock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useVyapari, Vyapari, VyapariTransaction, VyapariPayment } from '@/hooks/use-vyapari';

interface VyapariDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  vyapariId: string | null;
}

export function VyapariDetailsDialog({
  open,
  onClose,
  vyapariId,
}: VyapariDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [vyapari, setVyapari] = useState<Vyapari | null>(null);
  const [transactions, setTransactions] = useState<VyapariTransaction[]>([]);
  const [payments, setPayments] = useState<VyapariPayment[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { 
    fetchVyapariById, 
    fetchVyapariTransactions, 
    fetchVyapariPayments,
    calculateVyapariBalance
  } = useVyapari();

  const loadVyapariData = useCallback(async () => {
    if (!vyapariId) return;
    setIsLoading(true);
    try {
      const vyapariData = await fetchVyapariById(vyapariId);
      setVyapari(vyapariData);
      const [transactionsData, paymentsData, balanceData] = await Promise.all([
        fetchVyapariTransactions(vyapariId),
        fetchVyapariPayments(vyapariId),
        calculateVyapariBalance(vyapariId)
      ]);
      setTransactions(transactionsData || []);
      setPayments(paymentsData || []);
      setBalance(balanceData?.balance || 0);
    } catch (error) {
      console.error('Error loading vyapari details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vyapari details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [vyapariId, fetchVyapariById, fetchVyapariTransactions, fetchVyapariPayments, calculateVyapariBalance, toast]);

  useEffect(() => {
    if (open && vyapariId) {
      loadVyapariData();
    }
  }, [open, vyapariId, loadVyapariData]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vyapari Details</DialogTitle>
          <DialogDescription>
            View vyapari information, transaction history, and payment records.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !vyapari ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">Vyapari Not Found</h3>
            <p className="text-sm text-muted-foreground">
              The requested vyapari information could not be loaded.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-secondary/30 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{vyapari.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {vyapari.isApproved ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200">
                      Approved
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200">
                      Pending Approval
                    </Badge>
                  )}
                  {vyapari.status === 'Active' ? (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200">
                      {vyapari.status}
                    </Badge>
                  )}
                </div>
                {vyapari.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{vyapari.phone}</span>
                  </div>
                )}
                {vyapari.email && (
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{vyapari.email}</span>
                  </div>
                )}
                {vyapari.address && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{vyapari.address}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Added by {vyapari.createdBy.firstName} {vyapari.createdBy.lastName} on {formatDate(vyapari.createdAt)}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-medium">Current Balance:</span>
                  <Badge variant={balance > 0 ? "destructive" : balance < 0 ? "default" : "outline"} className="text-md px-3 py-1">
                    {formatCurrency(Math.abs(balance))}
                    {balance !== 0 && (
                      balance > 0 
                        ? <span className="ml-1">(Pabe)</span>
                        : <span className="ml-1">(Pabo)</span>
                    )}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="italic">Note: Only approved transactions and payments are included in the balance calculation.</p>
              </div>
            </div>

            <Tabs defaultValue="transactions" className="flex-1 overflow-hidden flex flex-col" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="transactions">
                  <FileText className="h-4 w-4 mr-2" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payments
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="transactions" className="m-0 flex-1">
                <div className="overflow-x-auto" style={{ height: "calc(85vh - 200px)" }}>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2" />
                      <p>No transactions found</p>
                    </div>
                  ) : (
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{transaction.transactionId}</TableCell>
                              <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                {transaction.isApproved ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Approved</Badge>
                                ) : (
                                  <div className="flex items-center">
                                    <AlarmClock className="h-3 w-3 mr-1 text-yellow-500" />
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Pending</Badge>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={transaction.amount > 0 ? "text-green-500" : "text-red-500"}>
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
                
              <TabsContent value="payments" className="m-0 flex-1">
                <div className="overflow-x-auto" style={{ height: "calc(85vh - 200px)" }}>
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="mx-auto h-8 w-8 mb-2" />
                      <p>No payments found</p>
                    </div>
                  ) : (
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Payment ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Payment Mode</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{payment.paymentId}</TableCell>
                              <TableCell>{formatDate(payment.createdAt)}</TableCell>
                              <TableCell>{payment.paymentMode}</TableCell>
                              <TableCell>
                                {payment.isApproved ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Approved</Badge>
                                ) : (
                                  <div className="flex items-center">
                                    <AlarmClock className="h-3 w-3 mr-1 text-yellow-500" />
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Pending</Badge>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{payment.referenceNumber || '-'}</TableCell>
                              <TableCell className="text-right">
                                <span className="text-green-500">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
