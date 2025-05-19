'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Printer, 
  ArrowLeft, 
  ArrowRight,
  XCircle,
  Calendar,
  FileText,
  ReceiptText,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useBills, Bill } from '@/hooks/use-bills';
import { useToast } from '@/hooks/use-toast';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateManualBillDialog } from '@/components/bills/CreateManualBillDialog';
import { EditBillDialog } from '@/components/bills/EditBillDialog';
import { PrintBillButton } from '@/components/bills/PrintBillButton';
import { PrintAfterCreateDialog } from '@/components/bills/PrintAfterCreateDialog';

export default function BillsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { bills, isLoading, fetchBills, deleteBill, deleteOldBills } = useBills();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [showCleanupConfirmation, setShowCleanupConfirmation] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [newlyCreatedBill, setNewlyCreatedBill] = useState<Bill | null>(null);
  
  const itemsPerPage = 10;
  
  // Fetch bills on component mount
  useEffect(() => {
    fetchBills();
  }, [fetchBills]);
  
  // Filter bills based on search term and bill type
  const filteredBills = bills
    .filter((bill) => {
      // Search by customer name or bill number
      const matchesSearch = (
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Filter by bill type
      const matchesBillType = (
        billTypeFilter === 'all' ||
        (billTypeFilter === 'gst' && bill.billType === 'GST') ||
        (billTypeFilter === 'non-gst' && bill.billType === 'Non-GST')
      );
      
      return matchesSearch && matchesBillType;
    })
    // Sort by date with most recent first
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate paginated data
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredBills.length / itemsPerPage));
  
  // Handle bill creation success
  const handleBillCreated = (bill?: Bill) => {
    if (!bill) return;
    setNewlyCreatedBill(bill);
    setShowPrintDialog(true);
    fetchBills(); // Refresh the bills list
  };
  
  // Handle bill deletion
  const handleDeleteBill = async (id: string) => {
    setBillToDelete(id);
    setShowDeleteConfirmation(true);
  };
  
  const confirmDelete = async () => {
    if (billToDelete) {
      const success = await deleteBill(billToDelete);
      if (success) {
        setShowDeleteConfirmation(false);
        setBillToDelete(null);
      }
    }
  };
  
  // Handle cleaning up old bills
  const handleCleanupOldBills = async () => {
    setShowCleanupConfirmation(true);
  };
  
  const confirmCleanup = async () => {
    const success = await deleteOldBills();
    if (success) {
      setShowCleanupConfirmation(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format time ago for display
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Handle edit bill
  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsEditDialogOpen(true);
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleBillTypeChange = (value: string) => {
    setBillTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Calculate stats
  const totalBills = bills.length;
  const totalGSTBills = bills.filter(bill => bill.billType === 'GST').length;
  const totalNonGSTBills = bills.filter(bill => bill.billType === 'Non-GST').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Bills</h1>
        <p className="text-muted-foreground">View and manage all bills</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalBills}
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              GST Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalGSTBills}
              </div>
              <ReceiptText className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Non-GST Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalNonGSTBills}
              </div>
              <ReceiptText className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search bills..." 
              className="pl-9"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <Select value={billTypeFilter} onValueChange={handleBillTypeChange}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Bills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bills</SelectItem>
              <SelectItem value="gst">GST Bills</SelectItem>
              <SelectItem value="non-gst">Non-GST Bills</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleCleanupOldBills}
          >
            <Calendar className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Delete Expired</span>
            <span className="md:hidden">Cleanup</span>
          </Button>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Create Manual Bill</span>
            <span className="md:hidden">New Bill</span>
          </Button>
        </div>
      </div>
      
      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Bill #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Created By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBills.length > 0 ? (
                    paginatedBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">{bill.customerName}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {formatDate(bill.date)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>{formatDate(bill.date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(bill.date)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {bill.user ? (
                            <div className="text-sm">
                              {bill.user.firstName} {bill.user.lastName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">System</span>
                          )}
                        </TableCell>                        <TableCell>
                          <div className="font-semibold">₹{bill.totalAmount.toFixed(2)}</div>
                          {bill.billType === 'GST' && (
                            <div className="text-xs text-muted-foreground">
                              {(() => {                                // Extract GST percentages from bill items
                                let cgstPercentage = "9";
                                let sgstPercentage = "9";
                                let igstPercentage = "0";
                                let totalGstPercentage = "18";
                                
                                try {
                                  if (bill.items && typeof bill.items === 'object') {
                                    const items = bill.items as any;
                                    if (items._meta) {
                                      cgstPercentage = items._meta.cgstPercentage || "9";
                                      sgstPercentage = items._meta.sgstPercentage || "9";
                                      igstPercentage = items._meta.igstPercentage || "0";
                                      
                                      totalGstPercentage = (
                                        parseFloat(cgstPercentage) + 
                                        parseFloat(sgstPercentage) + 
                                        parseFloat(igstPercentage)
                                      ).toString();
                                    }
                                  }
                                } catch (e) {}
                                
                                // Show the appropriate GST breakdown based on which components are present
                                let gstLabel = "GST";
                                if (parseFloat(cgstPercentage) > 0 && parseFloat(sgstPercentage) > 0) {
                                  gstLabel = `CGST+SGST`;
                                } else if (parseFloat(igstPercentage) > 0) {
                                  gstLabel = `IGST`;
                                }
                                
                                return `Incl. ${gstLabel} (${totalGstPercentage}%): ₹${((bill.sgst || 0) + (bill.cgst || 0) + (bill.igst || 0)).toFixed(2)}`;
                              })()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={bill.billType === 'GST' ? "default" : "secondary"}
                            className={bill.billType === 'GST' 
                              ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900" 
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900"
                            }
                          >
                            {bill.billType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <PrintBillButton bill={bill} />
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              title="Edit Bill"
                              onClick={() => handleEditBill(bill)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Bill"
                              onClick={() => handleDeleteBill(bill.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Info className="h-8 w-8 mb-2" />
                          <p>No bills found</p>
                          <p className="text-sm">
                            {searchTerm || billTypeFilter !== 'all'
                              ? 'Try adjusting your search or filters'
                              : 'Create a bill to get started'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {filteredBills.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBills.length)} of {filteredBills.length} bills
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Create Manual Bill Dialog */}
      <CreateManualBillDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleBillCreated}
      />
      
      {/* Edit Bill Dialog */}
      {selectedBill && (
        <EditBillDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          bill={selectedBill}
          onSuccess={() => {
            fetchBills();
            toast({
              title: 'Bill Updated',
              description: 'The bill has been updated successfully',
            });
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cleanup Old Bills Confirmation Dialog */}
      <AlertDialog open={showCleanupConfirmation} onOpenChange={setShowCleanupConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expired Bills</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all bills that are older than 2 months. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCleanup}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Expired Bills
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>      </AlertDialog>
      
      {/* Print After Create Dialog */}
      {newlyCreatedBill && (
        <PrintAfterCreateDialog
          bill={newlyCreatedBill}
          open={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false);
            setNewlyCreatedBill(null);
          }}
        />
      )}
    </div>
  );
}