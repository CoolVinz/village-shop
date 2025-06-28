'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users,
  UserCheck,
  UserX,
  Crown,
  Store,
  ShoppingBag,
  Edit,
  Search,
  Plus
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { UserEditModal } from '@/components/admin/user-edit-modal'
import { UserCreateModal } from '@/components/admin/user-create-modal'
import { UserActionsMenu } from '@/components/admin/user-actions-menu'
import { toast } from 'sonner'
import { UserWithRelations } from '@/types/admin'

async function fetchUsers(): Promise<{ users: UserWithRelations[], stats: { total: number; admins: number; vendors: number; customers: number; active: number; inactive: number } }> {
  const response = await fetch('/api/admin/users', {
    cache: 'no-store'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  
  const users = await response.json()
  
  const stats = {
    total: users.length,
    admins: users.filter((u: UserWithRelations) => u.role === 'ADMIN').length,
    vendors: users.filter((u: UserWithRelations) => u.role === 'VENDOR').length,
    customers: users.filter((u: UserWithRelations) => u.role === 'CUSTOMER').length,
    active: users.filter((u: UserWithRelations) => u.isActive).length,
    inactive: users.filter((u: UserWithRelations) => !u.isActive).length
  }
  
  return { users, stats }
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

function UsersPageContent() {
  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    vendors: 0,
    customers: 0,
    active: 0,
    inactive: 0
  })
  const [filteredUsers, setFilteredUsers] = useState<UserWithRelations[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadUsers = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data.users)
      setStats(data.stats)
      setFilteredUsers(data.users)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.houseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleEditUser = (user: UserWithRelations) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  if (isLoading) {
    return (
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
    )
  }

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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
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
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role)
                  const totalOrders = user.role === 'CUSTOMER' ? user.orders.length : 0
                  const totalRevenue = user.role === 'CUSTOMER' 
                    ? user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
                    : 0 // Vendor revenue calculation simplified for now
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
                              <div>0 sales</div>
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user.role !== 'ADMIN' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            >
                              {user.isActive ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          <UserActionsMenu 
                            user={user}
                            onUserUpdated={loadUsers}
                          />
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

      <UserEditModal
        user={selectedUser}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onUserUpdated={loadUsers}
      />

      <UserCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onUserCreated={loadUsers}
      />
    </div>
  )
}

export default function UsersPage() {
  return <UsersPageContent />
}