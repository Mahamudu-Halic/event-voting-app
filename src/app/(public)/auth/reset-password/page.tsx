'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '@/apis/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Check if user came from reset email (has access token in hash)
  useEffect(() => {
    // Supabase puts the access token in the URL hash after clicking the reset link
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setHasToken(true)
    }
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      const { error } = await resetPassword(data.password)
      if (error) {
        toast.error(error.message)
      } else {
        setIsSubmitted(true)
        toast.success('Password reset successfully!')
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
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
                Reset Password
              </CardTitle>
              <CardDescription className="text-purple-200/70">
                {isSubmitted
                  ? 'Your password has been reset'
                  : hasToken
                  ? 'Enter your new password below'
                  : 'Invalid or expired reset link'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto bg-linear-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30"
                >
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </motion.div>
                <p className="text-purple-200/70">
                  Your password has been reset successfully. You will be redirected to the login page.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-purple-accent/30 text-purple-100 hover:bg-purple-accent/20 hover:text-white"
                  asChild
                >
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Login
                  </Link>
                </Button>
              </div>
            ) : !hasToken ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-linear-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                  <Lock className="h-10 w-10 text-red-400" />
                </div>
                <p className="text-purple-200/70">
                  The password reset link is invalid or has expired. Please request a new one.
                </p>
                <Button
                  className="w-full bg-linear-to-r from-gold-primary to-gold-dark text-purple-bg hover:opacity-90 font-semibold shadow-lg shadow-gold-primary/25"
                  asChild
                >
                  <Link href="/auth/forgot-password">
                    Request New Link
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-purple-100">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-purple-100">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-purple-200 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-gold-primary to-gold-dark text-purple-bg hover:opacity-90 font-semibold shadow-lg shadow-gold-primary/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-purple-200/60 hover:text-purple-100"
                  asChild
                >
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
