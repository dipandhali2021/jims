'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SalesRequest {
  id: string;
  customer: string;
  items: string[];
  totalValue: number;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const salesRequests: SalesRequest[] = [
  {
    id: 'SR-2025-0001',
    customer: 'Olivia Bennett',
    items: ['Princess Cut Diamond Ring, 18K Gold Chain'],
    totalValue: 6640.92,
    requestDate: 'Mar 28, 2025',
    status: 'Pending',
  },
  {
    id: 'SR-2025-0002',
    customer: 'Ethan Richardson',
    items: ['Blue Sapphire Studs'],
    totalValue: 2970.00,
    requestDate: 'Mar 27, 2025',
    status: 'Pending',
  },
  {
    id: 'SR-2025-0003',
    customer: 'Sophia Martinez',
    items: ['Platinum Bangle', 'Emerald Halo Engagement Ring'],
    totalValue: 5830.52,
    requestDate: 'Mar 26, 2025',
    status: 'Pending',
  },
  {
    id: 'SR-2025-0004',
    customer: 'William Carter',
    items: ['Diamond Tennis Bracelet'],
    totalValue: 3456.00,
    requestDate: 'Mar 25, 2025',
    status: 'Approved',
  },
  {
    id: 'SR-2025-0005',
    customer: 'Emma Thompson',
    items: ['Ruby Drop Earrings', 'Freshwater Pearl Necklace'],
    totalValue: 2752.92,
    requestDate: 'Mar 24, 2025',
    status: 'Pending',
  },
  {
    id: 'SR-2025-0006',
    customer: 'Alexander Davis',
    items: ['Gold Mechanical Watch'],
    totalValue: 5940.00,
    requestDate: 'Mar 23, 2025',
    status: 'Rejected',
  },
  {
    id: 'SR-2025-0007',
    customer: 'Isabella Wilson',
    items: ['Sterling Silver Charm Bracelet'],
    totalValue: 972.00,
    requestDate: 'Mar 22, 2025',
    status: 'Pending',
  },
  {
    id: 'SR-2025-0008',
    customer: 'James Anderson',
    items: ['Princess Cut Diamond Ring'],
    totalValue: 4642.92,
    requestDate: 'Mar 21, 2025',
    status: 'Pending',
  },
];

const stats = {
  total: {
    count: 24,
    change: 12.5,
    trend: 'up',
  },
  pending: {
    count: 8,
    needsAttention: true,
  },
  approved: {
    count: 12,
    change: 8,
    trend: 'up',
  },
  rejected: {
    count: 4,
    change: 2,
    trend: 'down',
  },
};

export default function RequestsPage() {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Sales Requests</h1>
        <p className="text-muted-foreground">
          View and manage pending sales requests from customers
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Requests
                </p>
                <h3 className="text-2xl font-bold mt-2">{stats.total.count}</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  +{stats.total.change}% from last month
                </p>
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
                <h3 className="text-2xl font-bold mt-2">{stats.pending.count}</h3>
                {stats.pending.needsAttention && (
                  <p className="text-sm text-yellow-600 flex items-center mt-1">
                    Requires attention
                  </p>
                )}
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
                <h3 className="text-2xl font-bold mt-2">
                  {stats.approved.count}
                </h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  +{stats.approved.change}% from last month
                </p>
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
                <h3 className="text-2xl font-bold mt-2">{stats.rejected.count}</h3>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  -{stats.rejected.change}% from last month
                </p>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Button variant="outline" className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              Date range
            </Button>
          </div>

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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700">
            Bulk Approve
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(
                            salesRequests.map((request) => request.id)
                          );
                        } else {
                          setSelectedRequests([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-4">REQUEST ID</th>
                  <th className="text-left p-4">CUSTOMER</th>
                  <th className="text-left p-4">REQUESTED ITEMS</th>
                  <th className="text-left p-4">TOTAL VALUE</th>
                  <th className="text-left p-4">REQUEST DATE</th>
                  <th className="text-left p-4">STATUS</th>
                  <th className="text-left p-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {salesRequests.map((request) => (
                  <tr key={request.id} className="border-b">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests([
                              ...selectedRequests,
                              request.id,
                            ]);
                          } else {
                            setSelectedRequests(
                              selectedRequests.filter((id) => id !== request.id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="p-4 font-medium">{request.id}</td>
                    <td className="p-4">{request.customer}</td>
                    <td className="p-4">{request.items.join(', ')}</td>
                    <td className="p-4">
                      ${request.totalValue.toLocaleString()}
                    </td>
                    <td className="p-4">{request.requestDate}</td>
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
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'Pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
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

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing 1-8 of 8 requests
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}