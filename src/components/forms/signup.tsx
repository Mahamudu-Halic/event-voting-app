'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth'
import { signup } from '@/apis/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, CheckCircle, User, Mail, Lock, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const SignUp = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: SignupFormData) => {
    setError('')
    
    try {
     await signup(data)

      setSuccess(true)
      toast.success('Account created successfully! Please check your email to verify.')
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    const levels = [
      { strength: 0, text: 'Very Weak', color: 'text-[#ef4444]' },
      { strength: 1, text: 'Weak', color: 'text-[#f59e0b]' },
      { strength: 2, text: 'Fair', color: 'text-[#f59e0b]' },
      { strength: 3, text: 'Good', color: 'text-[#22c55e]' },
      { strength: 4, text: 'Strong', color: 'text-[#22c55e]' },
      { strength: 5, text: 'Very Strong', color: 'text-[#22c55e]' },
    ]

    return levels[strength] || levels[0]
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-bg via-purple-surface/50 to-purple-bg px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-linear-to-b from-violet-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-linear-to-t from-purple-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="bg-purple-surface/80 backdrop-blur-xl border-purple-accent/30 shadow-2xl shadow-violet-500/10">
            <CardHeader className="space-y-4 text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto bg-linear-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/30"
              >
                <CheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-white">
                  Check Your Email
                </CardTitle>
                <CardDescription className="text-purple-200/70">
                  We&apos;ve sent you a confirmation link. Please check your email to verify your account.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-linear-to-r from-gold-primary to-gold-dark text-purple-bg hover:opacity-90 font-semibold shadow-lg shadow-gold-primary/25"
                asChild
              >
                <Link href="/auth/login">Go to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-bg via-purple-surface/50 to-purple-bg px-4 py-8">
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
                Create Account
              </CardTitle>
              <CardDescription className="text-purple-200/70">
                Join Tomame to start creating amazing events
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-purple-100">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="John"
                      className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                      {...register('first_name')}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-sm text-red-400">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-purple-100">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Doe"
                      className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                      {...register('last_name')}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-sm text-red-400">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-100">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-purple-100">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300/50" />
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+1234567890"
                    className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                    {...register('phone_number')}
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-sm text-red-400">{errors.phone_number.message}</p>
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
                    type="password"
                    placeholder="Create a strong password"
                    className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-white placeholder:text-purple-300/40 focus:border-gold-primary focus:ring-gold-primary/20"
                    {...register('password')}
                  />
                </div>
                {password && (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-purple-bg/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength <= 2 ? 'bg-red-400' :
                          passwordStrength.strength <= 3 ? 'bg-amber-400' :
                          'bg-green-400'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${passwordStrength.color.replace('[#ef4444]', 'red-400').replace('[#f59e0b]', 'amber-400').replace('[#22c55e]', 'green-400')}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-purple-accent/20">
              <p className="text-sm text-center text-purple-200/60">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-gold-primary hover:text-gold-dark font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default SignUp