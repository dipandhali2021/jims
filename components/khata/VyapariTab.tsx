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
  const [selectedVyapari, setSelectedVyapari] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vyaparis, setVyaparis] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const { fetchVyaparis, updateVyapariStatus, fetchPendingVyaparis } = useVyapari();

  // Fetch Vyaparis
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchVyaparis();
        setVyaparis(data);
        
        if (isAdmin) {
          const pendingData = await fetchPendingVyaparis();
          setPendingApprovals(pendingData);
        }
      } catch (error) {
        console.error('Failed to load vyapari data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load trader data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchVyaparis, fetchPendingVyaparis, toast, isAdmin]);

  const handleApproveReject = async (id: string, approve: boolean) => {
    try {
      await updateVyapariStatus(id, approve);
      
      // Refresh data after status change
      const data = await fetchVyaparis();
      setVyaparis(data);
      
      if (isAdmin) {
        const pendingData = await fetchPendingVyaparis();
        setPendingApprovals(pendingData);
      }
      
      toast({
        title: 'Success',
        description: `Trader ${approve ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
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
                    {pendingApprovals.length} trader {pendingApprovals.length === 1 ? 'record' : 'records'} pending approval
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
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((vyapari) => (
                      <TableRow key={vyapari.id}>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleApproveReject(vyapari.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleApproveReject(vyapari.id, false)}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Reject</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedVyapari(vyapari);
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
                <CardTitle>Traders (VYAPARI)</CardTitle>
                <CardDescription>
                  Manage your traders, their transactions, and payment records
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Trader
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search traders..."
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
            ) : filteredVyaparis.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No traders found. Try different search criteria or add a new trader.
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
                  </TableHeader>
                  <TableBody>
                    {filteredVyaparis.map((vyapari) => (
                      <TableRow key={vyapari.id}>
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
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {/* This would come from a real calculation of transactions and payments */}
                            ₹0.00
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVyapari(vyapari);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVyapari(vyapari);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVyapari(vyapari);
                                  setShowTransactionDialog(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Add Transaction
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVyapari(vyapari);
                                  setShowPaymentDialog(true);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Add Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
          }}
        />
      )}

      {showEditDialog && selectedVyapari && (
        <EditVyapariDialog
          open={showEditDialog}
          vyapari={selectedVyapari}
          onClose={() => setShowEditDialog(false)}
          onVyapariUpdated={async () => {
            setShowEditDialog(false);
            const data = await fetchVyaparis();
            setVyaparis(data);
          }}
        />
      )}

      {showDetailsDialog && selectedVyapari && (
        <VyapariDetailsDialog
          open={showDetailsDialog}
          vyapariId={selectedVyapari.id}
          onClose={() => setShowDetailsDialog(false)}
        />
      )}

      {showTransactionDialog && selectedVyapari && (
        <AddVyapariTransactionDialog
          open={showTransactionDialog}
          vyapari={selectedVyapari}
          onClose={() => setShowTransactionDialog(false)}
          onTransactionAdded={() => {
            setShowTransactionDialog(false);
            // Could refresh vyapari details here if needed
          }}
        />
      )}
      
      {showPaymentDialog && selectedVyapari && (
        <AddVyapariPaymentDialog
          open={showPaymentDialog}
          vyapari={selectedVyapari}
          onClose={() => setShowPaymentDialog(false)}
          onPaymentAdded={() => {
            setShowPaymentDialog(false);
            // Could refresh vyapari details here if needed
          }}
        />
      )}
    </>
  );
}
