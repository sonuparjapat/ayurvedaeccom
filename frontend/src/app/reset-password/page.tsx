'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import toast from 'react-hot-toast'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import {
  Button
} from '@/components/ui/button'

import {
  Input
} from '@/components/ui/input'

import {
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'

type Status =
  | 'form'
  | 'loading'
  | 'success'
  | 'error'

export default function ResetPasswordPage() {

  const router = useRouter()

  const [token, setToken] =
    useState<string | null>(null)

  const [status, setStatus] =
    useState<Status>('loading')

  const [message, setMessage] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [confirmPassword,
    setConfirmPassword] =
    useState('')

  const [showPassword,
    setShowPassword] =
    useState(false)

  const [loading,
    setLoading] =
    useState(false)

  /* Read token */

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      )

    const urlToken =
      params.get('token')

    if (!urlToken) {
      setStatus('error')
      setMessage(
        'Invalid or missing reset token.'
      )
      return
    }

    setToken(urlToken)
    setStatus('form')

  }, [])

  /* Submit */

  const handleSubmit =
    async () => {

      if (!password ||
          !confirmPassword) {
        toast.error(
          'Please fill all fields'
        )
        return
      }

      if (password.length < 6) {
        toast.error(
          'Password must be at least 6 characters'
        )
        return
      }

      if (
        password !==
        confirmPassword
      ) {
        toast.error(
          'Passwords do not match'
        )
        return
      }

      try {

        setLoading(true)

        const res =
          await axios.post(
            '/users/reset-password',
            {
              token,
              password
            }
          )

        setStatus('success')

        setMessage(
          res?.data?.message ||
          'Password reset successful.'
        )

      } catch (err: any) {

        setStatus('error')

        setMessage(
          err?.response?.data?.message ||
          'Unable to reset password.'
        )

      } finally {
        setLoading(false)
      }
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center px-4">

      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0">

        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Reset Password
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">

          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-600" />
              <p className="text-gray-600">
                Preparing secure reset...
              </p>
            </div>
          )}

          {status === 'form' && (
            <div className="space-y-4">

              <div className="relative">

                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />

                <Input
                  type={
                    showPassword
                    ? 'text'
                    : 'password'
                  }
                  className="pl-9 pr-10"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? <EyeOff size={16} />
                    : <Eye size={16} />
                  }
                </button>

              </div>

              <Input
                type={
                  showPassword
                  ? 'text'
                  : 'password'
                }
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
              />

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading
                  ? 'Updating...'
                  : 'Reset Password'}
              </Button>

            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">

              <CheckCircle className="w-12 h-12 mx-auto text-green-600" />

              <p className="text-green-700 font-medium">
                {message}
              </p>

              <Button
                className="w-full"
                onClick={() =>
                  router.push('/')
                }
              >
                Continue to Login
              </Button>

            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">

              <AlertCircle className="w-12 h-12 mx-auto text-red-600" />

              <p className="text-red-700 font-medium">
                {message}
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push('/')
                }
              >
                Go Home
              </Button>

            </div>
          )}

        </CardContent>

      </Card>

    </div>
  )
}