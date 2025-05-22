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
  PlusCircle,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
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
import {
  useProductRequests,
  ProductRequest,
} from '@/hooks/use-product-requests';
import { AdminActionBadge } from '@/components/products/AdminActionBadge';

export default function ProductRequestsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const {
    productRequests,
    isLoading,
    error,
    fetchProductRequests,
    updateProductRequestStatus,
    deleteAllProductRequests,
  } = useProductRequests();

  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: { approving: boolean; rejecting: boolean };
  }>({});  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all'); // Filter for admin vs shopkeeper actions
  const [longSetFilter, setLongSetFilter] = useState<string>('all'); // Filter for long set products
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const itemsPerPage = 8;

  // Indian timezone constant
  const TIMEZONE = 'Asia/Kolkata';

  // Format date in Indian timezone
  const formatIndianDate = (
    date: string | Date,
    formatStr: string = 'MMM dd, yyyy'
  ) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatTZ(toZonedTime(dateObj, TIMEZONE), formatStr, {
      timeZone: TIMEZONE,
    });
  };

  // Format date with time in Indian timezone in AM/PM format
  const formatIndianDateTime = (date: string | Date) => {
    return formatIndianDate(date, 'MMM dd, yyyy hh:mm a');
  };

  // Fetch product requests on component mount
  useEffect(() => {
    fetchProductRequests();
  }, [fetchProductRequests]);

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: 'Approved' | 'Rejected'
  ) => {
    // Set the appropriate loading state
    setLoadingStates((prev) => ({
      ...prev,
      [requestId]: {
        approving: newStatus === 'Approved' ? true : false,
        rejecting: newStatus === 'Rejected' ? true : false,
      },
    }));

    try {
      await updateProductRequestStatus(requestId, newStatus);
      await fetchProductRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      // Reset the loading state
      setLoadingStates((prev) => ({
        ...prev,
        [requestId]: { approving: false, rejecting: false },
      }));
    }
  };
  const handleDeleteAllRequests = async () => {
    setIsDeleting(true);
    try {
      await deleteAllProductRequests();
      // Reset the current page to 1 and clear filters
      setCurrentPage(1);
      setStatusFilter('all');
      setTypeFilter('all');
      setSourceFilter('all');
      setLongSetFilter('all');
    } catch (error) {
      console.error('Error deleting all product requests:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <PlusCircle className="h-4 w-4" />;
      case 'edit':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-blue-100 text-blue-800';
      case 'edit':
        return 'bg-purple-100 text-purple-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // Filter product requests
  const filteredRequests = productRequests.filter((request) => {
    // Search by request ID, product name, or user name
    const matchesSearch =
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.product?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (request.details?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (request.user
        ? `${request.user.firstName} ${request.user.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : false);

    // Filter by status
    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter;

    // Filter by type
    const matchesType =
      typeFilter === 'all' || request.requestType === typeFilter;
    
    // Filter by source (admin action or shopkeeper request)
    const matchesSource =
      sourceFilter === 'all' || 
      (sourceFilter === 'admin' && request.adminAction === true) || 
      (sourceFilter === 'shopkeeper' && request.adminAction !== true);
    
    // Filter by long set product type
    const matchesLongSet = 
      longSetFilter === 'all' || 
      (longSetFilter === 'longSet' && request.isLongSet === true) || 
      (longSetFilter === 'regular' && request.isLongSet !== true);

    return matchesSearch && matchesStatus && matchesType && matchesSource && matchesLongSet;
  });

  // Calculate stats
  const stats = {
    total: productRequests.length,
    pending: productRequests.filter((r) => r.status === 'Pending').length,
    approved: productRequests.filter((r) => r.status === 'Approved').length,
    rejected: productRequests.filter((r) => r.status === 'Rejected').length,
  };

  // Skeleton loaders
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
    <Card className="overflow-hidden animate-pulse">
      <CardContent className="p-4 space-y-2">
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
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
          Product Requests
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage product add, edit, and delete requests
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
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="add">Add</SelectItem>
              <SelectItem value="edit">Edit</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="admin">Admin Actions</SelectItem>
              <SelectItem value="shopkeeper">Shopkeeper Requests</SelectItem>
            </SelectContent>
          </Select>

          {/* Long Set Filter */}
          <Select value={longSetFilter} onValueChange={setLongSetFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="longSet">Long Set Products</SelectItem>
              <SelectItem value="regular">Regular Products</SelectItem>
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
              className={`rounded-r-none ${
                viewMode === 'grid' ? 'bg-gray-100' : ''
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid View</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-l-none ${
                viewMode === 'list' ? 'bg-gray-100' : ''
              }`}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {paginatedRequests.map((request) => (
            <Card
              key={request.id}
              className="overflow-hidden h-full flex flex-col"
            >
              <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-sm sm:text-base break-words">
                      {request.requestId}
                    </h3>                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center ${getTypeColor(
                          request.requestType
                        )}`}
                      >
                        {getTypeIcon(request.requestType)}
                        <span className="ml-1 capitalize">
                          {request.requestType}
                        </span>
                      </span>
                      {request.adminAction && <AdminActionBadge adminAction={request.adminAction} />}
                      {request.isLongSet && (
                        <span className="px-2 py-1 rounded-full text-xs flex items-center bg-teal-100 text-teal-800">
                          <span className="ml-1">Long Set</span>
                        </span>
                      )}
                    </div>
                    {request.user && (
                      <p className="text-xs mt-1 text-blue-600 break-words">
                        By: {request.user.firstName} {request.user.lastName}
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

                <div className="text-xs sm:text-sm flex-grow">
                  <div className="flex items-start">
                    {(request.product || request.details) && (
                      <div className="mr-3">
                        <img
                          src={
                            request.product?.imageUrl ||
                            request.details?.imageUrl ||
                            'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png'
                          }
                          alt={
                            request.product?.name ||
                            request.details?.name ||
                            'Product'
                          }
                          className="w-16 h-16 object-cover rounded-md border border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                    <div className="flex flex-col h-full min-h-[70px]">
                      <p className="font-medium text-gray-800">
                        {request.requestType === 'add'
                          ? request.details?.name
                          : request.product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-gray-500 text-xs mb-2">
                        {request.requestType === 'add'
                          ? `Product ID: ${request.details?.sku}`
                          : `Product ID: ${request.product?.sku}`}
                      </p>

                      {request.requestType === 'edit' && (
                        <div className="text-xs text-amber-600 mb-2">
                          <p>Requesting product changes</p>
                        </div>
                      )}

                      {request.requestType === 'add' && (
                        <div className="text-xs text-blue-600 mb-2">
                          <p>New product request</p>
                        </div>
                      )}

                      {request.requestType === 'delete' && (
                        <div className="text-xs text-red-600 mb-2">
                          <p>Delete product request</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mb-3">
                  {/* Stock badges - always on their own line */}
                  <div className="flex flex-wrap gap-2">
                    {request.requestType === 'add' && request.details && (
                      <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>
                        Stock: {request.details.stock}
                      </div>
                    )}

                    {request.requestType === 'delete' && request.product && (
                      <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>
                        Stock: {request.product.stock}
                      </div>
                    )}

                    {request.requestType === 'edit' && request.product && request.details && (
                      <>
                        {request.product.stock !== request.details.stock ? (
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>
                            Stock: {request.product.stock} → {request.details.stock}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>
                            Stock: {request.product.stock}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Supplier badges - always on their own line */}
                  <div className="flex flex-wrap gap-2">
                    {request.requestType === 'add' && request.details?.supplier && (
                      <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
                        Karigar: {request.details.supplier}
                      </div>
                    )}

                    {request.requestType === 'delete' && request.product?.supplier && (
                      <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
                        Karigar: {request.product.supplier}
                      </div>
                    )}

                    {request.requestType === 'edit' && request.product && request.details && (
                      <>
                        {request.product.supplier !== request.details.supplier ? (
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
                            Karigar: {(request.product.supplier || '(None)')} → {(request.details.supplier || '(None)')}
                          </div>
                        ) : (
                          request.product.supplier && (
                            <div className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
                              Karigar: {request.product.supplier.length > 15 ? request.product.supplier.substring(0, 15) + '...' : request.product.supplier}
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs sm:text-sm mb-3 sm:mb-4 bg-gray-50 p-2 rounded-md border border-gray-200">
                  <span className="text-gray-700 font-medium">Request Date:</span>
                  <span className="text-gray-800">{formatIndianDateTime(request.requestDate)}</span>
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
                  </Button>

                  {request.status === 'Pending' &&
                    user?.publicMetadata?.role === 'admin' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0 h-8 text-center justify-center text-green-600 hover:text-green-700 disabled:opacity-50"
                          onClick={() =>
                            handleStatusUpdate(request.id, 'Approved')
                          }
                          disabled={
                            loadingStates[request.id]?.approving ||
                            loadingStates[request.id]?.rejecting
                          }
                        >
                          {loadingStates[request.id]?.approving ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0 h-8 text-center justify-center text-red-600 hover:text-red-700 disabled:opacity-50"
                          onClick={() =>
                            handleStatusUpdate(request.id, 'Rejected')
                          }
                          disabled={
                            loadingStates[request.id]?.approving ||
                            loadingStates[request.id]?.rejecting
                          }
                        >
                          {loadingStates[request.id]?.rejecting ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          )}
                        </Button>
                      </>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">
                      REQUEST ID
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">
                      REQUEST TYPE
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">
                      PRODUCT
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">
                      SHOPKEEPER
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm hidden lg:table-cell">
                      REQUEST DATE
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">
                      STATUS
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 sm:p-4 font-medium text-xs sm:text-sm">
                        {request.requestId}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs inline-flex items-center justify-center ${getTypeColor(
                            request.requestType
                          )}`}
                        >
                          {getTypeIcon(request.requestType)}
                          <span className="capitalize ml-1">
                            {request.requestType}
                          </span>
                        </span>
                        {request.isLongSet && (
                          <span className="px-2 py-1 rounded-full text-xs inline-flex items-center justify-center bg-teal-100 text-teal-800 ml-2">
                            Long Set
                          </span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <div className="flex items-center">
                          <div className="mr-2 flex-shrink-0">
                            <img
                              src={
                                request.product?.imageUrl ||
                                request.details?.imageUrl ||
                                'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png'
                              }
                              alt={
                                request.product?.name ||
                                request.details?.name ||
                                'Product'
                              }
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="max-w-[150px] md:max-w-[200px] truncate font-medium">
                              {request.requestType === 'add'
                                ? request.details?.name
                                : request.product?.name || 'Unknown Product'}
                            </span>
                            
                            <span className="text-xs text-gray-500">
                              {request.requestType === 'add'
                                ? `ID: ${request.details?.sku}`
                                : `ID: ${request.product?.sku}`}
                            </span>
                            
                            {/* Stock and Supplier changes for Edit requests in list view */}
                            {request.requestType === 'edit' && request.product && request.details && (
                              <div className="mt-1 space-y-1">
                                {request.product.stock !== request.details.stock && (
                                  <div className="flex items-center">
                                    <span className="inline-flex h-2 w-2 bg-blue-600 rounded-full mr-1"></span>
                                    <span className="text-xs text-blue-700 font-medium whitespace-nowrap">
                                      Stock: {request.product.stock} → {request.details.stock}
                                    </span>
                                  </div>
                                )}
                                
                                {request.product.supplier !== request.details.supplier && (
                                  <div className="flex items-center">
                                    <span className="inline-flex h-2 w-2 bg-purple-600 rounded-full mr-1"></span>
                                    <span className="text-xs text-purple-700 font-medium whitespace-nowrap">
                                      Karigar change
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">
                        {request.user
                          ? `${request.user.firstName} ${request.user.lastName}`
                          : 'Unknown'}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm hidden lg:table-cell">
                        {formatIndianDateTime(request.requestDate)}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">                        <div className="flex gap-1 items-center flex-wrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                          {request.adminAction && <AdminActionBadge adminAction={request.adminAction} />}
                        </div>
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

                          {request.status === 'Pending' &&
                            user?.publicMetadata?.role === 'admin' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 disabled:opacity-50 h-8 w-8 p-0"
                                  title="Approve Request"
                                  onClick={() =>
                                    handleStatusUpdate(request.id, 'Approved')
                                  }
                                  disabled={
                                    loadingStates[request.id]?.approving ||
                                    loadingStates[request.id]?.rejecting
                                  }
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
                                  onClick={() =>
                                    handleStatusUpdate(request.id, 'Rejected')
                                  }
                                  disabled={
                                    loadingStates[request.id]?.approving ||
                                    loadingStates[request.id]?.rejecting
                                  }
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

      {/* No Results Message */}
      {filteredRequests.length === 0 && (
        <div className="text-center p-6 bg-muted/20 rounded-md mt-4 sm:mt-6">
          <p className="text-sm sm:text-base text-muted-foreground">
            No product requests found matching your filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredRequests.length > 0 && (
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
              {Array.from(
                {
                  length: Math.min(
                    3,
                    Math.ceil(filteredRequests.length / itemsPerPage)
                  ),
                },
                (_, i) => {
                  // Show at most 3 page numbers
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;

                  if (pageNum <= 3) {
                    return (
                      <Button
                        key={i}
                        variant={isActive ? 'default' : 'outline'}
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
                }
              )}

              {Math.ceil(filteredRequests.length / itemsPerPage) > 3 && (
                <span className="mx-1">...</span>
              )}

              {Math.ceil(filteredRequests.length / itemsPerPage) > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() =>
                    setCurrentPage(
                      Math.ceil(filteredRequests.length / itemsPerPage)
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(filteredRequests.length / itemsPerPage)
                  }
                >
                  {Math.ceil(filteredRequests.length / itemsPerPage)}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              disabled={
                currentPage >= Math.ceil(filteredRequests.length / itemsPerPage)
              }
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(filteredRequests.length / itemsPerPage)
                  )
                )
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden w-8 h-8 p-0"
              disabled={
                currentPage >= Math.ceil(filteredRequests.length / itemsPerPage)
              }
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(filteredRequests.length / itemsPerPage)
                  )
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}

      {/* Request Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px] max-w-[90vw] bg-white p-4 sm:p-6 border-0 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Product Request Details
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
                  <p className="text-xs sm:text-sm text-gray-500">
                    Request Type
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs flex items-center ${getTypeColor(
                        selectedRequest.requestType
                      )}`}
                    >
                      {getTypeIcon(selectedRequest.requestType)}                    <span className="ml-1 capitalize">
                        {selectedRequest.requestType}
                      </span>
                    </span>
                    {selectedRequest.adminAction && <AdminActionBadge adminAction={selectedRequest.adminAction} />}
                    {selectedRequest.isLongSet && (
                      <span className="px-2 py-1 rounded-full text-xs flex items-center bg-teal-100 text-teal-800">
                        <span className="ml-1">Long Set</span>
                      </span>
                    )}
                  </div>
                </div>

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
                  <p className="text-xs sm:text-sm text-gray-500">
                    Request Date
                  </p>
                  <p className="font-medium text-sm sm:text-base text-gray-800">
                    {formatIndianDateTime(selectedRequest.requestDate)}
                  </p>
                </div>

                {selectedRequest.user && (
                  <div className="sm:col-span-2">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Requested By
                    </p>
                    <p className="font-medium text-sm sm:text-base text-gray-800">
                      {selectedRequest.user.firstName}{' '}
                      {selectedRequest.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedRequest.user.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Show product details based on request type */}
              {selectedRequest.requestType === 'add' &&
                selectedRequest.details && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      New Product Details
                    </p>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="flex gap-4">
                        {selectedRequest.details.imageUrl && (
                          <img
                            src={selectedRequest.details.imageUrl}
                            alt={selectedRequest.details.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Name:</p>
                            <p className="font-medium">
                              {selectedRequest.details.name}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Product ID:</p>
                            <p>{selectedRequest.details.sku}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Category:</p>
                              <p>{selectedRequest.details.category}</p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">Material:</p>
                              <p>{selectedRequest.details.material}</p>
                            </div>
                          </div>                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Selling Price:</p>
                              <p>
                                ₹
                                {selectedRequest.details.price?.toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">
                                Cost Price:
                              </p>
                              <p>
                                {selectedRequest.details.costPrice 
                                  ? `₹${selectedRequest.details.costPrice?.toLocaleString()}` 
                                  : 'Not specified'}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">
                              Initial Stock:
                            </p>
                            <p>{selectedRequest.details.stock}</p>
                          </div>

                          {selectedRequest.details.description && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Description:
                              </p>
                              <p className="text-sm">
                                {selectedRequest.details.description}
                              </p>
                            </div>
                          )}
                          
                          {/* Display supplier field in Add Product Request details if it exists */}
                          {selectedRequest.details.supplier && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Karigar:
                              </p>
                              <p className="text-sm">
                                {selectedRequest.details.supplier}
                              </p>
                            </div>
                          )}

                          {/* Display Long Set Parts if this is a long set product */}
                          {selectedRequest.isLongSet && selectedRequest.details.longSetParts && (
                            <div>
                              <p className="text-xs text-gray-500 font-medium mt-3 mb-2">
                                Long Set Parts:
                              </p>
                              <div className="bg-gray-100 p-3 rounded-md">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-300">
                                      <th className="text-left pb-2">Part Name</th>
                                      <th className="text-left pb-2">Description</th>
                                      <th className="text-right pb-2">Cost Price</th>
                                      <th className="text-right pb-2">Karigar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {JSON.parse(selectedRequest.details.longSetParts).map((part: any, index: number) => (
                                      <tr key={index} className="border-b border-gray-200 last:border-0">
                                        <td className="py-2">{part.partName}</td>
                                        <td className="py-2">{part.partDescription || '-'}</td>
                                        <td className="py-2 text-right">{part.costPrice ? `₹${part.costPrice}` : '-'}</td>
                                        <td className="py-2 text-right">{part.karigarId || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {selectedRequest.requestType === 'edit' &&
                selectedRequest.product &&
                selectedRequest.details && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Product Edit Details
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="font-medium mb-2 text-gray-700">
                          Current Product
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-center mb-3">
                            <img
                              src={selectedRequest.product.imageUrl}
                              alt={selectedRequest.product.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Name:</p>
                            <p>{selectedRequest.product.name}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Product ID:</p>
                            <p>{selectedRequest.product.sku}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Category:</p>
                            <p>{selectedRequest.product.category}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Material:</p>
                            <p>{selectedRequest.product.material}</p>
                          </div>                          <div>
                            <p className="text-xs text-gray-500">Selling Price:</p>
                            <p>
                              ₹{selectedRequest.product.price.toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Cost Price:</p>
                            <p>
                              {selectedRequest.product.costPrice 
                                ? `₹${selectedRequest.product.costPrice.toLocaleString()}` 
                                : 'Not specified'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Stock:</p>
                            <p>{selectedRequest.product.stock}</p>
                          </div>

                          {selectedRequest.product.description && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Description:
                              </p>
                              <p className="text-xs">
                                {selectedRequest.product.description}
                              </p>
                            </div>
                          )}

                          {/* Display supplier field if it exists */}
                          {selectedRequest.product.supplier && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Karigar:
                              </p>
                              <p className="text-xs">
                                {selectedRequest.product.supplier}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="font-medium mb-2 text-blue-700">
                          Requested Changes
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-center mb-3">
                            {selectedRequest.details.imageUrl && (
                              <img
                                src={selectedRequest.details.imageUrl}
                                alt={
                                  selectedRequest.details.name ||
                                  selectedRequest.product.name
                                }
                                className={`w-20 h-20 object-cover rounded ${
                                  selectedRequest.details.imageUrl !==
                                  selectedRequest.product.imageUrl
                                    ? 'border-2 border-blue-500'
                                    : ''
                                }`}
                              />
                            )}
                            {!selectedRequest.details.imageUrl &&
                              selectedRequest.product.imageUrl && (
                                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded border border-red-300">
                                  <p className="text-xs text-red-500">
                                    Image removed
                                  </p>
                                </div>
                              )}
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Name:</p>
                            <div
                              className={
                                selectedRequest.product.name !==
                                selectedRequest.details.name
                                  ? 'bg-blue-100 p-1 rounded'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.name !==
                                  selectedRequest.details.name
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                {selectedRequest.details.name}
                                {selectedRequest.product.name !==
                                  selectedRequest.details.name && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    (Changed from:{' '}
                                    {selectedRequest.product.name})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Product ID:</p>
                            <div
                              className={
                                selectedRequest.product.sku !==
                                selectedRequest.details.sku
                                  ? 'bg-blue-100 p-1 rounded'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.sku !==
                                  selectedRequest.details.sku
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                {selectedRequest.details.sku}
                                {selectedRequest.product.sku !==
                                  selectedRequest.details.sku && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    (Changed from: {selectedRequest.product.sku}
                                    )
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Category:</p>
                            <div
                              className={
                                selectedRequest.product.category !==
                                selectedRequest.details.category
                                  ? 'bg-blue-100 p-1 rounded'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.category !==
                                  selectedRequest.details.category
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                {selectedRequest.details.category}
                                {selectedRequest.product.category !==
                                  selectedRequest.details.category && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    (Changed from:{' '}
                                    {selectedRequest.product.category})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Material:</p>
                            <div
                              className={
                                selectedRequest.product.material !==
                                selectedRequest.details.material
                                  ? 'bg-blue-100 p-1 rounded'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.material !==
                                  selectedRequest.details.material
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                {selectedRequest.details.material}
                                {selectedRequest.product.material !==
                                  selectedRequest.details.material && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    (Changed from:{' '}
                                    {selectedRequest.product.material})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>                          <div>
                            <p className="text-xs text-gray-500">Selling Price:</p>
                            <div
                              className={
                                selectedRequest.product.price !==
                                selectedRequest.details.price
                                  ? 'bg-blue-100 p-1 rounded'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.price !==
                                  selectedRequest.details.price
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                ₹
                                {selectedRequest.details.price?.toLocaleString()}
                                {selectedRequest.product.price !==
                                  selectedRequest.details.price && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    (Changed from: ₹
                                    {selectedRequest.product.price?.toLocaleString()}
                                    )
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Cost Price:</p>
                            <div
                              className={
                                selectedRequest.product.costPrice !==
                                selectedRequest.details.costPrice
                                  ? 'bg-blue-100 p-1 rounded'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.costPrice !==
                                  selectedRequest.details.costPrice
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                {selectedRequest.details.costPrice 
                                  ? `₹${selectedRequest.details.costPrice.toLocaleString()}`
                                  : 'Not specified'}
                                {selectedRequest.product.costPrice !==
                                  selectedRequest.details.costPrice && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    (Changed from: {selectedRequest.product.costPrice 
                                      ? `₹${selectedRequest.product.costPrice.toLocaleString()}`
                                      : 'Not specified'}
                                    )
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Stock:</p>
                            <div
                              className={
                                selectedRequest.product.stock !==
                                selectedRequest.details.stock
                                  ? 'bg-blue-100 p-2 rounded border border-blue-200'
                                  : ''
                              }
                            >
                              <p
                                className={
                                  selectedRequest.product.stock !==
                                  selectedRequest.details.stock
                                    ? 'font-medium text-blue-700'
                                    : ''
                                }
                              >
                                {selectedRequest.details.stock}
                                {selectedRequest.product.stock !==
                                  selectedRequest.details.stock && (
                                  <div className="flex items-center mt-1">
                                    <span className="inline-flex h-2 w-2 bg-blue-600 rounded-full mr-1.5"></span>
                                    <span className="text-xs text-blue-700">
                                      Stock adjustment: {selectedRequest.product.stock < selectedRequest.details.stock ? '+' : ''}
                                      {selectedRequest.details.stock - selectedRequest.product.stock}
                                    </span>
                                  </div>
                                )}
                              </p>
                            </div>
                          </div>

                          {(selectedRequest.details.description ||
                            selectedRequest.product.description) && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Description:
                              </p>
                              <div
                                className={
                                  selectedRequest.product.description !==
                                  selectedRequest.details.description
                                    ? 'bg-blue-100 p-1 rounded'
                                    : ''
                                }
                              >
                                <p
                                  className={`text-xs ${
                                    selectedRequest.product.description !==
                                    selectedRequest.details.description
                                      ? 'font-medium text-blue-700'
                                      : ''
                                  }`}
                                >
                                  {selectedRequest.details.description ||
                                    '(No description)'}
                                  {selectedRequest.product.description !==
                                    selectedRequest.details.description && (
                                    <span className="ml-1 text-xs text-blue-600 block mt-1">
                                      (Changed from:{' '}
                                      {selectedRequest.product.description ||
                                        '(No description)'}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}                          {/* Display supplier field in edit comparison */}
                          {(selectedRequest.details.supplier !== undefined ||
                            selectedRequest.product.supplier) && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Karigar:
                              </p>
                              <div
                                className={
                                  selectedRequest.product.supplier !==
                                  selectedRequest.details.supplier
                                    ? 'bg-blue-100 p-1 rounded'
                                    : ''
                                }
                              >
                                <p
                                  className={`text-xs ${
                                    selectedRequest.product.supplier !==
                                    selectedRequest.details.supplier
                                      ? 'font-medium text-blue-700'
                                      : ''
                                  }`}
                                >
                                  {selectedRequest.details.supplier || '(None)'}
                                  {selectedRequest.product.supplier !==
                                    selectedRequest.details.supplier && (
                                    <span className="ml-1 text-xs text-blue-600 block mt-1">
                                      (Changed from:{' '}
                                      {selectedRequest.product.supplier ||
                                        '(None)'}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {selectedRequest.status === 'Pending' &&
                user?.publicMetadata?.role === 'admin' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, 'Approved');
                        setShowDetails(false);
                      }}
                      disabled={
                        loadingStates[selectedRequest.id]?.approving ||
                        loadingStates[selectedRequest.id]?.rejecting
                      }
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
                      disabled={
                        loadingStates[selectedRequest.id]?.approving ||
                        loadingStates[selectedRequest.id]?.rejecting
                      }
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
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="sm:max-w-[450px] max-w-[90vw] bg-white p-4 sm:p-6 border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              Delete All Requests
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete all product requests? This action
              cannot be undone.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
              Warning: This will permanently delete all {productRequests.length}{' '}
              product requests from the database.
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
