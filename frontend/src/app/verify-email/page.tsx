'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'



/* ======================
   Types
====================== */

type Status = 'loading' | 'success' | 'error'


export default function VerifyEmailPage() {

  const router = useRouter()
const {
  setOpenauth,
  setAuthMode
} = useAuth()
  const [token, setToken] = useState<string | null>(null)

  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')


  /* ======================
     Get Token From URL
  ====================== */

  useEffect(() => {

    // Runs only in browser
    const params = new URLSearchParams(window.location.search)

    const urlToken = params.get('token')

    if (!urlToken) {
      setStatus('error')
      setMessage('Invalid or missing verification token.')
      return
    }

    setToken(urlToken)

  }, [])


  /* ======================
     Verify Email
  ====================== */

  useEffect(() => {

    if (!token) return

    let isMounted = true

    const verifyEmail = async () => {

      try {

        const res = await axios.post('/users/verify-email', {
          token,
        })

        if (!isMounted) return

        setStatus('success')
setTimeout(() => {
  router.push('/')
  
  setTimeout(() => {
    setAuthMode('login')
    setOpenauth(true)
  }, 400)

}, 1800)
        setMessage(
          res.data?.message ||
          'Your email has been verified successfully!'
        )

      } catch (error: any) {

        if (!isMounted) return

        setStatus('error')

        setMessage(
          error?.response?.data?.message ||
          'Email verification failed. The link may be expired.'
        )
      }
    }

    verifyEmail()

    return () => {
      isMounted = false
    }

  }, [token])


  /* ======================
     UI
  ====================== */

return (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center px-4">

    <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl">

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          Email Verification
        </CardTitle>
      </CardHeader>

      <CardContent className="text-center space-y-5 p-6">

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-emerald-600 animate-spin" />

            <p className="text-gray-600">
              Verifying your email, please wait...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-green-600" />

            <p className="text-green-700 font-medium">
              {message}
            </p>

            <Button
              className="w-full"
              onClick={() =>
                router.push("/")
              }
            >
              Continue Shopping
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-red-600" />

            <p className="text-red-700 font-medium">
              {message}
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                router.push("/")
              }
            >
              Go Home
            </Button>
          </>
        )}

      </CardContent>

    </Card>

  </div>
)
}