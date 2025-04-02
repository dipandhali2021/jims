'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  ShoppingBag,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  Search,
  Plus,
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const salesData = Array.from({ length: 12 }, (_, i) => ({
  name: new Date(2024, i).toLocaleString('default', { month: 'short' }),
  value: Math.floor(Math.random() * 60000) + 20000,
}));

const pieData = [
  { name: 'Rings', value: 35 },
  { name: 'Necklaces', value: 25 },
  { name: 'Earrings', value: 20 },
  { name: 'Bracelets', value: 15 },
  { name: 'Watches', value: 5 },
];

const recentActivity = [
  {
    id: 1,
    user: 'Emily Johnson',
    action: 'approved a sale request',
    item: 'Diamond Solitaire Ring',
    time: '2 hours ago',
    type: 'approval',
  },
  {
    id: 2,
    user: 'Michael Chen',
    action: 'added new inventory',
    item: '18k Gold Chain Necklace (15 units)',
    time: '4 hours ago',
    type: 'inventory',
  },
  {
    id: 3,
    user: 'James Wilson',
    action: 'rejected a sale request',
    item: 'Sapphire Pendant',
    time: '6 hours ago',
    type: 'rejection',
  },
];

const pendingApprovals = [
  {
    id: 1,
    item: 'Emerald Cut Diamond Ring',
    price: 4250,
    requestedBy: 'Sophia Williams',
    customer: 'Rebecca Thompson',
    time: '30 minutes ago',
  },
  {
    id: 2,
    item: 'Pearl Stud Earrings',
    price: 850,
    requestedBy: 'Daniel Brown',
    customer: 'Jennifer Adams',
    time: '1 hour ago',
  },
  {
    id: 3,
    item: "Men's Gold Watch",
    price: 3685,
    requestedBy: 'Sophia Williams',
    customer: 'Robert Miller',
    time: '2 hours ago',
  },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="container mx-auto p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          className="pl-10 pr-4 py-2 w-full"
          placeholder="Search for products, SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
          </div>
          <Button className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Product
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Total Products
                  </p>
                  <h3 className="text-2xl font-bold mt-2">1,246</h3>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +12% this month
                  </p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">
                    Pending Sales
                  </p>
                  <h3 className="text-2xl font-bold mt-2">24</h3>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +8% this week
                  </p>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Monthly Revenue
                  </p>
                  <h3 className="text-2xl font-bold mt-2">$86,429</h3>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +16% this month
                  </p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Low Stock Items
                  </p>
                  <h3 className="text-2xl font-bold mt-2">32</h3>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Needs attention
                  </p>
                </div>
                <div className="bg-red-500/10 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sales Overview</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Last 7 Days
                </Button>
                <Button variant="outline" size="sm">
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm">
                  This Year
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Inventory Distribution</span>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Approvals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activity</span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b"
                  variants={itemVariants}
                >
                  <div>
                    <p className="font-medium">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action} - {activity.item}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activity.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Approvals</span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <motion.div
                  key={approval.id}
                  className="flex items-center justify-between py-2 border-b"
                  variants={itemVariants}
                >
                  <div>
                    <p className="font-medium">{approval.item}</p>
                    <p className="text-sm text-muted-foreground">
                      ${approval.price} - Requested by {approval.requestedBy}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer: {approval.customer}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm text-muted-foreground">
                      {approval.time}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}