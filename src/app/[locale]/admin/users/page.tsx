import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users,
  UserCheck,
  UserX,
  Crown,
  Store,
  ShoppingBag,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

async function getUsersData() {
  const [users, userStats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        shops: {
          select: {
            id: true,
            name: true,
            isActive: true,
            orderItems: {
              select: {
                id: true,
                order: {
                  select: {
                    totalAmount: true,
                    status: true
                  }
                }
              }
            }
          }
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        }
      }
    }),
    Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } })
    ])
  ])

  const [adminCount, vendorCount, customerCount, activeCount, inactiveCount] = userStats

  return {
    users,
    stats: {
      total: users.length,
      admins: adminCount,
      vendors: vendorCount,
      customers: customerCount,
      active: activeCount,
      inactive: inactiveCount
    }
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800'
    case 'VENDOR':
      return 'bg-blue-100 text-blue-800'
    case 'CUSTOMER':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'ADMIN':
      return Crown
    case 'VENDOR':
      return Store
    case 'CUSTOMER':
      return ShoppingBag
    default:
      return Users
  }
}

function StatCard({ title, value, icon: Icon, description, color = "text-blue-600" }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

async function UsersPageContent() {
  const { users, stats } = await getUsersData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage all users in the Village Marketplace system
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          description="All registered users"
        />
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={Crown}
          description="System administrators"
          color="text-purple-600"
        />
        <StatCard
          title="Vendors"
          value={stats.vendors}
          icon={Store}
          description="Shop owners"
          color="text-blue-600"
        />
        <StatCard
          title="Customers"
          value={stats.customers}
          icon={ShoppingBag}
          description="Buyers"
          color="text-green-600"
        />
        <StatCard
          title="Active Users"
          value={`${stats.active}/${stats.total}`}
          icon={UserCheck}
          description="Currently active"
          color="text-emerald-600"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Business</th>
                  <th className="text-left py-3 px-4 font-medium">Activity</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  const totalOrders = user.role === 'CUSTOMER' ? user.orders.length : 0
                  const totalRevenue = user.role === 'CUSTOMER' 
                    ? user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
                    : user.shops.reduce((shopSum, shop) => 
                        shopSum + shop.orderItems.reduce((itemSum, item) => 
                          itemSum + Number(item.order.totalAmount), 0), 0)
                  const activeShops = user.shops.filter(shop => shop.isActive).length

                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">
                            House #{user.houseNumber}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{user.phone}</div>
                          <div className="text-gray-600">{user.lineId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'VENDOR' && (
                          <div className="text-sm">
                            <div>{user.shops.length} shops</div>
                            <div className="text-gray-600">
                              {activeShops} active
                            </div>
                          </div>
                        )}
                        {user.role === 'CUSTOMER' && (
                          <div className="text-sm text-gray-600">
                            Customer account
                          </div>
                        )}
                        {user.role === 'ADMIN' && (
                          <div className="text-sm text-gray-600">
                            Administrator
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {user.role === 'CUSTOMER' && (
                            <>
                              <div>{totalOrders} orders</div>
                              <div className="text-gray-600">
                                {formatCurrency(totalRevenue)} spent
                              </div>
                            </>
                          )}
                          {user.role === 'VENDOR' && (
                            <>
                              <div>{user.shops.reduce((sum, shop) => sum + shop.orderItems.length, 0)} sales</div>
                              <div className="text-gray-600">
                                {formatCurrency(totalRevenue)} revenue
                              </div>
                            </>
                          )}
                          {user.role === 'ADMIN' && (
                            <div className="text-gray-600">
                              System access
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user.role !== 'ADMIN' && (
                            <Button size="sm" variant="outline">
                              {user.isActive ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
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
      <UsersPageContent />
    </Suspense>
  )
}