'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKhataAnalytics, KhataAnalytics } from '@/hooks/use-khata-analytics';
import { TransactionCalendar } from '@/components/khata/TransactionCalendar';
import { ApprovalCounter } from '@/components/khata/ApprovalCounter';
import { ComparisonCard } from '@/components/khata/ComparisonCard';
import { PendingResolvedCard } from '@/components/khata/PendingResolvedCard';
import { StatCard } from '@/components/khata/StatCard';
import { KhataDashboardSkeleton } from '@/components/khata/KhataDashboardSkeleton';
import { 
  UserCircle, 
  Users, 
  TrendingUp, 
  ArrowUp,
  ArrowDown, 
  CreditCard, 
  Clock,
  DollarSign,
  BadgeIndianRupee,
  IndianRupee,
  CircleDollarSign,
  Receipt,
  CreditCard as PaymentIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Import chart components
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function KhataDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('30');
  const [analytics, setAnalytics] = useState<KhataAnalytics | null>(null);
  const { isLoading, fetchAnalytics } = useKhataAnalytics();
  const { toast } = useToast();

  // Load analytics data
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchAnalytics(Number(timeframe), 'all');
      if (data) {
        setAnalytics(data);
      }
    };
    
    loadData();
  }, [timeframe, fetchAnalytics]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: 'never',
    }).format(Math.abs(amount));
  };
  // Prepare chart data for Karigar transactions and payments
  const karigarChartData = useMemo(() => {
    if (!analytics?.karigar?.transactionChart || !analytics?.karigar?.paymentChart) return null;

    // Get unique dates from both transaction and payment data
    const allDates = Array.from(new Set([
      ...analytics.karigar.transactionChart.map(item => item.date),
      ...analytics.karigar.paymentChart.map(item => item.date)
    ])).sort();
    
    const labels = allDates.map(date => format(new Date(date), 'dd MMM'));
    
    // Create amount maps with date as key for quick lookup
    const transactionMap = new Map(
      analytics.karigar.transactionChart.map(item => [item.date, parseFloat(item.totalAmount.toString())])
    );
    const paymentMap = new Map(
      analytics.karigar.paymentChart.map(item => [item.date, parseFloat(item.totalAmount.toString())])
    );

    // Map each date to its amounts, using absolute values and 0 if no transaction/payment exists for that date
    const transactionAmounts = allDates.map(date => Math.abs(transactionMap.get(date) || 0));
    const paymentAmounts = allDates.map(date => Math.abs(paymentMap.get(date) || 0));
    
    return {
      labels,
      datasets: [
        {
          label: 'Transaction Amount',
          data: transactionAmounts,
          borderColor: 'rgb(124, 58, 237)', // Purple
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Payment Amount',
          data: paymentAmounts,
          borderColor: 'rgb(16, 185, 129)', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y',
          borderDash: [5, 5]
        }
      ]
    };
  }, [analytics]);
  // Prepare chart data for Vyapari transactions and payments
  const vyapariChartData = useMemo(() => {
    if (!analytics?.vyapari?.transactionChart || !analytics?.vyapari?.paymentChart) return null;

    // Get unique dates from both transaction and payment data
    const allDates = Array.from(new Set([
      ...analytics.vyapari.transactionChart.map(item => item.date),
      ...analytics.vyapari.paymentChart.map(item => item.date)
    ])).sort();
    
    const labels = allDates.map(date => format(new Date(date), 'dd MMM'));
    
    // Create amount maps with date as key for quick lookup
    const transactionMap = new Map(
      analytics.vyapari.transactionChart.map(item => [item.date, parseFloat(item.totalAmount.toString())])
    );
    const paymentMap = new Map(
      analytics.vyapari.paymentChart.map(item => [item.date, parseFloat(item.totalAmount.toString())])
    );

    // Map each date to its amounts, using absolute values and 0 if no transaction/payment exists for that date
    const transactionAmounts = allDates.map(date => Math.abs(transactionMap.get(date) || 0));
    const paymentAmounts = allDates.map(date => Math.abs(paymentMap.get(date) || 0));
    
    return {
      labels,
      datasets: [
        {
          label: 'Transaction Amount',
          data: transactionAmounts,
          borderColor: 'rgb(59, 130, 246)', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Payment Amount',
          data: paymentAmounts,
          borderColor: 'rgb(16, 185, 129)', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y',
          borderDash: [5, 5]
        }
      ]
    };
  }, [analytics]);
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Amount (₹)'
        },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.parsed.y);
            return label;
          }
        }
      }
    }
  };

  // Top Karigars chart data
  const topKarigarChartData = useMemo(() => {
    if (!analytics?.karigar?.topKarigars) return null;
    
    return {
      labels: analytics.karigar.topKarigars.map(k => k.name),
      datasets: [
        {
          label: 'Total Amount',
          data: analytics.karigar.topKarigars.map(k => k.totalAmount),
          backgroundColor: [
            'rgba(79, 70, 229, 0.7)',
            'rgba(79, 70, 229, 0.6)',
            'rgba(79, 70, 229, 0.5)',
            'rgba(79, 70, 229, 0.4)',
            'rgba(79, 70, 229, 0.3)',
          ],
          borderWidth: 1
        }
      ]
    };
  }, [analytics]);

  // Top Vyaparis chart data
  const topVyapariChartData = useMemo(() => {
    if (!analytics?.vyapari?.topVyaparis) return null;
    
    return {
      labels: analytics.vyapari.topVyaparis.map(v => v.name),
      datasets: [
        {
          label: 'Total Amount',
          data: analytics.vyapari.topVyaparis.map(v => Math.abs(v.totalAmount)),
          backgroundColor: [
            'rgba(14, 165, 233, 0.7)',
            'rgba(14, 165, 233, 0.6)',
            'rgba(14, 165, 233, 0.5)',
            'rgba(14, 165, 233, 0.4)',
            'rgba(14, 165, 233, 0.3)',
          ],
          borderWidth: 1
        }
      ]
    };
  }, [analytics]);

  // Bar chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        }
      }
    }
  };

  // If loading, show skeleton UI
  if (isLoading && !analytics) {
    return <KhataDashboardSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Khata Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your Karigar and Vyapari transactions and balances.
            </p>
          </div>
          
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="karigar">Karigar</TabsTrigger>
            <TabsTrigger value="vyapari">Vyapari</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Approvals Counter */}
              <div className="w-full">
                <ApprovalCounter />
              </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Summary Cards */}
                <StatCard 
                  title="Total Karigars"
                  value={analytics?.karigar?.totalKarigars || 0}
                  description="Active Karigars"
                  icon={<UserCircle className="h-5 w-5" />}
                  iconColor="bg-purple-100 text-purple-700"
                />
                
                <StatCard 
                  title="Total Traders"
                  value={analytics?.vyapari?.totalVyaparis || 0}
                  description="Active Vyaparis"
                  icon={<Users className="h-5 w-5" />}
                  iconColor="bg-blue-100 text-blue-700"
                />

               
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Karigar Transaction vs Payment Card */}
                <ComparisonCard
                  title="Karigar Activity"
                  description="Comparison of transaction requests and actual payments"
                  leftLabel="Transactions"
                  rightLabel="Payments"
                  leftValue={analytics?.karigar?.totalTransactions || 0}
                  rightValue={analytics?.karigar?.totalPayments || 0}
                  leftAmount={analytics?.karigar?.totalTransactionAmount || 0}
                  rightAmount={analytics?.karigar?.totalPaymentAmount || 0}
                  leftIcon={<Receipt className="h-4 w-4" />}
                  rightIcon={<PaymentIcon className="h-4 w-4" />}
                  leftColor="text-purple-600 bg-purple-100"
                  rightColor="text-emerald-600 bg-emerald-100"
                  formatCurrency={formatCurrency}
                />
                
                {/* Vyapari Transaction vs Payment Card */}
                <ComparisonCard
                  title="Vyapari Activity"
                  description="Comparison of transaction requests and actual payments"
                  leftLabel="Transactions"
                  rightLabel="Payments"
                  leftValue={analytics?.vyapari?.totalTransactions || 0}
                  rightValue={analytics?.vyapari?.totalPayments || 0}
                  leftAmount={analytics?.vyapari?.totalTransactionAmount || 0}
                  rightAmount={analytics?.vyapari?.totalPaymentAmount || 0}
                  leftIcon={<Receipt className="h-4 w-4" />}
                  rightIcon={<PaymentIcon className="h-4 w-4" />}
                  leftColor="text-blue-600 bg-blue-100"
                  rightColor="text-emerald-600 bg-emerald-100"
                  formatCurrency={formatCurrency}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Transaction status cards */}                <PendingResolvedCard 
                  title="Karigar Approval Status"
                  description="Overview of pending and approved transactions"
                  pendingCount={analytics?.karigar?.pendingTransactions || 0}
                  resolvedCount={analytics?.karigar?.resolvedTransactions || 0}
                  pendingAmount={analytics?.karigar?.pendingTransactionAmount || 0}
                  resolvedAmount={analytics?.karigar?.resolvedTransactionAmount || 0}
                  formatCurrency={formatCurrency}
                />
                  <PendingResolvedCard 
                  title="Vyapari Approval Status"
                  description="Overview of pending and approved transactions"
                  pendingCount={analytics?.vyapari?.pendingTransactions || 0}
                  resolvedCount={analytics?.vyapari?.resolvedTransactions || 0}
                  pendingAmount={analytics?.vyapari?.pendingTransactionAmount || 0}
                  resolvedAmount={analytics?.vyapari?.resolvedTransactionAmount || 0}
                  formatCurrency={formatCurrency}
                />
              </div>

             
                <div className="grid gap-4 md:grid-cols-2">
                {/* Transaction Charts */}
                <Card className="col-span-1 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Top 5 Karigars</CardTitle>
                    <CardDescription>
                      Karigars with highest transaction volumes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-1">
                    {topKarigarChartData ? (
                      <Bar 
                        data={topKarigarChartData} 
                        options={barChartOptions} 
                        height={250}
                      />
                    ) : (
                      <div className="flex h-[250px] items-center justify-center">
                        <p className="text-sm text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Top 5 Vyaparis</CardTitle>
                    <CardDescription>
                      Traders with highest transaction volumes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-1">
                    {topVyapariChartData ? (
                      <Bar 
                        data={topVyapariChartData} 
                        options={barChartOptions} 
                        height={250}
                      />
                    ) : (
                      <div className="flex h-[250px] items-center justify-center">
                        <p className="text-sm text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
                <div className="grid gap-4 md:grid-cols-2">
                {/* Transaction Calendars */}
                <TransactionCalendar
                  transactions={analytics?.karigar?.transactionChart || []}
                  payments={analytics?.karigar?.paymentChart || []}
                  title="Karigar Activity Calendar"
                  description="Daily transactions and payments for karigars"
                  colorClass="bg-purple-50 text-purple-900"
                />
                
                <TransactionCalendar
                  transactions={analytics?.vyapari?.transactionChart || []}
                  payments={analytics?.vyapari?.paymentChart || []}
                  title="Vyapari Activity Calendar"
                  description="Daily transactions and payments for vyaparis"
                  colorClass="bg-blue-50 text-blue-900"
                />
              </div>

              <div className="grid gap-4">
                {/* Recent Transactions List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Latest transactions across Karigars and Vyaparis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="p-3 text-left font-medium text-muted-foreground">ID</th>
                            <th className="p-3 text-left font-medium text-muted-foreground">Type</th>
                            <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                            <th className="p-3 text-left font-medium text-muted-foreground">Description</th>
                            <th className="p-3 text-left font-medium text-muted-foreground">Amount</th>
                            <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics?.karigar?.recentTransactions?.slice(0, 5).map((transaction) => (
                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 text-sm font-medium">{transaction.transactionId}</td>
                              <td className="p-3">
                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                                  <UserCircle className="mr-1 h-3 w-3" />
                                  Karigar
                                </span>
                              </td>
                              <td className="p-3 text-sm">{transaction.karigarName}</td>
                              <td className="p-3 text-sm max-w-[200px] truncate">{transaction.description}</td>
                              <td className="p-3 text-sm font-medium">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{transaction.createdAt}</td>
                            </tr>
                          ))}
                          {analytics?.vyapari?.recentTransactions?.slice(0, 5).map((transaction) => (
                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 text-sm font-medium">{transaction.transactionId}</td>
                              <td className="p-3">
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                  <Users className="mr-1 h-3 w-3" />
                                  Vyapari
                                </span>
                              </td>
                              <td className="p-3 text-sm">{transaction.vyapariName}</td>
                              <td className="p-3 text-sm max-w-[200px] truncate">{transaction.description}</td>
                              <td className="p-3 text-sm font-medium">
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{transaction.createdAt}</td>
                            </tr>
                          ))}
                          {(!analytics?.karigar?.recentTransactions?.length && !analytics?.vyapari?.recentTransactions?.length) && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                                No recent transactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Karigar Tab */}
            <TabsContent value="karigar" className="space-y-6">              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Total Karigars"
                  value={analytics?.karigar?.totalKarigars || 0}
                  description="Active Karigars"
                  icon={<UserCircle className="h-5 w-5" />}
                  iconColor="bg-purple-100 text-purple-700"
                />
                
                <StatCard 
                  title="Monthly Activity"
                  value={analytics?.karigar?.monthlyTransactionCount || 0}
                  description={`${analytics?.karigar?.monthlyPaymentCount || 0} payments`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconColor="bg-indigo-100 text-indigo-700"
                />

                
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Transaction vs Payment Card */}
                <ComparisonCard
                  title="Karigar Activity"
                  description="Comparison of transaction requests and actual payments"
                  leftLabel="Transactions"
                  rightLabel="Payments"
                  leftValue={analytics?.karigar?.totalTransactions || 0}
                  rightValue={analytics?.karigar?.totalPayments || 0}
                  leftAmount={analytics?.karigar?.totalTransactionAmount || 0}
                  rightAmount={analytics?.karigar?.totalPaymentAmount || 0}
                  leftIcon={<Receipt className="h-4 w-4" />}
                  rightIcon={<PaymentIcon className="h-4 w-4" />}
                  leftColor="text-purple-600 bg-purple-100"
                  rightColor="text-emerald-600 bg-emerald-100"
                  formatCurrency={formatCurrency}
                />
                  {/* Approval status card */}
                <PendingResolvedCard 
                  title="Approval Status"
                  description="Overview of pending and approved transactions"
                  pendingCount={analytics?.karigar?.pendingTransactions || 0}
                  resolvedCount={analytics?.karigar?.resolvedTransactions || 0}
                  pendingAmount={analytics?.karigar?.pendingTransactionAmount || 0}
                  resolvedAmount={analytics?.karigar?.resolvedTransactionAmount || 0}
                  formatCurrency={formatCurrency}
                />
              </div>

              <Card>                <CardHeader>
                  <CardTitle>Karigar Activity Over Time</CardTitle>
                  <CardDescription>
                    Transaction and payment amounts for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-1">
                  {karigarChartData ? (
                    <Line data={karigarChartData} options={chartOptions} height={100} />
                  ) : (
                    <div className="flex h-[200px] items-center justify-center">
                      <p className="text-sm text-muted-foreground">No transaction data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Karigars</CardTitle>
                    <CardDescription>By transaction volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.karigar?.topKarigars?.length ? (
                      <div className="space-y-4">
                        {analytics.karigar.topKarigars.map((karigar, index) => (
                          <div key={karigar.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{karigar.name}</p>
                                <p className="text-xs text-muted-foreground">Karigar</p>
                              </div>
                            </div>
                            
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Karigar Transactions</CardTitle>
                    <CardDescription>Latest karigar transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.karigar?.recentTransactions?.length ? (
                      <div className="space-y-4">
                        {analytics.karigar.recentTransactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center max-w-[70%]">
                              <div className="mr-2 rounded-full p-1 bg-purple-100 text-purple-700">
                                <Receipt className="h-4 w-4" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium truncate">{transaction.karigarName}</p>
                                <p className="truncate text-xs text-muted-foreground">{transaction.description}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-xs text-right text-muted-foreground">{transaction.createdAt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No recent transactions
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Karigar Payments</CardTitle>
                    <CardDescription>Latest payments to/from karigars</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.karigar?.recentPayments?.length ? (
                      <div className="space-y-4">
                        {analytics.karigar.recentPayments.slice(0, 5).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between">
                            <div className="flex items-center max-w-[70%]">
                              <div className="mr-2 rounded-full p-1 bg-emerald-100 text-emerald-700">
                                <PaymentIcon className="h-4 w-4" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium truncate">{payment.karigarName}</p>
                                <p className="truncate text-xs text-muted-foreground">{payment.description || `Payment: ${payment.paymentId}`}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-emerald-600">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-right text-muted-foreground">{payment.createdAt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No recent payments
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

             
            </TabsContent>

            {/* Vyapari Tab */}
            <TabsContent value="vyapari" className="space-y-6">              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                  title="Total Traders"
                  value={analytics?.vyapari?.totalVyaparis || 0}
                  description="Active Vyaparis"
                  icon={<Users className="h-5 w-5" />}
                  iconColor="bg-blue-100 text-blue-700"
                />
                
                <StatCard 
                  title="Monthly Activity"
                  value={analytics?.vyapari?.monthlyTransactionCount || 0}
                  description={`${analytics?.vyapari?.monthlyPaymentCount || 0} payments`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconColor="bg-indigo-100 text-indigo-700"
                />

              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Transaction vs Payment Card */}
                <ComparisonCard
                  title="Vyapari Activity"
                  description="Comparison of transaction requests and actual payments"
                  leftLabel="Transactions"
                  rightLabel="Payments"
                  leftValue={analytics?.vyapari?.totalTransactions || 0}
                  rightValue={analytics?.vyapari?.totalPayments || 0}
                  leftAmount={analytics?.vyapari?.totalTransactionAmount || 0}
                  rightAmount={analytics?.vyapari?.totalPaymentAmount || 0}
                  leftIcon={<Receipt className="h-4 w-4" />}
                  rightIcon={<PaymentIcon className="h-4 w-4" />}
                  leftColor="text-blue-600 bg-blue-100"
                  rightColor="text-emerald-600 bg-emerald-100"
                  formatCurrency={formatCurrency}
                />
                  {/* Approval status card */}
                <PendingResolvedCard 
                  title="Approval Status"
                  description="Overview of pending and approved transactions"
                  pendingCount={analytics?.vyapari?.pendingTransactions || 0}
                  resolvedCount={analytics?.vyapari?.resolvedTransactions || 0}
                  pendingAmount={analytics?.vyapari?.pendingTransactionAmount || 0}
                  resolvedAmount={analytics?.vyapari?.resolvedTransactionAmount || 0}
                  formatCurrency={formatCurrency}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Vyapari Activity Over Time</CardTitle>
                  <CardDescription>
                    Transaction and payment amounts for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-1">
                  {vyapariChartData ? (
                    <Line data={vyapariChartData} options={chartOptions} height={100} />
                  ) : (
                    <div className="flex h-[200px] items-center justify-center">
                      <p className="text-sm text-muted-foreground">No transaction data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Traders</CardTitle>
                    <CardDescription>By transaction volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.vyapari?.topVyaparis?.length ? (
                      <div className="space-y-4">
                        {analytics.vyapari.topVyaparis.map((vyapari, index) => (
                          <div key={vyapari.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{vyapari.name}</p>
                                <p className="text-xs text-muted-foreground">Trader</p>
                              </div>
                            </div>
                            
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                   <CardHeader>
                     <CardTitle>Recent Vyapari Payments</CardTitle>
                     <CardDescription>Latest payments to/from traders</CardDescription>
                   </CardHeader>
                   <CardContent>
                     {analytics?.vyapari?.recentPayments?.length ? (
                       <div className="space-y-4">
                         {analytics.vyapari.recentPayments.slice(0, 5).map((payment) => (
                           <div key={payment.id} className="flex items-center justify-between">
                             <div className="flex items-center max-w-[70%]">
                               <div className="mr-2 rounded-full p-1 bg-emerald-100 text-emerald-700">
                                 <PaymentIcon className="h-4 w-4" />
                               </div>
                               <div className="overflow-hidden">
                                 <p className="font-medium truncate">{payment.vyapariName}</p>
                                 <p className="truncate text-xs text-muted-foreground">{payment.description || `Payment: ${payment.paymentId}`}</p>
                               </div>
                             </div>
                             <div>
                               <p className="text-sm font-medium text-emerald-600">
                                 {formatCurrency(payment.amount)}
                               </p>
                               <p className="text-xs text-right text-muted-foreground">{payment.createdAt}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="py-8 text-center text-sm text-muted-foreground">
                         No recent payments
                       </div>
                     )}
                   </CardContent>
                </Card>
                <Card>
                   <CardHeader>
                     <CardTitle>Recent Vyapari Transactions</CardTitle>
                    <CardDescription>Latest trader transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.vyapari?.recentTransactions?.length ? (
                      <div className="space-y-4">
                        {analytics.vyapari.recentTransactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center max-w-[70%]">
                              <div className="mr-2 rounded-full p-1 bg-blue-100 text-blue-700">
                                <Receipt className="h-4 w-4" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium truncate">{transaction.vyapariName}</p>
                                <p className="truncate text-xs text-muted-foreground">{transaction.description}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-xs text-right text-muted-foreground">{transaction.createdAt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No recent transactions
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

          
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
