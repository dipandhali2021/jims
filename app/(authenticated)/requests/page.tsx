'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';
import {
  Search,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Box,
  Clock,
  Check,
  X,
  Filter,
  Loader2,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SalesItem {
  id: string;
  quantity: number;
  price: number;
  productName?: string;  // From schema update, for deleted products
  productSku?: string;   // From schema update, for deleted products
  product?: {
    name: string;
    sku: string;
  };
}

interface SalesRequest {
  id: string;
  requestId: string;
  customer: string;
  items: SalesItem[];
  totalValue: number;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function RequestsPage() {
  const { user } = useUser();
  const [salesRequests, setSalesRequests] = useState<SalesRequest[]>([]);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: {approving: boolean, rejecting: boolean}}>({});
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SalesRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const itemsPerPage = 8;
  const { toast } = useToast();
  
  // Indian timezone constant
  const TIMEZONE = 'Asia/Kolkata';
  
  // Format date in Indian timezone
  const formatIndianDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatTZ(toZonedTime(dateObj, TIMEZONE), formatStr, { timeZone: TIMEZONE });
  };
  
  // Format date with time in Indian timezone
  const formatIndianDateTime = (date: string | Date) => {
    return formatIndianDate(date, 'MMM dd, yyyy HH:mm');
  };

  const fetchSalesRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sales-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch sales requests');
      }
      const data = await response.json();
      
      // If user is not an admin, filter to show only their requests
      if (user?.publicMetadata?.role !== 'admin') {
        const filteredData = data.filter((request: SalesRequest) => request.userId === user?.id);
        setSalesRequests(filteredData);
      } else {
        // For admins, show all requests
        setSalesRequests(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchSalesRequests();
  }, [fetchSalesRequests]);

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: 'Approved' | 'Rejected'
  ) => {
    // Set the appropriate loading state
    setLoadingStates(prev => ({
      ...prev,
      [requestId]: {
        approving: newStatus === 'Approved' ? true : false,
        rejecting: newStatus === 'Rejected' ? true : false
      }
    }));
    try {
      const response = await fetch(`/api/sales-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update request status');
      }

      toast({
        title: 'Success',
        description: `Request ${newStatus.toLowerCase()} successfully`,
      });
await fetchSalesRequests();
      fetchSalesRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update request status',
        variant: 'destructive',
      });
    } finally {
      // Reset the loading state
      setLoadingStates(prev => ({
        ...prev,
        [requestId]: { approving: false, rejecting: false }
      }));
    }
  };

  const handleDeleteAllRequests = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/sales-requests', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sales requests');
      }

      toast({
        title: 'Success',
        description: 'All sales requests deleted successfully',
      });

      // Reset the current page to 1 and refresh the data
      setCurrentPage(1);
      await fetchSalesRequests();
      setShowDeleteConfirmation(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete sales requests',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = salesRequests.filter((request) => {
    const matchesSearch =
      request.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: salesRequests.length,
    pending: salesRequests.filter((r) => r.status === 'Pending').length,
    approved: salesRequests.filter((r) => r.status === 'Approved').length,
    rejected: salesRequests.filter((r) => r.status === 'Rejected').length,
  };

  const StatsCardSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-12 mt-2" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );

  const GridCardSkeleton = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <Skeleton className="h-20 w-full mb-4" />
        
        <div className="flex justify-end gap-1 w-full mt-4 pt-4 border-t">
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Filters and Actions Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[300px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Grid View Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <GridCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Calculate paginated data based on current page
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Sales Requests</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage pending sales requests from customers
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Requests
                </p>
                <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Box className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </p>
                <h3 className="text-2xl font-bold mt-2">{stats.pending}</h3>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Approved
                </p>
                <h3 className="text-2xl font-bold mt-2">{stats.approved}</h3>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rejected
                </p>
                <h3 className="text-2xl font-bold mt-2">{stats.rejected}</h3>
              </div>
              <div className="bg-red-500/10 p-3 rounded-full">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests..."
              className="pl-10 w-full sm:w-[250px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {/* Delete All Button (Admin only) */}
          {user?.publicMetadata?.role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteConfirmation(true)}
              title="Delete All Requests"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Delete All</span>
            </Button>
          )}
          
          {/* View Toggle Buttons */}
          <div className="border rounded-md flex">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-r-none ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-l-none ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List View</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {paginatedRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden h-full flex flex-col">
              <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-sm sm:text-base break-words">{request.requestId}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{request.customer}</p>
                    {user?.publicMetadata?.role === 'admin' && request.user && (
                      <p className="text-xs mt-1 text-blue-600 break-words">
                        Sent by: {request.user.firstName} {request.user.lastName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ml-1 flex-shrink-0 ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
                
                <div className="text-xs sm:text-sm mb-3 sm:mb-4 flex-grow">
                  <p className="text-gray-500">Items:</p>
                  <p className="break-words">
                    {request.items
                      .map((item) => `${item.product?.name || item.productName} (${item.quantity})`)
                      .join(', ')}
                  </p>
                  <p className="text-gray-500 mt-1">
                    Total Quantity: {request.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm mb-3 sm:mb-4">
                  <span className="text-gray-500">Total Value:</span>
                  <span className="font-medium">₹{request.totalValue.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm mb-3 sm:mb-4">
                  <span className="text-gray-500">Date:</span>
                  <span>{formatIndianDate(request.requestDate)}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 w-full mt-auto pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-0 h-8 text-center justify-center"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 w-full" />
                    {/* <span className="text-xs sm:text-sm truncate">Details</span> */}
                  </Button>
                  {request.status === 'Pending' && user?.publicMetadata?.role === 'admin' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-0 h-8 text-center justify-center text-green-600 hover:text-green-700 disabled:opacity-50"
                        onClick={() => handleStatusUpdate(request.id, 'Approved')}
                        disabled={loadingStates[request.id]?.approving || loadingStates[request.id]?.rejecting}
                      >
                        {loadingStates[request.id]?.approving ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        )}
                        {/* <span className="text-xs sm:text-sm truncate">Approve</span> */}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-0 h-8 text-center justify-center text-red-600 hover:text-red-700 disabled:opacity-50"
                        onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                        disabled={loadingStates[request.id]?.approving || loadingStates[request.id]?.rejecting}
                      >
                        {loadingStates[request.id]?.rejecting ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        )}
                        {/* <span className="text-xs sm:text-sm truncate">Reject</span> */}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View (Responsive Table) */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">REQUEST ID</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">CUSTOMER</th>
                    {user?.publicMetadata?.role === 'admin' && (
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">SHOPKEEPER</th>
                    )}
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm hidden sm:table-cell">ITEMS</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">TOTAL QTY</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">TOTAL VALUE</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm hidden lg:table-cell">REQUEST DATE</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">STATUS</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 sm:p-4 font-medium text-xs sm:text-sm">{request.requestId}</td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm max-w-[100px] truncate">{request.customer}</td>
                      {user?.publicMetadata?.role === 'admin' && (
                        <td className="p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">
                          {request.user ? `${request.user.firstName} ${request.user.lastName}` : 'Unknown'}
                        </td>
                      )}
                      <td className="p-3 sm:p-4 text-xs sm:text-sm hidden sm:table-cell">
                        <span className="max-w-[150px] md:max-w-[200px] truncate inline-block">
                          {request.items
                            .map((item) => `${item.product?.name || item.productName} (${item.quantity})`)
                            .join(', ')}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">
                        {request.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium">
                        ₹{request.totalValue.toLocaleString()}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm hidden lg:table-cell">
                        {formatIndianDateTime(request.requestDate)}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View Details"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          {request.status === 'Pending' && user?.publicMetadata?.role === 'admin' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 disabled:opacity-50 h-8 w-8 p-0"
                                title="Approve Request"
                                onClick={() => handleStatusUpdate(request.id, 'Approved')}
                                disabled={loadingStates[request.id]?.approving || loadingStates[request.id]?.rejecting}
                              >
                                {loadingStates[request.id]?.approving ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 disabled:opacity-50 h-8 w-8 p-0"
                                title="Reject Request"
                                onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                                disabled={loadingStates[request.id]?.approving || loadingStates[request.id]?.rejecting}
                              >
                                {loadingStates[request.id]?.rejecting ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                                <span className="sr-only">Reject</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredRequests.length > 0 ? (
        <div className="flex justify-center mt-4 sm:mt-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden w-8 h-8 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(3, Math.ceil(filteredRequests.length / itemsPerPage)) }, (_, i) => {
                // Show at most 3 page numbers
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                
                if (pageNum <= 3) {
                  return (
                    <Button
                      key={i}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isActive}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}
              
              {Math.ceil(filteredRequests.length / itemsPerPage) > 3 && (
                <span className="mx-1">...</span>
              )}
              
              {Math.ceil(filteredRequests.length / itemsPerPage) > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(Math.ceil(filteredRequests.length / itemsPerPage))}
                  disabled={currentPage === Math.ceil(filteredRequests.length / itemsPerPage)}
                >
                  {Math.ceil(filteredRequests.length / itemsPerPage)}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              disabled={currentPage >= Math.ceil(filteredRequests.length / itemsPerPage)}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredRequests.length / itemsPerPage)))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden w-8 h-8 p-0"
              disabled={currentPage >= Math.ceil(filteredRequests.length / itemsPerPage)}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredRequests.length / itemsPerPage)))}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-muted/20 rounded-md mt-4 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground">No sales requests found matching your filters</p>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px] max-w-[90vw] bg-white p-4 sm:p-6 border-0 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Request ID</p>
                  <p className="font-medium text-sm sm:text-base text-gray-800">
                    {selectedRequest.requestId}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-sm sm:text-base text-gray-800">
                    {selectedRequest.customer}
                  </p>
                </div>
                {selectedRequest.user && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Shopkeeper</p>
                    <p className="font-medium text-sm sm:text-base text-gray-800">
                      {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedRequest.user.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Status</p>
                  <span
                    className={`px-2 py-1 mt-1 inline-block rounded-full text-xs whitespace-nowrap ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Date</p>
                  <p className="font-medium text-sm sm:text-base text-gray-800">
                    {new Date(selectedRequest.requestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedRequest.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded"
                    >
                      <div className="mb-2">
                        <p className="font-medium text-sm sm:text-base text-gray-800">
                          {item.product?.name || item.productName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Product ID: {item.product?.sku || item.productSku}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/70">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Unit Price:</p>
                          <p className="font-medium text-sm sm:text-base text-gray-800">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Quantity:</p>
                          <p className="font-medium text-sm sm:text-base text-gray-800">
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <p className="font-medium text-sm sm:text-base text-gray-800">Total Value:</p>
                <p className="font-bold text-sm sm:text-base text-gray-900">
                  ₹{selectedRequest.totalValue.toLocaleString()}
                </p>
              </div>

              {selectedRequest.status === 'Pending' && user?.publicMetadata?.role === 'admin' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, 'Approved');
                      setShowDetails(false);
                    }}
                    disabled={loadingStates[selectedRequest.id]?.approving || loadingStates[selectedRequest.id]?.rejecting}
                  >
                    {loadingStates[selectedRequest.id]?.approving ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                    )}
                    <span>Approve Request</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, 'Rejected');
                      setShowDetails(false);
                    }}
                    disabled={loadingStates[selectedRequest.id]?.approving || loadingStates[selectedRequest.id]?.rejecting}
                  >
                    {loadingStates[selectedRequest.id]?.rejecting ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                    )}
                    <span>Reject Request</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[450px] max-w-[90vw] bg-white p-4 sm:p-6 border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Delete All Requests
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete all sales requests? This action cannot be undone.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
              Warning: This will permanently delete all {salesRequests.length} sales requests from the database.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleDeleteAllRequests}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              <span>Delete All</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}