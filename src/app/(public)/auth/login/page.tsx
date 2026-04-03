'use client'

import { useSearchParams } from 'next/navigation'
import Login from '@/components/forms/login'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  return <Login redirectUrl={redirect || '/dashboard'} />
}