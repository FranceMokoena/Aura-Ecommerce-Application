import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Package, 
  Wrench, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalServices: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  recentOrders: any[];
  topProducts: any[];
  revenueData: any[];
  userData: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const fetchDashboardStats = async () => {
    try {
      // In a real app, you'd fetch this from your API
      // For now, using mock data
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        totalProducts: 892,
        totalServices: 456,
        totalOrders: 2341,
        totalRevenue: 125430.50,
        monthlyRevenue: 15420.75,
        revenueGrowth: 12.5,
        userGrowth: 8.3,
        recentOrders: [
          { id: '1', customer: 'John Doe', amount: 299.99, status: 'completed', date: new Date() },
          { id: '2', customer: 'Jane Smith', amount: 149.50, status: 'pending', date: new Date() },
          { id: '3', customer: 'Bob Johnson', amount: 89.99, status: 'shipped', date: new Date() },
        ],
        topProducts: [
          { name: 'iPhone 13', sales: 45, revenue: 45000 },
          { name: 'MacBook Pro', sales: 32, revenue: 64000 },
          { name: 'AirPods Pro', sales: 67, revenue: 13400 },
          { name: 'iPad Air', sales: 28, revenue: 16800 },
        ],
        revenueData: [
          { month: 'Jan', revenue: 12000 },
          { month: 'Feb', revenue: 15000 },
          { month: 'Mar', revenue: 18000 },
          { month: 'Apr', revenue: 14000 },
          { month: 'May', revenue: 22000 },
          { month: 'Jun', revenue: 25000 },
        ],
        userData: [
          { month: 'Jan', users: 800 },
          { month: 'Feb', users: 950 },
          { month: 'Mar', users: 1100 },
          { month: 'Apr', users: 1050 },
          { month: 'May', users: 1200 },
          { month: 'Jun', users: 1247 },
        ],
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, Admin!</p>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <button
          onClick={() => navigateTo('/users')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 text-center">Users</p>
        </button>
        
        <button
          onClick={() => navigateTo('/products')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 text-center">Products</p>
        </button>
        
        <button
          onClick={() => navigateTo('/services')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Wrench className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 text-center">Services</p>
        </button>
        
        <button
          onClick={() => navigateTo('/orders')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <ShoppingCart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 text-center">Orders</p>
        </button>
        
        <button
          onClick={() => navigateTo('/payments')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <DollarSign className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 text-center">Payments</p>
        </button>
        
        <button
          onClick={() => navigateTo('/messages')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <Activity className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 text-center">Messages</p>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalUsers)}</p>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+{stats.userGrowth}%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalProducts)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Wrench className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalServices)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+{stats.revenueGrowth}%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Users Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.userData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.customer}</p>
                  <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
