import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

interface PrivateLayoutProps {
  children: ReactNode
}

export default async function PrivateLayout({ children }: PrivateLayoutProps) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user || error) {
    redirect('/auth/login')
  }

  // Get user metadata including role
  const userData = {
    name: user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url,
    role: (user.user_metadata?.role as string) || 'organizer',
  }

  return (
    <div className="h-screen bg-purple-bg flex">
      <Sidebar user={userData} />
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <Header user={userData} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}