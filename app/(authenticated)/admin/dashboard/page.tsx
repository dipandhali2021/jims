'use client';

import { useState, useEffect, useMemo } from 'react';
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
  
  // Calculate filtered and paginated transactions
  const filteredTransactions = transactions.filter((transaction) =>
    searchTerm === '' ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.customer.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (timeframe === 'Custom' && date?.from && date?.to) {
        params.append('start', date.from.toISOString());
        params.append('end', date.to.toISOString());
      } else {
        params.append('timeframe', timeframe);
      }
      
      const response = await fetch(`/api/sales/analytics?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      // No need to convert timestamps as they're already localized by the API
      setAnalytics(data);

      const transResponse = await fetch('/api/sales');
      if (!transResponse.ok) throw new Error('Failed to fetch transactions');
      let transData = await transResponse.json();
      
      // Convert transaction dates to IST
      transData = transData.map((transaction: any) => {
        if (transaction.date) {
          try {
            // Handle both date string and timestamp formats
            const dateValue = transaction.date.includes ? 
              new Date(transaction.date) : 
              new Date(parseInt(transaction.date));
              
            if (!isNaN(dateValue.getTime())) {
              const istDate = toZonedTime(dateValue, 'Asia/Kolkata');
              return {
                ...transaction,
                date: formatTZ(istDate, 'MMM dd, yyyy HH:mm', { timeZone: 'Asia/Kolkata' })
              };
            }
          } catch (e) {
            // If date conversion fails, keep original
            console.error('Error converting date:', e);
          }
        }
        return transaction;
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
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, date?.from, date?.to]);

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
      <div className="flex flex-col space-y-4 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Sales Dashboard</h1>
          
          {/* Mobile date filter using Sheet for small screens */}
          {isMobile ? (
            // <Sheet>
            //   <SheetTrigger asChild>
            //     <Button variant="outline" className="w-full md:w-auto flex items-center justify-between">
            //       <span>
            //         {date?.from ? new Date(date.from).toLocaleDateString() : 'Start date'} 
            //         {' - '}
            //         {date?.to ? new Date(date.to).toLocaleDateString() : 'End date'}
            //       </span>
            //       <ChevronDown className="h-4 w-4 ml-2" />
            //     </Button>
            //   </SheetTrigger>
            //   <SheetContent className='bg-white overflow-y-auto ' >
            //     <SheetHeader>
            //       <SheetTitle>Select Date Range</SheetTitle>
            //     </SheetHeader>
            //     <div className="py-4">
            //       <DateRangePicker
            //         date={date}
            //         onDateChange={(newDate) => {
            //           setDate(newDate);
            //           setTimeframe('Custom');
            //         }}
            //         className="w-full"
            //       />
            //     </div>
            //   </SheetContent>
            // </Sheet>
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
        </div>

        {/* Time Period Selector - scrollable on mobile */}
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
      </div>

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
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
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <h3 className="text-sm md:text-base font-semibold">Recent Transactions</h3>
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
              .map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{transaction.id}</p>
                      <p className="text-sm text-muted-foreground">{transaction.customer}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {transaction.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Products:</span> {transaction.products.join(', ')}</p>
                    <p><span className="text-muted-foreground">Date:</span> {transaction.date}</p>
                    <p><span className="text-muted-foreground">Amount:</span> ₹{transaction.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Products</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions
                  .map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{transaction.id}</td>
                      <td className="p-4">{transaction.customer}</td>
                      <td className="p-4 max-w-xs truncate">
                        {transaction.products.join(', ')}
                      </td>
                      <td className="p-4">{transaction.date}</td>
                      <td className="p-4">
                      ₹{transaction.amount.toLocaleString()}
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
