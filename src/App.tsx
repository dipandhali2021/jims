import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  Users, 
  BarChart2, 
  Settings,
  Bell,
  Search,
  Check,
  TrendingUp,
  Clock,
  AlertCircle,
  Activity,
  X,
  UserPlus,
  Grid,
  List,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

const salesData = [
  { month: 'Jan', sales: 40000, orders: 120, returns: 8 },
  { month: 'Feb', sales: 35000, orders: 100, returns: 5 },
  { month: 'Mar', sales: 55000, orders: 150, returns: 10 },
  { month: 'Apr', sales: 50000, orders: 140, returns: 7 },
  { month: 'May', sales: 60000, orders: 180, returns: 12 },
  { month: 'Jun', sales: 65000, orders: 190, returns: 9 },
  { month: 'Jul', sales: 70000, orders: 210, returns: 11 },
  { month: 'Aug', sales: 75000, orders: 220, returns: 8 },
  { month: 'Sep', sales: 85000, orders: 250, returns: 15 },
  { month: 'Oct', sales: 90000, orders: 270, returns: 13 },
  { month: 'Nov', sales: 95000, orders: 290, returns: 14 },
  { month: 'Dec', sales: 85000, orders: 260, returns: 10 }
];

const inventoryData = [
  { name: 'Rings', value: 35, stock: 156 },
  { name: 'Necklaces', value: 25, stock: 98 },
  { name: 'Earrings', value: 20, stock: 124 },
  { name: 'Bracelets', value: 15, stock: 87 },
  { name: 'Watches', value: 5, stock: 34 }
];

const recentActivity = [
  {
    icon: Check,
    type: 'approved',
    user: 'Emily Johnson',
    action: 'approved a sale request',
    item: 'Diamond Solitaire Ring',
    time: '2 hours ago',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-500'
  },
  {
    icon: Package,
    type: 'inventory',
    user: 'Michael Chen',
    action: 'added new inventory',
    item: '18K Gold Chain Necklace (15 units)',
    time: '4 hours ago',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500'
  },
  {
    icon: X,
    type: 'rejected',
    user: 'James Wilson',
    action: 'rejected a sale request',
    item: 'Sapphire Pendant',
    time: '6 hours ago',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500'
  },
  {
    icon: UserPlus,
    type: 'added',
    user: 'James Wilson',
    action: 'added a new shopkeeper',
    item: 'Olivia Martinez',
    time: '1 day ago',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-500'
  }
];

const pendingApprovals = [
  {
    item: 'Emerald Cut Diamond Ring',
    price: '$4,250',
    requestedBy: 'Sophia Williams',
    customer: 'Rebecca Thompson',
    time: '30 minutes ago'
  },
  {
    item: 'Pearl Stud Earrings',
    price: '$850',
    requestedBy: 'Daniel Brown',
    customer: 'Jennifer Adams',
    time: '1 hour ago'
  },
  {
    item: "Men's Gold Watch",
    price: '$3,680',
    requestedBy: 'Sophia Williams',
    customer: 'Robert Miller',
    time: '2 hours ago'
  }
];

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
const CHART_COLORS = {
  sales: '#60a5fa',
  orders: '#34d399',
  returns: '#f472b6'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

function App() {
  return (
    <div className="min-h-screen bg-background text-text">
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="fixed w-64 h-screen bg-white border-r border-gray-200 p-6 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-8">
          <DollarSign className="h-8 w-8 text-secondary" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">
            JewelTrack
          </span>
        </div>

        <nav className="space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Package, label: 'Inventory' },
            { icon: DollarSign, label: 'Sales' },
            { icon: Users, label: 'Users' },
            { icon: BarChart2, label: 'Analytics' },
            { icon: Settings, label: 'Settings' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                item.active 
                  ? 'bg-primary text-text shadow-glow' 
                  : 'text-muted hover:bg-surface hover:text-text'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </motion.div>
          ))}
        </nav>
      </motion.aside>

      <main className="ml-64 p-8 bg-surface">
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-md"
        >
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search for products, SKUs, categories..."
              className="pl-10 pr-4 py-2 bg-surface border border-gray-200 rounded-lg w-96 text-text focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-muted hover:text-text bg-surface rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
            </motion.button>
            <div className="flex items-center gap-3 bg-surface p-2 rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Profile"
                className="h-8 w-8 rounded-full ring-2 ring-primary/20"
              />
              <div>
                <p className="text-sm font-medium">James Wilson</p>
                <p className="text-xs text-muted">Admin</p>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: Package, label: 'Total Products', value: '1,246', change: '+12%', color: 'text-emerald-500' },
            { icon: Clock, label: 'Pending Sales', value: '24', change: '-8%', color: 'text-red-500' },
            { icon: DollarSign, label: 'Monthly Revenue', value: '$86,429', change: '+18%', color: 'text-emerald-500' },
            { icon: AlertCircle, label: 'Low Stock Items', value: '32', change: '+5%', color: 'text-red-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-glow transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <stat.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="text-muted">{stat.label}</h3>
                </div>
                <span className={stat.color}>{stat.change}</span>
              </div>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-12 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-8 bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Sales Overview</h3>
              </div>
              <div className="flex gap-2">
                {['Last 7 Days', 'Last 30 Days', 'This Year'].map((period, index) => (
                  <motion.button
                    key={period}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 text-sm rounded ${
                      index === 2 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-surface border border-gray-200 text-muted hover:border-blue-500'
                    }`}
                  >
                    {period}
                  </motion.button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.sales} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.sales} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke={CHART_COLORS.sales}
                  fillOpacity={1} 
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-4 bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-emerald-500" />
              <h3 className="font-medium">Inventory Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {inventoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-muted">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.stock} items</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-6 bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h3 className="font-medium">Orders Overview</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="orders" fill={CHART_COLORS.orders} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-6 bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="h-5 w-5 text-pink-500" />
              <h3 className="font-medium">Returns Analysis</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="returns" 
                  stroke={CHART_COLORS.returns}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.returns, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <button className="text-primary hover:text-accent text-sm">
                View All
              </button>
            </div>
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                    <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-sm text-muted">{activity.item}</p>
                    <p className="text-xs text-muted mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Pending Approvals</h3>
              <button className="text-primary hover:text-accent text-sm">
                View All
              </button>
            </div>
            <div className="space-y-6">
              {pendingApprovals.map((approval, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-surface p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{approval.item}</h4>
                    <span className="text-primary font-semibold">{approval.price}</span>
                  </div>
                  <p className="text-sm text-muted mb-1">
                    Requested by: {approval.requestedBy}
                  </p>
                  <p className="text-sm text-muted mb-3">
                    Customer: {approval.customer}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{approval.time}</span>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-1 bg-primary text-white rounded-md text-sm hover:bg-accent transition-colors"
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-1 bg-surface border border-gray-200 rounded-md text-sm hover:border-red-500 hover:text-red-500 transition-colors"
                      >
                        Reject
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Products</h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-muted hover:text-primary bg-surface rounded-lg transition-colors"
                >
                  <Grid className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-muted hover:text-primary bg-surface rounded-lg transition-colors"
                >
                  <List className="h-5 w-5" />
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;