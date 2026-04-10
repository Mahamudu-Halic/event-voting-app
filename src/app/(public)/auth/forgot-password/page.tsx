'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '@/apis/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      const { error } = await forgotPassword(data.email)
      if (error) {
        toast.error(error.message)
      } else {
        setIsSubmitted(true)
        toast.success('Password reset email sent!')
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
                Forgot Password
              </CardTitle>
              <CardDescription className="text-purple-200/70">
                {isSubmitted
                  ? 'Check your email for the reset link'
                  : 'Enter your email and we will send you a reset link'}
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
                  We have sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-purple-accent/30 text-purple-100 hover:bg-purple-accent/20 hover:text-white"
                  asChild
                >
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            ) : (
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

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-gold-primary to-gold-dark text-purple-bg hover:opacity-90 font-semibold shadow-lg shadow-gold-primary/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
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
