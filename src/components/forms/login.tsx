'use client'

import { useState } from 'react'
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
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

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
    <div className="min-h-screen flex items-center justify-center bg-[#1a0b2e]">
      <Card className="w-full max-w-md bg-[#2e0f4f] border-[#8a2be2] text-[#f5f5f5]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#f5f5f5]">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-[#b3b3b3]">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#f5f5f5]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37]"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-[#ef4444]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#f5f5f5]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="bg-[#1a0b2e] border-[#8a2be2] text-[#f5f5f5] placeholder-[#b3b3b3] focus:border-[#d4af37] focus:ring-[#d4af37] pr-10"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-[#b3b3b3] hover:text-[#f5f5f5]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
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

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-[#b3b3b3]">
              Don&apos;t have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-[#8a2be2] hover:text-[#d4af37]"
                asChild
              >
                <a href="/auth/signup">Sign up</a>
              </Button>
            </p>
            <p className="text-sm text-[#b3b3b3]">
              <Button
                variant="link"
                className="p-0 h-auto text-[#8a2be2] hover:text-[#d4af37]"
                asChild
              >
                <a href="/auth/forgot-password">Forgot password?</a>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login