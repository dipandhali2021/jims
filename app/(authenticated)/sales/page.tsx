'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Search,
  Plus,
  FileText,
  Printer,
  Eye,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const salesData = [
  { name: 'Mon', value: 1200 },
  { name: 'Tue', value: 1400 },
  { name: 'Wed', value: 1800 },
  { name: 'Thu', value: 1600 },
  { name: 'Fri', value: 2200 },
  { name: 'Sat', value: 2000 },
  { name: 'Sun', value: 1800 },
];

const topProducts = [
  { name: 'Diamond Ring', value: 5200 },
  { name: 'Luxury Watch', value: 4800 },
  { name: 'Tennis Bracelet', value: 3500 },
  { name: 'Gold Necklace', value: 2200 },
  { name: 'Pearl Earrings', value: 1800 },
];

const revenueByCategory = [
  { name: 'Rings', value: 30, color: '#4F46E5' },
  { name: 'Necklaces', value: 20, color: '#06B6D4' },
  { name: 'Earrings', value: 15, color: '#F97316' },
  { name: 'Bracelets', value: 25, color: '#EC4899' },
  { name: 'Watches', value: 10, color: '#8B5CF6' },
];

const customerHistory = [
  { month: 'Jan', new: 10, returning: 20, total: 30 },
  { month: 'Feb', new: 15, returning: 25, total: 40 },
  { month: 'Mar', new: 20, returning: 30, total: 50 },
  { month: 'Apr', new: 25, returning: 35, total: 60 },
  { month: 'May', new: 30, returning: 40, total: 70 },
  { month: 'Jun', new: 35, returning: 45, total: 80 },
];

const recentTransactions = [
  {
    id: 'ORD-2025-0421',
    customer: 'Elizabeth Parker',
    products: ['Diamond Engagement Ring', 'Gold Chain Necklace'],
    date: 'Apr 01, 2025 - 09:45 AM',
    amount: 6100,
    status: 'Completed',
  },
  {
    id: 'ORD-2025-0420',
    customer: 'Michael Thompson',
    products: ["Men's Luxury Watch"],
    date: 'Apr 01, 2025 - 08:12 AM',
    amount: 5950,
    status: 'Completed',
  },
  {
    id: 'ORD-2025-0419',
    customer: 'Sophia Rodriguez',
    products: ['Silver Hoop Earrings', 'Pearl Drop Earrings'],
    date: 'Mar 31, 2025 - 04:30 PM',
    amount: 1240,
    status: 'Completed',
  },
  {
    id: 'ORD-2025-0418',
    customer: 'William Johnson',
    products: ['Sapphire Tennis Bracelet'],
    date: 'Mar 31, 2025 - 01:15 PM',
    amount: 2750,
    status: 'Completed',
  },
  {
    id: 'ORD-2025-0417',
    customer: 'Olivia Martinez',
    products: ['Emerald Cut Diamond Ring'],
    date: 'Mar 31, 2025 - 11:20 AM',
    amount: 6250,
    status: 'Completed',
  },
];

export default function SalesPage() {
  const [timeframe, setTimeframe] = useState<'Today' | 'Week' | 'Month' | 'Year'>(
    'Today'
  );
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for orders, customers, products..."
              className="pl-10 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button>April 01, 2025 - April 01, 2025</Button>
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {(['Today', 'Week', 'Month', 'Year'] as const).map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? 'default' : 'outline'}
            onClick={() => setTimeframe(period)}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-bold mt-2">$28,459</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +12.5% vs previous period
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Sales
                </p>
                <h3 className="text-2xl font-bold mt-2">$1,845</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +8.2% vs yesterday
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Order Value
                </p>
                <h3 className="text-2xl font-bold mt-2">$1,254</h3>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  -3.1% vs previous period
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <h3 className="text-2xl font-bold mt-2">156</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +5.3% vs previous period
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Sales Trend</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Daily
                </Button>
                <Button variant="outline" size="sm">
                  Weekly
                </Button>
                <Button variant="outline" size="sm">
                  Monthly
                </Button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Top Selling Products</h3>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Customer History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Revenue by Category</h3>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Customer Purchase History</h3>
              <Button variant="ghost" size="sm">
                All Customers
              </Button>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new" stackId="a" fill="#4F46E5" />
                  <Bar dataKey="returning" stackId="a" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Sale
        </Button>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          View All Transactions
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Recent Transactions</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Order ID</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Products</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-4 font-medium">{transaction.id}</td>
                    <td className="p-4">{transaction.customer}</td>
                    <td className="p-4">
                      {transaction.products.join(', ')}
                    </td>
                    <td className="p-4">{transaction.date}</td>
                    <td className="p-4">
                      ${transaction.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {transaction.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                            <DropdownMenuItem>Download Invoice</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing 1-10 of 156 transactions
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}