import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Settings, Bell, User, Store } from 'lucide-react'

export default function VendorSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and shop preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Your display name"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your display name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Your phone number"
                disabled
              />
            </div>

            <Button disabled>Save Profile Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-description">Shop Description</Label>
              <Textarea
                id="shop-description"
                placeholder="Tell customers about your shop..."
                rows={3}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-hours">Business Hours</Label>
              <Input
                id="business-hours"
                placeholder="e.g., 9:00 AM - 6:00 PM"
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Accept Online Orders</Label>
                <p className="text-xs text-muted-foreground">
                  Allow customers to place orders online
                </p>
              </div>
              <Switch disabled />
            </div>

            <Button disabled>Save Shop Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Order Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when you receive new orders
                </p>
              </div>
              <Switch disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when payments are received
                </p>
              </div>
              <Switch disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
              <Switch disabled />
            </div>

            <Button disabled>Save Notification Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Settings Coming Soon</h4>
              <p className="text-sm text-yellow-700">
                Advanced settings and customization options are currently being developed.
                Contact support if you need to change any settings.
              </p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" disabled className="w-full">
                Export Shop Data
              </Button>
              <Button variant="outline" disabled className="w-full">
                Download Reports
              </Button>
              <Button variant="destructive" disabled className="w-full">
                Delete Shop Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}