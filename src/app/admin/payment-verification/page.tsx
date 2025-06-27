import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentVerification } from '@/components/admin/payment-verification'
import { Clock } from 'lucide-react'

export default function PaymentVerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Verification</h1>
        <p className="text-gray-600">
          Review and verify customer payment slips
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Loading Payment Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      }>
        <PaymentVerification />
      </Suspense>
    </div>
  )
}