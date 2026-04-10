import { createClient } from '@/lib/supabase/server'
import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

interface PrivateLayoutProps {
  children: ReactNode
}

export default async function PrivateLayout({ children }: PrivateLayoutProps) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user?.id)
    .single()

  // Prepare user data for sidebar
  const userData = {
    name: user?.user_metadata?.first_name + ' ' + user?.user_metadata?.last_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_url,
    role: profile?.role || 'organizer',
  }

  return (
    <div className="h-screen bg-purple-bg flex">
      <Sidebar user={userData} />
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
