'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { login } from '@/apis/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface LoginProps {
  redirectUrl?: string
}

const Login = ({ redirectUrl = '/dashboard' }: LoginProps) => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const { error } = await login(data)
      
      if (error) {
        setError(error.message)
        return
      }

      toast.success('Login successful!')
      router.push(redirectUrl)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-bg via-purple-surface/50 to-purple-bg px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-linear-to-b from-violet-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-linear-to-t from-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-purple-surface/80 backdrop-blur-xl border-purple-accent/30 shadow-2xl shadow-violet-500/10">
          <CardHeader className="space-y-4 text-center pb-6">
            <Link href="/" className="inline-block mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 mx-auto bg-linear-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-accent/30"
              >
                <Image
                  src="/logo.png"
                  alt="Tomame"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </motion.div>
            </Link>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-purple-200/70">
                Sign in to your Tomame account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-100">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-100">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-purple-200 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-gold-primary hover:text-gold-dark transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-linear-to-r from-gold-primary to-gold-dark text-purple-bg hover:opacity-90 font-semibold shadow-lg shadow-gold-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-purple-accent/20">
              <p className="text-sm text-center text-purple-200/60">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-gold-primary hover:text-gold-dark font-medium transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Login