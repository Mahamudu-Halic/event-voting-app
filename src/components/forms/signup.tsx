'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth'
import { signup } from '@/apis/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

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
      <div className="min-h-screen flex items-center justify-center bg-[#1a0b2e]">
        <Card className="w-full max-w-md bg-[#2e0f4f] border-[#8a2be2] text-[#f5f5f5]">
          <CardHeader className="space-y-1">
            <div className="mx-auto w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-[#22c55e]" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-[#f5f5f5]">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-center text-[#b3b3b3]">
              We&apos;ve sent you a confirmation link. Please check your email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#d4af37] text-[#0d0d12] hover:bg-[#a17c1a] font-semibold" asChild>
              <a href="/auth/login">Go to Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0b2e] py-8">
      <Card className="w-full max-w-md bg-[#2e0f4f] border-[#8a2be2] text-[#f5f5f5]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#f5f5f5]">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-[#b3b3b3]">
            Sign up to get started with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-[#f5f5f5]">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="John"
                  className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37]"
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="text-sm text-[#ef4444]">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-[#f5f5f5]">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Doe"
                  className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37]"
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="text-sm text-[#ef4444]">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#f5f5f5]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37]"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-[#ef4444]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-[#f5f5f5]">
                Phone Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+1234567890"
                className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37]"
                {...register('phone_number')}
              />
              {errors.phone_number && (
                <p className="text-sm text-[#ef4444]">{errors.phone_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#f5f5f5]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37] pr-10"
                  {...register('password')}
                />
               
              </div>
              {password && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-[#1a0b2e] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength <= 2 ? 'bg-[#ef4444]' :
                        passwordStrength.strength <= 3 ? 'bg-[#f59e0b]' :
                        'bg-[#22c55e]'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-[#ef4444]">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <Alert className="border-[#ef4444] bg-[#ef4444]/10">
                <AlertDescription className="text-[#ef4444]">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-[#d4af37] text-[#0d0d12] hover:bg-[#a17c1a] font-semibold"
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

          <div className="mt-6 text-center">
            <p className="text-sm text-[#b3b3b3]">
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-[#8a2be2] hover:text-[#d4af37]"
                asChild
              >
                <a href="/auth/login">Sign in</a>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignUp