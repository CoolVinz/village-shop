'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MoreHorizontal,
  Eye,
  Key,
  Mail,
  Trash2,
  Shield,
  Store,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { UserWithRelations } from '@/types/admin'

interface UserActionsMenuProps {
  user: UserWithRelations
  onUserUpdated: () => void
}

export function UserActionsMenu({ user, onUserUpdated }: UserActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDeactivateUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate user')
      }

      toast.success('User deactivated successfully')
      onUserUpdated()
    } catch (error) {
      console.error('Error deactivating user:', error)
      toast.error('Failed to deactivate user')
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const handleResetPassword = async () => {
    // Placeholder for password reset functionality
    toast.info('Password reset functionality not implemented yet')
  }

  const handleSendEmail = async () => {
    // Placeholder for email functionality
    toast.info('Email functionality not implemented yet')
  }

  const handleViewDetails = () => {
    // Placeholder for user details view
    toast.info('User details view not implemented yet')
  }

  const handlePromoteToAdmin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      })

      if (!response.ok) {
        throw new Error('Failed to promote user')
      }

      toast.success('User promoted to admin successfully')
      onUserUpdated()
    } catch (error) {
      console.error('Error promoting user:', error)
      toast.error('Failed to promote user')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromoteToVendor = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'VENDOR' }),
      })

      if (!response.ok) {
        throw new Error('Failed to promote user')
      }

      toast.success('User promoted to vendor successfully')
      onUserUpdated()
    } catch (error) {
      console.error('Error promoting user:', error)
      toast.error('Failed to promote user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to activate user')
      }

      await response.json()
      
      if (user.role === 'VENDOR' && user.shops.length > 0) {
        toast.success(`User activated successfully. ${user.shops.length} shop${user.shops.length > 1 ? 's' : ''} were also reactivated.`)
      } else {
        toast.success('User activated successfully')
      }
      
      onUserUpdated()
    } catch (error) {
      console.error('Error activating user:', error)
      toast.error('Failed to activate user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={isLoading}>
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          {/* User Activation/Deactivation */}
          {!user.isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleActivateUser}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate User
                {user.role === 'VENDOR' && user.shops.length > 0 && (
                  <span className="text-xs text-gray-500 ml-1">& Shops</span>
                )}
              </DropdownMenuItem>
            </>
          )}
          
          {user.role !== UserRole.ADMIN && (
            <>
              <DropdownMenuSeparator />
              
              {user.role === UserRole.CUSTOMER && (
                <DropdownMenuItem onClick={handlePromoteToVendor}>
                  <Store className="mr-2 h-4 w-4" />
                  Promote to Vendor
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handlePromoteToAdmin}>
                <Shield className="mr-2 h-4 w-4" />
                Promote to Admin
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleResetPassword}>
            <Key className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          
          {user.email && (
            <DropdownMenuItem onClick={handleSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
          )}
          
          {user.role !== UserRole.ADMIN && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deactivate User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {user.name}? This will set their account to inactive status. 
              They will not be able to log in until reactivated.
              {user.role === 'VENDOR' && user.shops.length > 0 && (
                <>
                  <br /><br />
                  <strong>Warning:</strong> This user owns {user.shops.length} shop{user.shops.length > 1 ? 's' : ''} 
                  ({user.shops.map(shop => shop.name).join(', ')}). 
                  All shops will also be deactivated and hidden from customers.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeactivateUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}