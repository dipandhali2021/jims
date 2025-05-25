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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Edit,
  Trash,
  MoreHorizontal,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  FileText,
  CreditCard,
  SearchIcon,
  Loader2,
} from 'lucide-react';
import { CreateVyapariDialog } from './CreateVyapariDialog';
import { EditVyapariDialog } from './EditVyapariDialog';
import { VyapariDetailsDialog } from './VyapariDetailsDialog';
import { AddVyapariTransactionDialog } from './AddVyapariTransactionDialog';
import { AddVyapariPaymentDialog } from './AddVyapariPaymentDialog';
import { DeleteVyapariDialog } from './DeleteVyapariDialog';
import { VyapariTabSkeleton } from './VyapariTabSkeleton';
import { useVyapari } from '@/hooks/use-vyapari';

interface VyapariTabProps {
  isAdmin: boolean;
}

export function VyapariTab({ isAdmin }: VyapariTabProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVyapari, setSelectedVyapari] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vyaparis, setVyaparis] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, { approving: boolean, rejecting: boolean }>>({});

  const { fetchVyaparis, updateVyapariStatus, fetchPendingVyaparis, calculateVyapariBalance } = useVyapari();

  // Fetch Vyaparis
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchVyaparis();
        setVyaparis(data);
        
        // Fetch balances for each vyapari
        const balanceData: Record<string, number> = {};
        for (const vyapari of data) {
          const result = await calculateVyapariBalance(vyapari.id);
          balanceData[vyapari.id] = result.balance;
        }
        setBalances(balanceData);
        
        if (isAdmin) {
          const pendingData = await fetchPendingVyaparis();
          setPendingApprovals(pendingData);
        }
      } catch (error) {
        console.error('Failed to load vyapari data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vyapari data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchVyaparis, fetchPendingVyaparis, calculateVyapariBalance, toast, isAdmin]);

  // Function to refresh balances after transactions or payments
  const refreshBalances = async () => {
    try {
      const balanceData: Record<string, number> = {};
      for (const vyapari of vyaparis) {
        const result = await calculateVyapariBalance(vyapari.id);
        balanceData[vyapari.id] = result.balance;
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
      await updateVyapariStatus(id, approve);
      
      if (!approve) {
        // If rejecting, immediately remove from the lists
        setVyaparis(prev => prev.filter(v => v.id !== id));
        setPendingApprovals(prev => prev.filter(v => v.id !== id));
      } else {
        // If approving, refresh data to get updated status
        const data = await fetchVyaparis();
        setVyaparis(data);
        
        if (isAdmin) {
          const pendingData = await fetchPendingVyaparis();
          setPendingApprovals(pendingData);
        }
      }
      
      toast({
        title: 'Success',
        description: `Vyapari ${approve ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: `Failed to ${approve ? 'approve' : 'reject'} vyapari. Please try again.`,
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

  const filteredVyaparis = vyaparis.filter((vyapari) => {
    const matchesSearch = vyapari.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vyapari.phone && vyapari.phone.includes(searchTerm)) ||
      (vyapari.email && vyapari.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && vyapari.isApproved) || 
      (statusFilter === 'pending' && !vyapari.isApproved);

    return matchesSearch && matchesStatus;
  });
  if (isLoading) {
    return <VyapariTabSkeleton />;
  }

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
                    {pendingApprovals.length} vyapari {pendingApprovals.length === 1 ? 'record' : 'records'} pending approval
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
                      <TableHead>Created By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader><TableBody>                    {pendingApprovals.map((vyapari) => (
                      <TableRow 
                        key={vyapari.id} 
                        className="hover:bg-muted/50"
                        onClick={() => {
                          toast({
                            title: 'Access Restricted',
                            description: 'Cannot view details of pending vyaparis until they are approved',
                            variant: 'default',
                          });
                        }}
                      >
                        <TableCell>{vyapari.name}</TableCell>
                        <TableCell>
                          {vyapari.phone && <div>{vyapari.phone}</div>}
                          {vyapari.email && <div className="text-xs text-gray-500">{vyapari.email}</div>}
                        </TableCell>
                        <TableCell>
                          {vyapari.createdBy.firstName} {vyapari.createdBy.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(vyapari.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleApproveReject(vyapari.id, true)}
                              disabled={loadingStates[vyapari.id]?.approving || loadingStates[vyapari.id]?.rejecting}
                            >
                              {loadingStates[vyapari.id]?.approving ? (
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
                              onClick={() => handleApproveReject(vyapari.id, false)}
                              disabled={loadingStates[vyapari.id]?.approving || loadingStates[vyapari.id]?.rejecting}
                            >
                              {loadingStates[vyapari.id]?.rejecting ? (
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vyaparis</CardTitle>
                <CardDescription>
                  Manage your vyaparis, their transactions, and payment records
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Vyapari
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search vyaparis..."
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
            </div>            {filteredVyaparis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No vyaparis found. Try different search criteria or add a new vyapari.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>                  <TableBody>
                    {filteredVyaparis.map((vyapari) => (
                      <TableRow 
                        key={vyapari.id} 
                        className={`hover:bg-muted/50 ${vyapari.isApproved ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (vyapari.isApproved) {
                            setSelectedVyapari(vyapari);
                            setShowDetailsDialog(true);
                          } else {
                            toast({
                              title: 'Access Restricted',
                              description: 'Cannot view details of pending vyaparis until they are approved',
                              variant: 'default',
                            });
                          }
                        }}
                      >
                        <TableCell className="font-medium">{vyapari.name}</TableCell>
                        <TableCell>
                          {vyapari.phone && <div>{vyapari.phone}</div>}
                          {vyapari.email && <div className="text-xs text-gray-500">{vyapari.email}</div>}
                        </TableCell>
                        <TableCell>
                          {vyapari.isApproved ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                          )}
                        </TableCell>                        <TableCell>
                          <span className={`font-semibold ${
                            balances[vyapari.id] !== undefined 
                              ? balances[vyapari.id] < 0
                                ? 'text-green-600'
                                : balances[vyapari.id] > 0
                                  ? 'text-red-600'
                                  : ''
                              : ''
                          }`}>
                            ₹{balances[vyapari.id] !== undefined ? Math.abs(balances[vyapari.id]).toFixed(2) : '...'}
                          </span>
                          {balances[vyapari.id] !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              {balances[vyapari.id] < 0
                                ? 'You have to pay them'
                                : balances[vyapari.id] > 0
                                  ? 'They have to pay you'
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
                                setSelectedVyapari(vyapari);
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
                              title="Add Payment"
                              onClick={() => {
                                setSelectedVyapari(vyapari);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                              <span className="sr-only">Add Payment</span>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                title="Delete Vyapari"
                                onClick={() => {
                                  setSelectedVyapari(vyapari);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete Vyapari</span>
                              </Button>
                            )}
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

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateVyapariDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onVyapariCreated={async () => {
            setShowCreateDialog(false);
            const data = await fetchVyaparis();
            setVyaparis(data);
            refreshBalances();
          }}
        />
      )}      {showEditDialog && selectedVyapari && (
        <EditVyapariDialog
          open={showEditDialog}
          vyapari={selectedVyapari}
          onClose={() => setShowEditDialog(false)}
          onVyapariUpdated={async () => {
            setShowEditDialog(false);
            const data = await fetchVyaparis();
            setVyaparis(data);
            refreshBalances();
          }}
        />
      )}      {showDetailsDialog && selectedVyapari && (
        <VyapariDetailsDialog
          open={showDetailsDialog}
          vyapariId={selectedVyapari.id}
          onClose={() => {
            setShowDetailsDialog(false);
            // Refresh the balance for this vyapari when details dialog is closed
            calculateVyapariBalance(selectedVyapari.id).then(result => {
              setBalances(prev => ({
                ...prev,
                [selectedVyapari.id]: result.balance
              }));
            });
          }}
        />
      )}

      {showTransactionDialog && selectedVyapari && (
        <AddVyapariTransactionDialog
          open={showTransactionDialog}
          vyapari={selectedVyapari}
          onClose={() => setShowTransactionDialog(false)}
          onTransactionAdded={async () => {
            setShowTransactionDialog(false);
            // Refresh the balance for this vyapari
            const result = await calculateVyapariBalance(selectedVyapari.id);
            setBalances(prev => ({
              ...prev,
              [selectedVyapari.id]: result.balance
            }));
          }}
        />
      )}
      
      {showPaymentDialog && selectedVyapari && (
        <AddVyapariPaymentDialog
          open={showPaymentDialog}
          vyapari={selectedVyapari}
          onClose={() => setShowPaymentDialog(false)}
          onPaymentAdded={async () => {
            setShowPaymentDialog(false);
            // Refresh the balance for this vyapari
            const result = await calculateVyapariBalance(selectedVyapari.id);
            setBalances(prev => ({
              ...prev,
              [selectedVyapari.id]: result.balance
            }));
          }}
        />
      )}

      {showDeleteDialog && selectedVyapari && (
        <DeleteVyapariDialog
          open={showDeleteDialog}
          vyapariId={selectedVyapari.id}
          vyapariName={selectedVyapari.name}
          onClose={() => setShowDeleteDialog(false)}
          onDelete={async () => {
            setShowDeleteDialog(false);
            // Remove the vyapari from the list
            setVyaparis(prev => prev.filter(v => v.id !== selectedVyapari.id));
          }}
        />
      )}
    </>
  );
}
