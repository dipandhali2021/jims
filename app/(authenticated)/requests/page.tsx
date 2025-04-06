'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  product: {
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
}

export default function RequestsPage() {
  const { user } = useUser();
  const [salesRequests, setSalesRequests] = useState<SalesRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SalesRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const { toast } = useToast();

  const fetchSalesRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sales-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch sales requests');
      }
      const data = await response.json();
      setSalesRequests(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSalesRequests();
  }, [fetchSalesRequests]);

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: 'Approved' | 'Rejected'
  ) => {
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

      // Refresh the requests list
      fetchSalesRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update request status',
        variant: 'destructive',
      });
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
            <Skeleton className="h-10 w-28" />
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Sales Requests</h1>
        <p className="text-muted-foreground">
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
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests..."
              className="pl-10 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* View Toggle Buttons */}
          <div className="border rounded-md flex">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-r-none ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-l-none ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{request.requestId}</h3>
                    <p className="text-sm text-gray-600">{request.customer}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
                
                <div className="text-sm mb-4">
                  <p className="text-gray-500">Items:</p>
                  <p className="truncate">
                    {request.items
                      .map((item) => `${item.product.name} (${item.quantity})`)
                      .join(', ')}
                  </p>
                  <p className="text-gray-500 mt-1">
                    Total Quantity: {request.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">Total Value:</span>
                  <span className="font-medium">${request.totalValue.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">Date:</span>
                  <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-evenly gap-1 w-full mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.status === 'Pending' && user?.publicMetadata?.role === 'admin' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleStatusUpdate(request.id, 'Approved')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View (Original Table) */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">REQUEST ID</th>
                    <th className="text-left p-4">CUSTOMER</th>
                    <th className="text-left p-4">ITEMS</th>
                    <th className="text-left p-4">TOTAL QTY</th>
                    <th className="text-left p-4">TOTAL VALUE</th>
                    <th className="text-left p-4">REQUEST DATE</th>
                    <th className="text-left p-4">STATUS</th>
                    <th className="text-left p-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b">
                      <td className="p-4 font-medium">{request.requestId}</td>
                      <td className="p-4">{request.customer}</td>
                      <td className="p-4">
                        {request.items
                          .map((item) => `${item.product.name} (${item.quantity})`)
                          .join(', ')}
                      </td>
                      <td className="p-4">
                        {request.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="p-4">
                        ${request.totalValue.toLocaleString()}
                      </td>
                      <td className="p-4">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'Pending' && user?.publicMetadata?.role === 'admin' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() =>
                                  handleStatusUpdate(request.id, 'Approved')
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() =>
                                  handleStatusUpdate(request.id, 'Rejected')
                                }
                              >
                                <XCircle className="h-4 w-4" />
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

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px] bg-white border-0 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest.requestId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest.customer}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedRequest.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-2 bg-gray-50 border border-gray-200 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {item.product.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          ${item.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <p className="font-medium text-gray-800">Total Value:</p>
                <p className="font-bold text-gray-900">
                  ${selectedRequest.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}