'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventoryAnalytics } from '@/hooks/use-inventory-analytics';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar } from '@/components/ui/avatar';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCcw, DollarSign, Package, AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Custom color palette
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

// Custom tooltip for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  // Calculate position for percentage label (inside the pie slice)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Only show percentage inside the pie
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function InventoryDashboardPage() {
  const { analytics, isLoading, error, refreshAnalytics } = useInventoryAnalytics();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const handleRefresh = async () => {
    toast({
      title: "Refreshing data...",
      description: "Getting the latest inventory information."
    });
    await refreshAnalytics();
    toast({
      title: "Data refreshed",
      description: "Inventory dashboard is now up to date."
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-40 md:h-60 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <Button 
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
                <p>There was an error loading the inventory analytics. Please try refreshing.</p>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive overview of your inventory status and analytics</p>
        </div>
        <Button 
          variant="outline"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Stock Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* TOTAL STOCK ITEMS */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Stock Items
                  </CardTitle>
                  <CardDescription className="text-3xl font-bold">
                    {formatNumber(analytics?.totalStockCount || 0)}
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Across {formatNumber(analytics?.totalProducts || 0)} unique products
                </p>
              </CardContent>
            </Card>

            {/* TOTAL STOCK VALUE */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Stock Value
                  </CardTitle>
                  <CardDescription className="text-3xl font-bold">
                    {formatCurrency(analytics?.totalStockValue || 0)}
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Based on current selling prices
                </p>
              </CardContent>
            </Card>

            {/* POTENTIAL PROFIT */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Potential Profit
                  </CardTitle>
                  <CardDescription className="text-3xl font-bold">
                    {formatCurrency(analytics?.potentialProfit || 0)}
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-500/10">
                  <ArrowUpRight className="h-6 w-6 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  If all current inventory is sold
                </p>
              </CardContent>
            </Card>

            {/* LOW STOCK ALERT */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Low Stock Items
                  </CardTitle>
                  <CardDescription className="text-3xl font-bold">
                    {analytics?.lowStockItems || 0}
                  </CardDescription>
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-amber-500/10">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Products below threshold
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TOP PRODUCTS BY VALUE */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Products by Value</CardTitle>
                <CardDescription>
                  Highest value items in your inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="font-medium w-6">{index + 1}</div>
                      <Avatar className="h-12 w-12 border">
                        <img 
                          src={product.imageUrl || "https://via.placeholder.com/40"} 
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/40";
                          }}
                        />
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock} units</p>
                      </div>
                      <div className="text-right font-medium">{formatCurrency(product.value)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CATEGORY DISTRIBUTION PIE CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Products by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                      <Pie
                        data={analytics?.categoryDistribution}
                        cx="50%"
                        cy="40%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={70}
                        innerRadius={30}
                        paddingAngle={5}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: 20 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STOCK TRENDS TAB */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Count Trend</CardTitle>
                <CardDescription>
                  Total inventory units over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics?.stockTrend}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="stockCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value) => [`${formatNumber(value as number)}`, 'Stock Count']} />
                      <Area 
                        type="monotone" 
                        dataKey="stockCount" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#stockCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Value Trend</CardTitle>
                <CardDescription>
                  Total inventory value over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics?.stockTrend}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="stockValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'Stock Value']} />
                      <Area 
                        type="monotone" 
                        dataKey="stockValue" 
                        stroke="#82ca9d" 
                        fillOpacity={1} 
                        fill="url(#stockValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DISTRIBUTION TAB */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CATEGORY VALUE CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Category Value Distribution</CardTitle>
                <CardDescription>
                  Total inventory value by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.categoryDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
                      <Bar dataKey="value" fill="#8884d8">
                        {analytics?.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* MATERIAL VALUE CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Material Value Distribution</CardTitle>
                <CardDescription>
                  Total inventory value by material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.materialDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
                      <Bar dataKey="value" fill="#82ca9d">
                        {analytics?.materialDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CATEGORY ITEM COUNT CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Category Item Distribution</CardTitle>
                <CardDescription>
                  Product count by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.categoryDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                      <Bar dataKey="count" fill="#ffc658">
                        {analytics?.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* MATERIAL ITEM COUNT CHART */}
            <Card>
              <CardHeader>
                <CardTitle>Material Item Distribution</CardTitle>
                <CardDescription>
                  Product count by material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.materialDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                      <Bar dataKey="count" fill="#ff8042">
                        {analytics?.materialDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}