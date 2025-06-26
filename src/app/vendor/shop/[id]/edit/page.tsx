import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import ShopEditForm from '@/components/vendor/shop-edit-form'

async function getShop(shopId: string, userId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          houseNumber: true,
        }
      }
    }
  })

  if (!shop) {
    notFound()
  }

  // Verify ownership
  if (shop.ownerId !== userId) {
    redirect('/vendor/shop?error=unauthorized')
  }

  return shop
}

async function ShopEditContent({ shopId }: { shopId: string }) {
  // Get authentication token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/auth/login?redirect=/vendor/shop')
  }

  // Verify the token and get user info
  const user = verifyToken(token)
  if (!user) {
    redirect('/auth/login?redirect=/vendor/shop')
  }

  // Check if user has vendor role
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    redirect('/auth/login?error=insufficient_permissions')
  }

  const shop = await getShop(shopId, user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/shop">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Shop</h1>
          <p className="text-muted-foreground">
            Update your shop information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShopEditForm shop={shop} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ShopEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Shop</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ShopEditContentWrapper params={params} />
    </Suspense>
  )
}

async function ShopEditContentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShopEditContent shopId={id} />
}