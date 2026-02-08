'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card'

import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Lock,
  Mail,
} from 'lucide-react'


export default function UserLogin() {

  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  /* ---------------- VALIDATION ---------------- */

  const validate = () => {

    if (!formData.email)
      return 'Email required'

    if (!/\S+@\S+\.\S+/.test(formData.email))
      return 'Invalid email'

    if (!formData.password)
      return 'Password required'

    if (formData.password.length < 6)
      return 'Min 6 chars'

    return ''
  }


  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: any) => {

    e.preventDefault()

    const msg = validate()

    if (msg) {
      setError(msg)
      return
    }

    try {

      setLoading(true)
      setError('')
      setSuccess('')

      await axios.post('/users/login', formData)

      setSuccess('Login Successful')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (err: any) {

      setError(
        err.response?.data?.message ||
        'Login failed'
      )

    } finally {
      setLoading(false)
    }
  }


  /* ---------------- UI ---------------- */

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-3">

      <Card className="w-full max-w-md shadow-xl">

        <CardHeader className="text-center">

          <CardTitle className="text-2xl">
            User Login
          </CardTitle>

          <p className="text-sm text-gray-500">
            Welcome back 👋
          </p>

        </CardHeader>


        <CardContent>

          {/* SUCCESS */}

          {success && (

            <div className="mb-4 flex gap-2 bg-green-50 p-3 rounded">

              <CheckCircle className="w-4 text-green-600" />

              <span className="text-sm text-green-700">
                {success}
              </span>

            </div>

          )}


          {/* ERROR */}

          {error && (

            <div className="mb-4 flex gap-2 bg-red-50 p-3 rounded">

              <AlertCircle className="w-4 text-red-600" />

              <span className="text-sm text-red-700">
                {error}
              </span>

            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* EMAIL */}

            <div className="relative">

              <Mail className="absolute left-3 top-3 w-4 text-gray-400" />

              <Input
                type="email"
                placeholder="Email"
                className="pl-9"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
              />

            </div>


            {/* PASSWORD */}

            <div className="relative">

              <Lock className="absolute left-3 top-3 w-4 text-gray-400" />

              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                className="pl-9 pr-9"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
              />

              <button
                type="button"
                className="absolute right-3 top-2.5"
                onClick={() =>
                  setShowPass(!showPass)
                }
              >
                {showPass ? <EyeOff /> : <Eye />}
              </button>

            </div>


            {/* BUTTON */}

            <Button
              disabled={loading}
              className="w-full"
            >

              {loading ? 'Signing in...' : 'Login'}

            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  )
}
