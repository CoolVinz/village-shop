import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Store, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

async function getAdminStats() {
  const [
    totalUsers,
    totalVendors,
    totalCustomers,
    totalShops,
    activeShops,
    totalProducts,
    availableProducts,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue,
    pendingPayments
  ] = await Promise.all([
    // Users
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VENDOR' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    
    // Shops
    prisma.shop.count(),
    prisma.shop.count({ where: { isActive: true } }),
    
    // Products
    prisma.product.count(),
    prisma.product.count({ where: { isAvailable: true, stock: { gt: 0 } } }),
    
    // Orders
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    
    // Revenue
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'DELIVERED' }
    }),
    
    // Payments
    prisma.paymentSlip.count({ where: { status: 'PENDING' } })
  ])

  return {
    users: {
      total: totalUsers,
      vendors: totalVendors,
      customers: totalCustomers
    },
    shops: {
      total: totalShops,
      active: activeShops
    },
    products: {
      total: totalProducts,
      available: availableProducts
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      delivered: deliveredOrders
    },
    revenue: totalRevenue._sum.totalAmount || 0,
    pendingPayments
  }
}

async function getRecentActivity() {
  const [recentOrders, recentUsers, recentShops] = await Promise.all([
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true, houseNumber: true }
        }
      }
    }),
    prisma.user.findMany({
      take: 5,
      where: { role: { not: 'ADMIN' } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.shop.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { name: true }
        }
      }
    })
  ])

  return { recentOrders, recentUsers, recentShops }
}

function StatCard({ title, value, icon: Icon, description, badge }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: { text: string; variant: 'default' | 'destructive' | 'secondary' }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {badge && (
          <Badge variant={badge.variant} className="mt-2">
            {badge.text}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

function getOrderStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800'
    case 'PREPARING':
      return 'bg-orange-100 text-orange-800'
    case 'READY_FOR_DELIVERY':
      return 'bg-green-100 text-green-800'
    case 'DELIVERED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

async function AdminDashboardContent() {
  const stats = await getAdminStats()
  const activity = await getRecentActivity()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">
          System overview and management for Village Marketplace
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          icon={Users}
          description={`${stats.users.vendors} vendors, ${stats.users.customers} customers`}
        />
        <StatCard
          title="Active Shops"
          value={`${stats.shops.active}/${stats.shops.total}`}
          icon={Store}
          description="Shops currently operating"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders.total}
          icon={ShoppingCart}
          description={`${stats.orders.delivered} delivered`}
          badge={stats.orders.pending > 0 ? {
            text: `${stats.orders.pending} pending`,
            variant: 'destructive'
          } : undefined}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(Number(stats.revenue))}
          icon={DollarSign}
          description="From delivered orders"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Available Products"
          value={`${stats.products.available}/${stats.products.total}`}
          icon={TrendingUp}
          description="Products in stock"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={AlertCircle}
          description="Payment slips awaiting verification"
          badge={stats.pendingPayments > 0 ? {
            text: 'Needs attention',
            variant: 'destructive'
          } : undefined}
        />
        <StatCard
          title="Order Completion Rate"
          value={`${stats.orders.total > 0 ? Math.round((stats.orders.delivered / stats.orders.total) * 100) : 0}%`}
          icon={CheckCircle}
          description="Successfully delivered orders"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {order.customer.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      House #{order.customer.houseNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(Number(order.totalAmount))}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getOrderStatusColor(order.status)}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              New Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-600">
                      House #{user.houseNumber}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Shops */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              New Shops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.recentShops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{shop.name}</p>
                    <p className="text-xs text-gray-600">
                      by {shop.owner.name}
                    </p>
                  </div>
                  <Badge 
                    variant={shop.isActive ? "default" : "secondary"}
                  >
                    {shop.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}