'use client'

import { useState } from 'react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import axios from '@/lib/axios'


export default function AdminAuthPage() {

  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')


  /* ---------------- VALIDATION ---------------- */

  const validateForm = () => {

    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 characters required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }


  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')


    try {

      const res = await axios.post('/admin/login', {
        email: formData.email,
        password: formData.password,
      })


      /* Save Token */

      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('isAdminLoggedIn', 'true')
      localStorage.setItem('adminUser', JSON.stringify(res.data.admin))


      setSuccessMessage('Login successful! Redirecting...')


      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1200)


    } catch (err: any) {

      setErrors({
        general:
          err.response?.data?.message ||
          'Login failed. Please try again.',
      })

    } finally {
      setIsLoading(false)
    }
  }


/* ---------------- UI ---------------- */

return (
<div className="min-h-screen flex flex-col bg-gray-50">

<Header />


<main className="flex-1 flex items-center justify-center py-8 px-3">

<motion.div
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
className="w-full max-w-md"
>


<Card className="shadow-xl">

<CardHeader className="text-center pb-6">

<div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
<Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
</div>

<CardTitle className="text-xl sm:text-2xl font-bold">
Admin Login
</CardTitle>

<p className="text-sm text-gray-600">
Enter your admin credentials
</p>

</CardHeader>


<CardContent>


{/* SUCCESS */}

{successMessage && (

<motion.div
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
>

<CheckCircle className="w-4 h-4 text-green-600" />

<span className="text-sm text-green-700">
{successMessage}
</span>

</motion.div>

)}


{/* ERROR */}

{errors.general && (

<motion.div
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
>

<AlertCircle className="w-4 h-4 text-red-600" />

<span className="text-sm text-red-700">
{errors.general}
</span>

</motion.div>

)}


<form
onSubmit={handleSubmit}
className="space-y-4"
>


{/* EMAIL */}

<div>

<label className="text-sm font-medium mb-1 block">
Admin Email
</label>

<Input
type="email"
placeholder="admin@example.com"
value={formData.email}
onChange={(e) =>
setFormData({
...formData,
email: e.target.value,
})
}
/>

{errors.email && (
<p className="text-red-500 text-xs mt-1">
{errors.email}
</p>
)}

</div>


{/* PASSWORD */}

<div>

<label className="text-sm font-medium mb-1 block">
Password
</label>

<div className="relative">

<Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

<Input
type={showPassword ? 'text' : 'password'}
placeholder="Enter password"
value={formData.password}
onChange={(e) =>
setFormData({
...formData,
password: e.target.value,
})
}
className="pl-9 pr-9"
/>

<Button
type="button"
variant="ghost"
size="sm"
className="absolute right-0 top-1/2 -translate-y-1/2"
onClick={() =>
setShowPassword(!showPassword)
}
>

{showPassword ? (
<EyeOff className="w-4 h-4" />
) : (
<Eye className="w-4 h-4" />
)}

</Button>

</div>

{errors.password && (
<p className="text-red-500 text-xs mt-1">
{errors.password}
</p>
)}

</div>


{/* BUTTON */}

<Button
type="submit"
className="w-full bg-emerald-600 hover:bg-emerald-700"
disabled={isLoading}
>

{isLoading ? 'Signing in...' : 'Sign In'}

</Button>


</form>

</CardContent>

</Card>

</motion.div>

</main>


<Footer />

</div>
)
}