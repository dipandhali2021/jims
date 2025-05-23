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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Edit,
  Trash,
  MoreHorizontal,
  UserCircle,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  FileText,
  CreditCard,
  SearchIcon,
  Loader2,
} from 'lucide-react';
import { CreateKarigarDialog } from './CreateKarigarDialog';
import { EditKarigarDialog } from './EditKarigarDialog';
import { KarigarDetailsDialog } from './KarigarDetailsDialog';
import { AddKarigarTransactionDialog } from './AddKarigarTransactionDialog';
import { AddKarigarPaymentDialog } from './AddKarigarPaymentDialog';
import { DeleteKarigarDialog } from './DeleteKarigarDialog';
import { useKarigar } from '@/hooks/use-karigar';

interface KarigarTabProps {
  isAdmin: boolean;
}

export function KarigarTab({ isAdmin }: KarigarTabProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKarigar, setSelectedKarigar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);  const [karigars, setKarigars] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, { approving: boolean, rejecting: boolean }>>({});

  const { fetchKarigars, updateKarigarStatus, fetchPendingKarigars, calculateKarigarBalance } = useKarigar();
  // Fetch Karigars
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchKarigars();
        setKarigars(data);
        
        // Fetch balances for each karigar
        const balanceData: Record<string, number> = {};
        for (const karigar of data) {
          const result = await calculateKarigarBalance(karigar.id);
          balanceData[karigar.id] = result.balance;
        }
        setBalances(balanceData);
        
        if (isAdmin) {
          const pendingData = await fetchPendingKarigars();
          setPendingApprovals(pendingData);
        }
      } catch (error) {
        console.error('Failed to load karigar data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load artisan data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();  }, [fetchKarigars, fetchPendingKarigars, calculateKarigarBalance, toast, isAdmin]);

  // Function to refresh balances after transactions or payments
  const refreshBalances = async () => {
    try {
      const balanceData: Record<string, number> = {};
      for (const karigar of karigars) {
        const result = await calculateKarigarBalance(karigar.id);
        balanceData[karigar.id] = result.balance;
      }
      setBalances(balanceData);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  };
  
  const handleApproveReject = async (id: string, approve: boolean) => {
    // Set the appropriate loading state
    setLoadingStates(prev => ({
      ...prev,
      [id]: {
        approving: approve,
        rejecting: !approve
      }
    }));
    
    try {
      await updateKarigarStatus(id, approve);
      
      if (!approve) {
        // If rejecting, immediately remove from the lists
        setKarigars(prev => prev.filter(k => k.id !== id));
        setPendingApprovals(prev => prev.filter(k => k.id !== id));
      } else {
        // If approving, refresh data to get updated status
        const data = await fetchKarigars();
        setKarigars(data);
        
        if (isAdmin) {
          const pendingData = await fetchPendingKarigars();
          setPendingApprovals(pendingData);
        }
      }
      
      toast({
        title: 'Success',
        description: `Artisan ${approve ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: `Failed to ${approve ? 'approve' : 'reject'} artisan. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      // Reset the loading state
      setLoadingStates(prev => ({
        ...prev,
        [id]: { approving: false, rejecting: false }
      }));
    }
  };

  const filteredKarigars = karigars.filter((karigar) => {
    const matchesSearch = karigar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (karigar.phone && karigar.phone.includes(searchTerm)) ||
      (karigar.email && karigar.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (karigar.specialization && karigar.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && karigar.isApproved) || 
      (statusFilter === 'pending' && !karigar.isApproved);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        {isAdmin && pendingApprovals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>
                    {pendingApprovals.length} artisan {pendingApprovals.length === 1 ? 'record' : 'records'} pending approval
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>                  <TableBody>
                    {pendingApprovals.map((karigar) => (
                      <TableRow 
                        key={karigar.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedKarigar(karigar);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <TableCell>{karigar.name}</TableCell>
                        <TableCell>
                          {karigar.phone && <div>{karigar.phone}</div>}
                          {karigar.email && <div className="text-xs text-gray-500">{karigar.email}</div>}
                        </TableCell>
                        <TableCell>{karigar.specialization || '-'}</TableCell>
                        <TableCell>
                          {karigar.createdBy.firstName} {karigar.createdBy.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(karigar.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleApproveReject(karigar.id, true)}
                              disabled={loadingStates[karigar.id]?.approving || loadingStates[karigar.id]?.rejecting}
                            >
                              {loadingStates[karigar.id]?.approving ? (
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
                              onClick={() => handleApproveReject(karigar.id, false)}
                              disabled={loadingStates[karigar.id]?.approving || loadingStates[karigar.id]?.rejecting}
                            >
                              {loadingStates[karigar.id]?.rejecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              <span className="sr-only">Reject</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedKarigar(karigar);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Artisans (KARIGAR)</CardTitle>
                <CardDescription>
                  Manage your artisans, their transactions, and payment records
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Karigar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search artisans..."
                    className="pl-9 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredKarigars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No artisans found. Try different search criteria or add a new artisan.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>                  <TableBody>
                    {filteredKarigars.map((karigar) => (
                      <TableRow 
                        key={karigar.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedKarigar(karigar);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <TableCell className="font-medium">{karigar.name}</TableCell>
                        <TableCell>
                          {karigar.phone && <div>{karigar.phone}</div>}
                          {karigar.email && <div className="text-xs text-gray-500">{karigar.email}</div>}
                        </TableCell>
                        <TableCell>{karigar.specialization || '-'}</TableCell>
                        <TableCell>
                          {karigar.isApproved ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                          )}
                        </TableCell>                        <TableCell>
                          <span className={`font-semibold ${
                            balances[karigar.id] !== undefined 
                              ? balances[karigar.id] < 0
                                ? 'text-green-600'
                                : balances[karigar.id] > 0
                                  ? 'text-red-600'
                                  : ''
                              : ''
                          }`}>
                            ₹{balances[karigar.id] !== undefined ? Math.abs(balances[karigar.id]).toFixed(2) : '...'}
                          </span>
                          {balances[karigar.id] !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              {balances[karigar.id] < 0
                                ? 'They owe you'
                                : balances[karigar.id] > 0
                                  ? 'You owe them'
                                  : 'No balance'}
                            </div>
                          )}
                        </TableCell>                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => {
                                setSelectedKarigar(karigar);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Add Transaction"
                              onClick={() => {
                                setSelectedKarigar(karigar);
                                setShowTransactionDialog(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Add Transaction</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Add Payment"
                              onClick={() => {
                                setSelectedKarigar(karigar);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                              <span className="sr-only">Add Payment</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              title="Delete Artisan"
                              onClick={() => {
                                setSelectedKarigar(karigar);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete Artisan</span>
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
      </div>

      {/* Dialogs */}      {showCreateDialog && (
        <CreateKarigarDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onKarigarCreated={async () => {
            setShowCreateDialog(false);
            const data = await fetchKarigars();
            setKarigars(data);
            refreshBalances();
          }}
        />
      )}      {showEditDialog && selectedKarigar && (
        <EditKarigarDialog
          open={showEditDialog}
          karigar={selectedKarigar}
          onClose={() => setShowEditDialog(false)}
          onKarigarUpdated={async () => {
            setShowEditDialog(false);
            const data = await fetchKarigars();
            setKarigars(data);
            refreshBalances();
          }}
        />
      )}      {showDetailsDialog && selectedKarigar && (
        <KarigarDetailsDialog
          open={showDetailsDialog}
          karigarId={selectedKarigar.id}
          onClose={() => {
            setShowDetailsDialog(false);
            // Refresh the balance for this karigar when details dialog is closed
            calculateKarigarBalance(selectedKarigar.id).then(result => {
              setBalances(prev => ({
                ...prev,
                [selectedKarigar.id]: result.balance
              }));
            });
          }}
        />
      )}      {showTransactionDialog && selectedKarigar && (
        <AddKarigarTransactionDialog
          open={showTransactionDialog}
          karigar={selectedKarigar}
          onClose={() => setShowTransactionDialog(false)}
          onTransactionAdded={async () => {
            setShowTransactionDialog(false);
            // Refresh the balance for this karigar
            const result = await calculateKarigarBalance(selectedKarigar.id);
            setBalances(prev => ({
              ...prev,
              [selectedKarigar.id]: result.balance
            }));
          }}
        />
      )}
        {showPaymentDialog && selectedKarigar && (
        <AddKarigarPaymentDialog
          open={showPaymentDialog}
          karigar={selectedKarigar}
          onClose={() => setShowPaymentDialog(false)}
          onPaymentAdded={async () => {
            setShowPaymentDialog(false);
            // Refresh the balance for this karigar
            const result = await calculateKarigarBalance(selectedKarigar.id);
            setBalances(prev => ({
              ...prev,
              [selectedKarigar.id]: result.balance
            }));
          }}
        />
      )}
        {showDeleteDialog && selectedKarigar && (
        <DeleteKarigarDialog
          open={showDeleteDialog}
          karigarId={selectedKarigar.id}
          karigarName={selectedKarigar.name}
          onClose={() => setShowDeleteDialog(false)}
          onDelete={async () => {
            setShowDeleteDialog(false);
            // Remove the karigar from the list
            setKarigars(prev => prev.filter(v => v.id !== selectedKarigar.id));
          }}
        />
      )}
    </>
  );
}
