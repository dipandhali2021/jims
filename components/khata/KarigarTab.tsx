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
import { useKarigar } from '@/hooks/use-karigar';

interface KarigarTabProps {
  isAdmin: boolean;
}

export function KarigarTab({ isAdmin }: KarigarTabProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedKarigar, setSelectedKarigar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [karigars, setKarigars] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const { fetchKarigars, updateKarigarStatus, fetchPendingKarigars } = useKarigar();

  // Fetch Karigars
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchKarigars();
        setKarigars(data);
        
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
    
    loadData();
  }, [fetchKarigars, fetchPendingKarigars, toast, isAdmin]);

  const handleApproveReject = async (id: string, approve: boolean) => {
    try {
      await updateKarigarStatus(id, approve);
      
      // Refresh data after status change
      const data = await fetchKarigars();
      setKarigars(data);
      
      if (isAdmin) {
        const pendingData = await fetchPendingKarigars();
        setPendingApprovals(pendingData);
      }
      
      toast({
        title: 'Success',
        description: `Artisan ${approve ? 'approved' : 'rejected'} successfully`,
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
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((karigar) => (
                      <TableRow key={karigar.id}>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleApproveReject(karigar.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => handleApproveReject(karigar.id, false)}
                            >
                              <XCircle className="h-4 w-4" />
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
                Add Artisan
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
                  </TableHeader>
                  <TableBody>
                    {filteredKarigars.map((karigar) => (
                      <TableRow key={karigar.id}>
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
                                  setSelectedKarigar(karigar);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedKarigar(karigar);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedKarigar(karigar);
                                  setShowTransactionDialog(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Add Transaction
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedKarigar(karigar);
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
        <CreateKarigarDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onKarigarCreated={async () => {
            setShowCreateDialog(false);
            const data = await fetchKarigars();
            setKarigars(data);
          }}
        />
      )}

      {showEditDialog && selectedKarigar && (
        <EditKarigarDialog
          open={showEditDialog}
          karigar={selectedKarigar}
          onClose={() => setShowEditDialog(false)}
          onKarigarUpdated={async () => {
            setShowEditDialog(false);
            const data = await fetchKarigars();
            setKarigars(data);
          }}
        />
      )}

      {showDetailsDialog && selectedKarigar && (
        <KarigarDetailsDialog
          open={showDetailsDialog}
          karigarId={selectedKarigar.id}
          onClose={() => setShowDetailsDialog(false)}
        />
      )}

      {showTransactionDialog && selectedKarigar && (
        <AddKarigarTransactionDialog
          open={showTransactionDialog}
          karigar={selectedKarigar}
          onClose={() => setShowTransactionDialog(false)}
          onTransactionAdded={() => {
            setShowTransactionDialog(false);
            // Could refresh karigar details here if needed
          }}
        />
      )}
      
      {showPaymentDialog && selectedKarigar && (
        <AddKarigarPaymentDialog
          open={showPaymentDialog}
          karigar={selectedKarigar}
          onClose={() => setShowPaymentDialog(false)}
          onPaymentAdded={() => {
            setShowPaymentDialog(false);
            // Could refresh karigar details here if needed
          }}
        />
      )}
    </>
  );
}
