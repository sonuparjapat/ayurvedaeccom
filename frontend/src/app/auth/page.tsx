'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notify } from '../utils/notify'
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
import toast from 'react-hot-toast'

import { useAuth } from '@/context/auth-context'


export default function AuthPage() {

  const router = useRouter()
  const { login } = useAuth()

  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

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


  /* ================= VALIDATION ================= */

  const isValidEmail = (email: string) =>
    /\S+@\S+\.\S+/.test(email)
const resetForms = () => {

  setLoginForm({
    email: '',
    password: '',
  })

  setRegisterForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  setErrors({})
  setSuccessMessage('')
}

  /* ================= LOGIN ================= */

 const handleLogin = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  setErrors({});
  setSuccessMessage("");

  if (
    !loginForm.email ||
    !loginForm.password
  ) {
    return setErrors({
      general:
        "All fields are required"
    });
  }

  if (
    !isValidEmail(
      loginForm.email
    )
  ) {
    return setErrors({
      email:
        "Invalid email format"
    });
  }

  try {
    setIsLoading(true);

    const res = await axios.post(
      "/users/login",
      loginForm
    );

    /* login context handles merge */
    await login(
      res.data.user
    );

    toast.success(
      "Welcome back 👋"
    );

    router.push(
      "/account"
    );

  } catch (err: any) {
    console.error(err);

    if (
      err?.response?.status === 401
    ) {
      setErrors({
        general:
          "Invalid credentials"
      });

    } else if (
      err?.response?.status === 429
    ) {
      setErrors({
        general:
          "Too many attempts. Try later."
      });

    } else if (
      err?.response?.status === 500
    ) {
      setErrors({
        general:
          "Server issue. Try again."
      });

    } else {
      setErrors({
        general:
          err?.response?.data
            ?.message ||
          "Login failed"
      });
    }

  } finally {
    setIsLoading(false);
  }
};


  /* ================= REGISTER ================= */

  const handleRegister = async (e: React.FormEvent) => {

    e.preventDefault()
console.log("HIIIIIIIIIIIIIII")
    setErrors({})
    setSuccessMessage('')


    if (
      !registerForm.name ||
      !registerForm.email ||
      !registerForm.phone ||
      !registerForm.password
    ) {
        notify.error("'All fields are required'")
      return setErrors({
        general: 'All fields are required'
      })
    }


    if (!isValidEmail(registerForm.email)) {
       notify.error("Invalid email format")
      return setErrors({
        email: 'Invalid email format'
      })
    }


    if (registerForm.password.length < 6) {
      notify.error("Minimum 6 characters required")
      return setErrors({
        password: 'Minimum 6 characters'
      })
    }


    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      notify.error("Passwords do not match")
      return setErrors({
        confirmPassword: 'Passwords do not match'
      })
    }


    try {

      setIsLoading(true)

      await axios.post('/users/register', {
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      })


      setSuccessMessage(
        'Registered Successfully'
      )

      notify.success('Account created ✅')
setRegisterForm({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

setActiveTab('login')

    } catch (err: any) {

      console.error(err)

      setErrors({
        general:
          err?.response?.data?.message ||
          'Registration failed'
      })


    } finally {
      setIsLoading(false)
    }
  }


  /* ================= UI ================= */

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


                {/* SUCCESS */}

                {successMessage && (

                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">

                    <CheckCircle className="w-4 h-4 text-green-600" />

                    <span className="text-sm text-green-700">
                      {successMessage}
                    </span>

                  </div>
                )}


                {/* ERROR */}

                {errors.general && (

                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">

                    <AlertCircle className="w-4 h-4 text-red-600" />

                    <span className="text-sm text-red-700">
                      {errors.general}
                    </span>

                  </div>
                )}



               <Tabs
  value={activeTab}
  onValueChange={(val) => {
    setActiveTab(val as 'login' | 'register')
    resetForms()
  }}
>


                  <TabsList className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">

                    <TabsTrigger value="login">
                      Login
                    </TabsTrigger>

                    <TabsTrigger value="register">
                      Register
                    </TabsTrigger>

                  </TabsList>



                  {/* LOGIN */}

                  <TabsContent value="login">

                    <form
                      onSubmit={handleLogin}
                      className="space-y-4 mt-4"
                    >

                      <div className="relative">

                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                        <Input
                          className="pl-9"
                          placeholder="Email"
                          value={loginForm.email}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              email: e.target.value
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
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm({
                              ...loginForm,
                              password: e.target.value
                            })
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >

                          {showPassword
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />
                          }

                        </button>

                      </div>


                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >

                        {isLoading
                          ? 'Signing in...'
                          : 'Login'}

                      </Button>

                    </form>

                  </TabsContent>



                  {/* REGISTER */}

                  <TabsContent value="register">

                    <form
                      onSubmit={handleRegister}
                      className="space-y-4 mt-4"
                    >


                      <div className="relative">

                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                        <Input
                          className="pl-9"
                          placeholder="Full Name"
                          value={registerForm.name}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              name: e.target.value
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
                              email: e.target.value
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
                              phone: e.target.value
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
                              password: e.target.value
                            })
                          }
                        />

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
                              confirmPassword: e.target.value
                            })
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >

                          {showConfirmPassword
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />
                          }

                        </button>

                      </div>


                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >

                        {isLoading
                          ? 'Creating account...'
                          : 'Register'}

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