'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKhataAnalytics, KhataAnalytics } from '@/hooks/use-khata-analytics';
import { TransactionCalendar } from '@/components/khata/TransactionCalendar';
import { ApprovalCounter } from '@/components/khata/ApprovalCounter';
import { 
  UserCircle, 
  Users, 
  TrendingUp, 
  ArrowUp,
  ArrowDown, 
  CreditCard, 
  Clock, 
  Loader2,
  DollarSign,
  BadgeIndianRupee,
  IndianRupee,
  CircleDollarSign
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
    }).format(amount);
  };

  // Prepare chart data for Karigar transactions
  const karigarChartData = useMemo(() => {
    if (!analytics?.karigar?.transactionChart) return null;
    
    const labels = analytics.karigar.transactionChart.map(item => 
      format(new Date(item.date), 'dd MMM')
    );
    
    const amounts = analytics.karigar.transactionChart.map(item => 
      parseFloat(item.totalAmount.toString())
    );
    
    const counts = analytics.karigar.transactionChart.map(item => 
      parseInt(item.count.toString())
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Transaction Amount',
          data: amounts,
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Transaction Count',
          data: counts,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderDashed: [5, 5],
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [analytics]);

  // Prepare chart data for Vyapari transactions
  const vyapariChartData = useMemo(() => {
    if (!analytics?.vyapari?.transactionChart) return null;
    
    const labels = analytics.vyapari.transactionChart.map(item => 
      format(new Date(item.date), 'dd MMM')
    );
    
    const amounts = analytics.vyapari.transactionChart.map(item => 
      parseFloat(item.totalAmount.toString())
    );
    
    const counts = analytics.vyapari.transactionChart.map(item => 
      parseInt(item.count.toString())
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Transaction Amount',
          data: amounts,
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Transaction Count',
          data: counts,
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderDashed: [5, 5],
          tension: 0.4,
          yAxisID: 'y1'
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
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Count'
        }
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label === 'Transaction Amount') {
              label += formatCurrency(context.parsed.y);
            } else {
              label += context.parsed.y;
            }
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
          data: analytics.vyapari.topVyaparis.map(v => v.totalAmount),
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

  // If loading
  if (isLoading && !analytics) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Khata Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your Karigar (artisan) and Vyapari (trader) transactions and balances.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select 
              value={timeframe} 
              onValueChange={(value) => setTimeframe(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
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
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Artisans</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics?.karigar?.totalKarigars || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <UserCircle className="mr-1 h-4 w-4" />
                      <span>Active Karigars</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Traders</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics?.vyapari?.totalVyaparis || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      <span>Active Vyaparis</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Karigar Transactions</CardDescription>
                    <CardTitle className="text-3xl">
                      {formatCurrency(analytics?.karigar?.totalTransactionAmount || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <BadgeIndianRupee className="mr-1 h-4 w-4" />
                        <span>Total value in selected period</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Vyapari Transactions</CardDescription>
                    <CardTitle className="text-3xl">
                      {formatCurrency(analytics?.vyapari?.totalTransactionAmount || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <BadgeIndianRupee className="mr-1 h-4 w-4" />
                        <span>Total value in selected period</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Overall Balance Cards */}
                <Card>
                  <CardHeader>
                    <CardTitle>Karigar Balance Summary</CardTitle>
                    <CardDescription>
                      Current outstanding balances with artisans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 rounded-full bg-purple-100 p-2 text-purple-600">
                            <ArrowUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">We Owe</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(analytics?.karigar?.amountWeOwe || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-2 rounded-full bg-green-100 p-2 text-green-600">
                            <ArrowDown className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Owed To Us</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(analytics?.karigar?.amountOwedToUs || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Net balance reflects your current position with all artisans.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vyapari Balance Summary</CardTitle>
                    <CardDescription>
                      Current outstanding balances with traders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 rounded-full bg-blue-100 p-2 text-blue-600">
                            <ArrowUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">We Owe</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(analytics?.vyapari?.amountWeOwe || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-2 rounded-full bg-green-100 p-2 text-green-600">
                            <ArrowDown className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Owed To Us</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(analytics?.vyapari?.amountOwedToUs || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Net balance reflects your current position with all traders.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
                <div className="grid gap-4 md:grid-cols-2">
                {/* Transaction Charts */}
                <Card className="col-span-1 md:col-span-1">
                  <CardHeader>
                    <CardTitle>Top 5 Karigars</CardTitle>
                    <CardDescription>
                      Artisans with highest transaction volumes
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
                  title="Karigar Transaction Calendar"
                  description="Daily transaction overview for artisans"
                  colorClass="bg-purple-50 text-purple-900"
                />
                
                <TransactionCalendar
                  transactions={analytics?.vyapari?.transactionChart || []}
                  title="Vyapari Transaction Calendar"
                  description="Daily transaction overview for traders"
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
                                <span className={transaction.amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                  {formatCurrency(transaction.amount)}
                                </span>
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
                                <span className={transaction.amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                  {formatCurrency(transaction.amount)}
                                </span>
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
            <TabsContent value="karigar" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Artisans</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics?.karigar?.totalKarigars || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <UserCircle className="mr-1 h-4 w-4" />
                      <span>Active Karigars</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Monthly Transactions</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics?.karigar?.monthlyTransactionCount || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      <span>Current month activity</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>We Owe</CardDescription>
                    <CardTitle className="text-3xl text-red-600">
                      {formatCurrency(analytics?.karigar?.amountWeOwe || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <ArrowUp className="mr-1 h-4 w-4 text-red-600" />
                      <span>Amounts to be paid to artisans</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Owed To Us</CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {formatCurrency(analytics?.karigar?.amountOwedToUs || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <ArrowDown className="mr-1 h-4 w-4 text-green-600" />
                      <span>Amounts to be collected from artisans</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Karigar Transactions Over Time</CardTitle>
                  <CardDescription>
                    Transaction amounts and count for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-1">
                  {karigarChartData ? (
                    <Line data={karigarChartData} options={chartOptions} height={300} />
                  ) : (
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-sm text-muted-foreground">No transaction data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Artisans</CardTitle>
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
                                <p className="text-xs text-muted-foreground">Artisan</p>
                              </div>
                            </div>
                            <div className="font-medium">
                              {formatCurrency(karigar.totalAmount)}
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
                    <CardDescription>Latest artisan transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.karigar?.recentTransactions?.length ? (
                      <div className="space-y-4">
                        {analytics.karigar.recentTransactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center max-w-[70%]">
                              <div className={`mr-2 rounded-full p-1 ${
                                transaction.amount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {transaction.amount > 0 ? 
                                  <ArrowUp className="h-4 w-4" /> : 
                                  <ArrowDown className="h-4 w-4" />
                                }
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium truncate">{transaction.karigarName}</p>
                                <p className="truncate text-xs text-muted-foreground">{transaction.description}</p>
                              </div>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${
                                transaction.amount > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
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

            {/* Vyapari Tab */}
            <TabsContent value="vyapari" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Traders</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics?.vyapari?.totalVyaparis || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      <span>Active Vyaparis</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Monthly Transactions</CardDescription>
                    <CardTitle className="text-3xl">
                      {analytics?.vyapari?.monthlyTransactionCount || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      <span>Current month activity</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>We Owe</CardDescription>
                    <CardTitle className="text-3xl text-red-600">
                      {formatCurrency(analytics?.vyapari?.amountWeOwe || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <ArrowUp className="mr-1 h-4 w-4 text-red-600" />
                      <span>Amounts to be paid to traders</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Owed To Us</CardDescription>
                    <CardTitle className="text-3xl text-green-600">
                      {formatCurrency(analytics?.vyapari?.amountOwedToUs || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <ArrowDown className="mr-1 h-4 w-4 text-green-600" />
                      <span>Amounts to be collected from traders</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Vyapari Transactions Over Time</CardTitle>
                  <CardDescription>
                    Transaction amounts and count for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-1">
                  {vyapariChartData ? (
                    <Line data={vyapariChartData} options={chartOptions} height={300} />
                  ) : (
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-sm text-muted-foreground">No transaction data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
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
                            <div className="font-medium">
                              {formatCurrency(vyapari.totalAmount)}
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
                    <CardTitle>Recent Vyapari Transactions</CardTitle>
                    <CardDescription>Latest trader transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.vyapari?.recentTransactions?.length ? (
                      <div className="space-y-4">
                        {analytics.vyapari.recentTransactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center max-w-[70%]">
                              <div className={`mr-2 rounded-full p-1 ${
                                transaction.amount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {transaction.amount > 0 ? 
                                  <ArrowUp className="h-4 w-4" /> : 
                                  <ArrowDown className="h-4 w-4" />
                                }
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium truncate">{transaction.vyapariName}</p>
                                <p className="truncate text-xs text-muted-foreground">{transaction.description}</p>
                              </div>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${
                                transaction.amount > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
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
