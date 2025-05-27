'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';
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
  Legend,
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
  Loader2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const COLORS = ['#4F46E5', '#06B6D4', '#F97316', '#EC4899', '#8B5CF6'];

interface SalesAnalytics {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    previousPeriodComparison: {
      revenue: number;
      sales: number;
      avgOrder: number;
      orders: number;
    };
  };
  salesTrend: Array<{ name: string; value: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
}

interface Transaction {
  id: string;
  customer: string;
  products: string[];
  date: string;
  amount: number;
  status: string;
}

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState<'Today' | 'Week' | 'Month' | 'Year' | 'Custom'>(
    'Week'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay);
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + (6 - currentDay));
    
    return {
      from: startOfDay(sunday),
      to: endOfDay(saturday)
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  // New state for transaction type filter
  const [transactionType, setTransactionType] = useState<'All' | 'GST' | 'Non-GST'>('All');
  

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

  // Calculate filtered and paginated transactions
  const filteredTransactions = transactions.filter((transaction) =>
    searchTerm === '' ||
    (transaction.id && transaction.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.products && 
      transaction.products.some(product => 
        product.toLowerCase().includes(searchTerm.toLowerCase())
      ))
  );
  
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  
  // Calculate total pages
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Check for mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update date range when timeframe changes
  useEffect(() => {
    if (timeframe !== 'Custom') {
      const now = new Date();
      switch (timeframe) {
        case 'Today':
          setDate({
            from: startOfDay(now),
            to: endOfDay(now)
          });
          break;
        case 'Week':
          const currentDay = now.getDay();
          const sunday = new Date(now);
          sunday.setDate(now.getDate() - currentDay);
          const saturday = new Date(now);
          saturday.setDate(now.getDate() + (6 - currentDay));
          
          setDate({
            from: startOfDay(sunday),
            to: endOfDay(saturday)
          });
          break;
        case 'Month':
          setDate({
            from: startOfDay(addDays(now, -30)),
            to: endOfDay(now)
          });
          break;
        case 'Year':
          setDate({
            from: startOfDay(addDays(now, -365)),
            to: endOfDay(now)
          });
          break;
      }
    }
  }, [timeframe]);  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (timeframe === 'Custom' && date?.from && date?.to) {
        params.append('start', date.from.toISOString());
        params.append('end', date.to.toISOString());
      } else {
        params.append('timeframe', timeframe);
      }
      if (transactionType !== 'All') {
        params.append('billType', transactionType);
      }
      const response = await fetch(`/api/sales/analytics?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      const transParams = new URLSearchParams();
      if (transactionType !== 'All') {
        transParams.append('billType', transactionType);
      }
      const transResponse = await fetch(`/api/sales?${transParams.toString()}`);
      if (!transResponse.ok) throw new Error('Failed to fetch transactions');
      let transData = await transResponse.json();  
      
      // Ensure id field is set for all transactions
      transData = transData.map((transaction: any) => {
        // Process date information
        if (transaction.date) {
          try {
            const dateValue = transaction.date.includes ? 
              new Date(transaction.date) : 
              new Date(parseInt(transaction.date));
            if (!isNaN(dateValue.getTime())) {
              const istDate = toZonedTime(dateValue, 'Asia/Kolkata');
              return {
                ...transaction,
                // Ensure orderId is set (fallback to id)
                orderId: transaction.orderId || transaction.id,
                // Make sure products is an array
                products: Array.isArray(transaction.products) ? transaction.products : ['Unknown Product'],
                date: formatTZ(istDate, 'MMM dd, yyyy HH:mm', { timeZone: 'Asia/Kolkata' })
              };
            }
          } catch (e) {
            console.error('Error converting date:', e);
          }
        }
        return {
          ...transaction,
          orderId: transaction.orderId || transaction.id,
          products: Array.isArray(transaction.products) ? transaction.products : ['Unknown Product']
        };
      });
      
      setTransactions(transData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, date?.from, date?.to, transactionType, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, date?.from, date?.to, transactionType, fetchAnalytics]);
  console.log('Analytics data:', analytics);
  if (isLoading || !analytics) {
    return (
      <div className="p-3 md:p-6 max-w-screen-2xl mx-auto space-y-4">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 md:p-6">
                <div className="h-4 w-1/4 bg-muted animate-pulse rounded mb-4" />
                <div className="h-[250px] md:h-[300px] bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transactions Skeleton */}
        <Card>
          <CardContent className="p-3 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full md:w-1/3 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile-optimized card for displaying stats
  interface StatCardProps {
    title: string;
    value: string | number;
    percentage: number;
    icon: React.ReactNode;
    color: string;
  }

  const StatCard = ({ title, value, percentage, icon, color }: StatCardProps) => (
    <Card className="h-full">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
              {title}
            </p>
            <h3 className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">
              {value}
            </h3>
            
          </div>
          <div className={`bg-${color}-500/10 p-2 sm:p-3 rounded-full`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-3 md:p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-4 md:mb-6">        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold">Sales Dashboard</h1>
            
            {/* GST/Non-GST Filter at the top for better accessibility */}
            <Select
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as 'All' | 'GST' | 'Non-GST')}
            >
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="All Transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Transactions</SelectItem>
                <SelectItem value="GST">GST Bills</SelectItem>
                <SelectItem value="Non-GST">Non-GST Bills</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Mobile date filter using Sheet for small screens */}
          {isMobile ? (
            
            <DateRangePicker
              date={date}
              onDateChange={(newDate) => {
                setDate(newDate);
                setTimeframe('Custom');
              }}
              className="w-full md:w-auto"
            />
          ) : (
            <DateRangePicker
              date={date}
              onDateChange={(newDate) => {
                setDate(newDate);
                setTimeframe('Custom');
              }}
              className="w-full md:w-auto"
            />
          )}
        </div>        {/* Time Period Selector - scrollable on mobile */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {(['Today', 'Week', 'Month', 'Year'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              onClick={() => setTimeframe(period)}
              className="whitespace-nowrap flex-shrink-0"
              size={isMobile ? "sm" : "default"}
            >
              {period}
            </Button>
          ))}
        </div>
        
        {/* Active filters summary */}
        <div className="flex flex-wrap gap-2">
          {timeframe && (
            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center">
              <span>{timeframe === 'Custom' ? 'Custom Date Range' : timeframe}</span>
            </div>
          )}
          {transactionType !== 'All' && (
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
              transactionType === 'GST' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              <span>{transactionType} Transactions</span>
              <button 
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                onClick={() => setTransactionType('All')}
                aria-label="Clear filter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>{/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        {transactionType !== 'All' && (
          <div className="col-span-2 lg:col-span-4 bg-blue-50 border border-blue-200 rounded-md p-2 mb-2 text-sm flex items-center">
            <Filter className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-blue-800">
              Showing metrics for <strong>{transactionType}</strong> transactions only
            </span>
          </div>
        )}
        <StatCard
          title="Total Revenue"
          value={`₹${analytics.metrics.totalRevenue.toLocaleString()}`}
          percentage={analytics.metrics.previousPeriodComparison.revenue}
          icon={<DollarSign className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title="Today's Sales"
          value={`₹${analytics.metrics.totalRevenue.toLocaleString()}`}
          percentage={analytics.metrics.previousPeriodComparison.sales}
          icon={<ShoppingBag className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${analytics.metrics.avgOrderValue.toLocaleString()}`}
          percentage={-analytics.metrics.previousPeriodComparison.avgOrder}
          icon={<DollarSign className="h-4 w-4 md:h-6 md:w-6 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={analytics.metrics.totalOrders}
          percentage={analytics.metrics.previousPeriodComparison.orders}
          icon={<Users className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Charts Section - 1 column on mobile, 2 on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold">Sales Trend</h3>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.salesTrend} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={50}
                  />
                  <YAxis stroke="#888888" tick={{ fontSize: isMobile ? 10 : 12 }} width={35} />
                  <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold">Top Selling Products</h3>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 5, bottom: 5, left: isMobile ? 70 : 90 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: isMobile ? 10 : 12 }} 
                    width={isMobile ? 70 : 90}
                  />
                  <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Bar dataKey="revenue" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Customer History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold">Revenue by Category</h3>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={analytics.revenueByCategory}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    paddingAngle={5}
                    label={!isMobile}
                  >
                    {analytics.revenueByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    fontSize={isMobile ? 10 : 12}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <h3 className="text-sm md:text-base font-semibold">Customer Purchase History</h3>
            </div>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={analytics.salesTrend}
                  margin={{ top: 5, right: 5, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={50}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip contentStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardContent className="p-3 md:p-6">          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm md:text-base font-semibold">
                Recent Transactions
                {transactionType !== 'All' && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    transactionType === 'GST' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {transactionType}
                  </span>
                )}
              </h3>
              <Select
                value={transactionType}
                onValueChange={(value) => {
                  setTransactionType(value as 'All' | 'GST' | 'Non-GST');
                  setCurrentPage(1); // Reset to first page when changing filter
                }}
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Transactions</SelectItem>
                  <SelectItem value="GST">GST Bills</SelectItem>
                  <SelectItem value="Non-GST">Non-GST Bills</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
            {/* Mobile Transaction Cards */}
          <div className="md:hidden space-y-3">
            {paginatedTransactions
              .map((transaction: any) => (                <div key={transaction.id || transaction.orderId} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{transaction.orderId || transaction.id}</p>
                      <p className="text-sm text-muted-foreground">{transaction.customer}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {transaction.billType && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.billType === 'GST' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {transaction.billType}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {transaction.status}
                      </span>
                    </div>
                  </div>                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Products:</span> {transaction.products && transaction.products.length > 0 ? transaction.products.join(', ') : 'No products'}</p>
                    <p><span className="text-muted-foreground">Date:</span> {formatIndianDateTime(transaction.date)}</p>
                    <p><span className="text-muted-foreground">Amount:</span> ₹{transaction.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Products</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions
                  .map((transaction: any) => (                    <tr key={transaction.id || transaction.orderId} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{transaction.orderId || transaction.id}</td>
                      <td className="p-4">{transaction.customer}</td>
                      <td className="p-4 max-w-xs truncate">
                        {transaction.products && transaction.products.length > 0 ? transaction.products.join(', ') : 'No products'}
                      </td>
                      <td className="p-4">{formatIndianDateTime(transaction.date)}</td>
                      <td className="p-4">
                      ₹{transaction.amount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        {transaction.billType && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.billType === 'GST' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {transaction.billType}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
            <p className="text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
