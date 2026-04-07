import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user || error) {
    redirect('/auth/login')
  }

  // Check if user has admin role
  const userRole = (user.user_metadata?.role as string) || 'organizer'
  
  if (userRole !== 'admin') {
    // Redirect non-admin users to dashboard
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Manage organizers, events, and system settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-accent/20 text-purple-accent text-sm font-medium">
            Admin Access
          </span>
        </div>
      </div>
      
      {children}
    </div>
  )
}
