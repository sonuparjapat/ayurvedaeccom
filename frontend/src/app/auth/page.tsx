'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { useAuth } from '@/context/auth-context'

export default function AuthPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
const {login}=useAuth()
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  /* ---------------- VALIDATION ---------------- */

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {}

    if (!loginForm.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(loginForm.email))
      newErrors.email = 'Email is invalid'

    if (!loginForm.password)
      newErrors.password = 'Password is required'
    else if (loginForm.password.length < 6)
      newErrors.password = 'Minimum 6 characters required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {}

    if (!registerForm.name) newErrors.name = 'Name is required'
    if (!registerForm.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(registerForm.email))
      newErrors.email = 'Email is invalid'

    if (!registerForm.phone) newErrors.phone = 'Phone number is required'

    if (!registerForm.password)
      newErrors.password = 'Password is required'
    else if (registerForm.password.length < 6)
      newErrors.password = 'Minimum 6 characters required'

    if (registerForm.password !== registerForm.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /* ---------------- LOGIN ---------------- */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLoginForm()) return

    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')

    try {
  const res= await axios.post('/users/login', loginForm)
      setSuccessMessage('Login successful! Redirecting...')
 login(res?.data?.user)
    router.push('/account')
    } catch (err: any) {
      setErrors({
        general:
          err.response?.data?.message ||
          'Invalid email or password',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /* ---------------- REGISTER ---------------- */

 const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validateRegisterForm()) return

  setIsLoading(true)
  setErrors({})
  setSuccessMessage('')

  try {
    await axios.post('/users/register', {
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
    })

    setSuccessMessage(
      'Registration successful! Please check your email to verify your account.'
    )

  } catch (err: any) {
    setErrors({
      general:
        err.response?.data?.message ||
        'Registration failed. Please try again.',
    })
  } finally {
    setIsLoading(false)
  }
}


  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">

            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  User Authentication
                </CardTitle>
              </CardHeader>

              <CardContent>

                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      {successMessage}
                    </span>
                  </div>
                )}

                {errors.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {errors.general}
                    </span>
                  </div>
                )}

                <Tabs defaultValue="login">
                
  <TabsList className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
  <TabsTrigger
    value="login"
    className="
      rounded-lg
      text-sm font-semibold
      transition-all
      data-[state=active]:bg-white
      data-[state=active]:text-emerald-600
      data-[state=active]:shadow
      hover:text-emerald-600
    "
  >
    Login
  </TabsTrigger>

  <TabsTrigger
    value="register"
    className="
      rounded-lg
      text-sm font-semibold
      transition-all
      data-[state=active]:bg-white
      data-[state=active]:text-emerald-600
      data-[state=active]:shadow
      hover:text-emerald-600
    "
  >
    Register
  </TabsTrigger>
</TabsList>

                  {/* LOGIN */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          className="pl-9"
                          placeholder="Email"
                          value={loginForm.email}
                          onChange={(e) =>
                            setLoginForm({ ...loginForm, email: e.target.value })
                          }
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="pl-9 pr-9"
                          placeholder="Password"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              password: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Login'}
                      </Button>

                    </form>
                  </TabsContent>

                  {/* REGISTER */}
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4 mt-4">

                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          className="pl-9"
                          placeholder="Full Name"
                          value={registerForm.name}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          className="pl-9"
                          placeholder="Email"
                          value={registerForm.email}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          className="pl-9"
                          placeholder="Phone"
                          value={registerForm.phone}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="pl-9 pr-9"
                          placeholder="Password"
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              password: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="pl-9 pr-9"
                          placeholder="Confirm Password"
                          value={registerForm.confirmPassword}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              confirmPassword: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Register'}
                      </Button>

                    </form>
                  </TabsContent>
                </Tabs>

              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
