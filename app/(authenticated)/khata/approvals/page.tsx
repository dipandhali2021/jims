'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  FileText,
  CreditCard,
  Loader2,
  Clock,
  UserCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { useVyapari } from '@/hooks/use-vyapari';
import { useKarigar } from '@/hooks/use-karigar';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function KhataApprovals() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('vyapari-transactions');
  const [loadingStates, setLoadingStates] = useState<Record<string, { approving: boolean, rejecting: boolean }>>({});

  // Vyapari states
  const [pendingVyapariTransactions, setPendingVyapariTransactions] = useState<any[]>([]);
  const [pendingVyapariPayments, setPendingVyapariPayments] = useState<any[]>([]);
  const [isLoadingVyapariTransactions, setIsLoadingVyapariTransactions] = useState(true);
  const [isLoadingVyapariPayments, setIsLoadingVyapariPayments] = useState(true);

  // Karigar states
  const [pendingKarigarTransactions, setPendingKarigarTransactions] = useState<any[]>([]);
  const [pendingKarigarPayments, setPendingKarigarPayments] = useState<any[]>([]);
  const [isLoadingKarigarTransactions, setIsLoadingKarigarTransactions] = useState(true);
  const [isLoadingKarigarPayments, setIsLoadingKarigarPayments] = useState(true);

  const {
    fetchPendingVyapariTransactions,
    fetchPendingVyapariPayments,
    approveVyapariTransaction,
    approveVyapariPayment
  } = useVyapari();

  const {
    fetchPendingKarigarTransactions,
    fetchPendingKarigarPayments,
    approveKarigarTransaction,
    approveKarigarPayment
  } = useKarigar();

  // Fetch pending vyapari transactions
  useEffect(() => {
    const loadVyapariTransactions = async () => {
      try {
        setIsLoadingVyapariTransactions(true);
        const data = await fetchPendingVyapariTransactions();
        setPendingVyapariTransactions(data);
      } catch (error) {
        console.error('Failed to load pending vyapari transactions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending vyapari transactions',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingVyapariTransactions(false);
      }
    };
    
    if (activeTab === 'vyapari-transactions') {
      loadVyapariTransactions();
    }
  }, [activeTab, fetchPendingVyapariTransactions, toast]);

  // Fetch pending vyapari payments
  useEffect(() => {
    const loadVyapariPayments = async () => {
      try {
        setIsLoadingVyapariPayments(true);
        const data = await fetchPendingVyapariPayments();
        setPendingVyapariPayments(data);
      } catch (error) {
        console.error('Failed to load pending vyapari payments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending vyapari payments',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingVyapariPayments(false);
      }
    };
    
    if (activeTab === 'vyapari-payments') {
      loadVyapariPayments();
    }
  }, [activeTab, fetchPendingVyapariPayments, toast]);

  // Fetch pending karigar transactions
  useEffect(() => {
    const loadKarigarTransactions = async () => {
      try {
        setIsLoadingKarigarTransactions(true);
        const data = await fetchPendingKarigarTransactions();
        setPendingKarigarTransactions(data);
      } catch (error) {
        console.error('Failed to load pending karigar transactions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending karigar transactions',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingKarigarTransactions(false);
      }
    };
    
    if (activeTab === 'karigar-transactions') {
      loadKarigarTransactions();
    }
  }, [activeTab, fetchPendingKarigarTransactions, toast]);

  // Fetch pending karigar payments
  useEffect(() => {
    const loadKarigarPayments = async () => {
      try {
        setIsLoadingKarigarPayments(true);
        const data = await fetchPendingKarigarPayments();
        setPendingKarigarPayments(data);
      } catch (error) {
        console.error('Failed to load pending karigar payments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending karigar payments',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingKarigarPayments(false);
      }
    };
    
    if (activeTab === 'karigar-payments') {
      loadKarigarPayments();
    }
  }, [activeTab, fetchPendingKarigarPayments, toast]);

  // Handle vyapari transaction approval
  const handleVyapariTransactionApproval = async (id: string, approve: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        approving: approve,
        rejecting: !approve
      }
    }));
    
    try {
      await approveVyapariTransaction(id, approve);
      setPendingVyapariTransactions(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to handle vyapari transaction approval:', error);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [id]: { approving: false, rejecting: false }
      }));
    }
  };

  // Handle vyapari payment approval
  const handleVyapariPaymentApproval = async (id: string, approve: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        approving: approve,
        rejecting: !approve
      }
    }));
    
    try {
      await approveVyapariPayment(id, approve);
      setPendingVyapariPayments(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to handle vyapari payment approval:', error);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [id]: { approving: false, rejecting: false }
      }));
    }
  };

  // Handle karigar transaction approval
  const handleKarigarTransactionApproval = async (id: string, approve: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        approving: approve,
        rejecting: !approve
      }
    }));
    
    try {
      await approveKarigarTransaction(id, approve);
      setPendingKarigarTransactions(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to handle karigar transaction approval:', error);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [id]: { approving: false, rejecting: false }
      }));
    }
  };

  // Handle karigar payment approval
  const handleKarigarPaymentApproval = async (id: string, approve: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        approving: approve,
        rejecting: !approve
      }
    }));
    
    try {
      await approveKarigarPayment(id, approve);
      setPendingKarigarPayments(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to handle karigar payment approval:', error);
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [id]: { approving: false, rejecting: false }
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Khata Book Approvals</h1>
            <p className="text-muted-foreground">
              Approve or reject pending transactions and payments for vyaparis and karigars.
            </p>
          </div>
          <Button 
            className="flex items-center gap-2" 
            variant="outline" 
            onClick={() => router.push('/khata')}
          >
            Back to Khata Book
          </Button>
        </div>

        <Tabs defaultValue="vyapari-payments" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="vyapari-payments" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span>Vyapari Payments</span>
              {pendingVyapariPayments.length > 0 && (
                <Badge variant="secondary">{pendingVyapariPayments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="karigar-transactions" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Karigar Transactions</span>
              {pendingKarigarTransactions.length > 0 && (
                <Badge variant="secondary">{pendingKarigarTransactions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="karigar-payments" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span>Karigar Payments</span>
              {pendingKarigarPayments.length > 0 && (
                <Badge variant="secondary">{pendingKarigarPayments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

        

          {/* Vyapari Payments Tab */}
          <TabsContent value="vyapari-payments">
            <Card>
              <CardHeader>
                <CardTitle>Pending Vyapari Payments</CardTitle>
                <CardDescription>Review and approve payments created by shopkeepers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingVyapariPayments ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingVyapariPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending vyapari payments to approve
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment ID</TableHead>
                          <TableHead>Vyapari</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Mode</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingVyapariPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.paymentId}</TableCell>
                            <TableCell>{payment.vyapari.name}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.paymentMode}</TableCell>
                            <TableCell>
                              {payment.createdBy.firstName} {payment.createdBy.lastName}
                            </TableCell>
                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => handleVyapariPaymentApproval(payment.id, true)}
                                  disabled={loadingStates[payment.id]?.approving || loadingStates[payment.id]?.rejecting}
                                >
                                  {loadingStates[payment.id]?.approving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => handleVyapariPaymentApproval(payment.id, false)}
                                  disabled={loadingStates[payment.id]?.approving || loadingStates[payment.id]?.rejecting}
                                >
                                  {loadingStates[payment.id]?.rejecting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Karigar Transactions Tab */}
          <TabsContent value="karigar-transactions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Karigar Transactions</CardTitle>
                <CardDescription>Review and approve transactions created by shopkeepers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKarigarTransactions ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingKarigarTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending karigar transactions to approve
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Karigar</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingKarigarTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.transactionId}</TableCell>
                            <TableCell>{transaction.karigar.name}</TableCell>
                            <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                            <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              {transaction.createdBy.firstName} {transaction.createdBy.lastName}
                            </TableCell>
                            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => handleKarigarTransactionApproval(transaction.id, true)}
                                  disabled={loadingStates[transaction.id]?.approving || loadingStates[transaction.id]?.rejecting}
                                >
                                  {loadingStates[transaction.id]?.approving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => handleKarigarTransactionApproval(transaction.id, false)}
                                  disabled={loadingStates[transaction.id]?.approving || loadingStates[transaction.id]?.rejecting}
                                >
                                  {loadingStates[transaction.id]?.rejecting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Karigar Payments Tab */}
          <TabsContent value="karigar-payments">
            <Card>
              <CardHeader>
                <CardTitle>Pending Karigar Payments</CardTitle>
                <CardDescription>Review and approve payments created by shopkeepers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKarigarPayments ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingKarigarPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending karigar payments to approve
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment ID</TableHead>
                          <TableHead>Karigar</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Mode</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingKarigarPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.paymentId}</TableCell>
                            <TableCell>{payment.karigar.name}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.paymentMode}</TableCell>
                            <TableCell>
                              {payment.createdBy.firstName} {payment.createdBy.lastName}
                            </TableCell>
                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => handleKarigarPaymentApproval(payment.id, true)}
                                  disabled={loadingStates[payment.id]?.approving || loadingStates[payment.id]?.rejecting}
                                >
                                  {loadingStates[payment.id]?.approving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={() => handleKarigarPaymentApproval(payment.id, false)}
                                  disabled={loadingStates[payment.id]?.approving || loadingStates[payment.id]?.rejecting}
                                >
                                  {loadingStates[payment.id]?.rejecting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
