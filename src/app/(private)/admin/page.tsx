import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  Settings, 
  Shield,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

export default function AdminDashboardPage() {
  const adminCards = [
    {
      title: 'Manage Organizers',
      description: 'View and manage all event organizers on the platform',
      icon: Users,
      href: '/admin/organizers',
      count: 'View All',
    },
    {
      title: 'All Events',
      description: 'Monitor and manage all events across the platform',
      icon: Calendar,
      href: '/admin/events',
      count: 'View All',
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings and service fees',
      icon: Settings,
      href: '/admin/settings',
      count: 'Configure',
    },
    {
      title: 'Security & Access',
      description: 'Manage admin access and security settings',
      icon: Shield,
      href: '/admin/security',
      count: 'Manage',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Organizers</p>
                <p className="text-2xl font-bold text-text-primary mt-1">--</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-accent/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Events</p>
                <p className="text-2xl font-bold text-text-primary mt-1">--</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gold-primary/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-gold-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Votes</p>
                <p className="text-2xl font-bold text-text-primary mt-1">--</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Revenue</p>
                <p className="text-2xl font-bold text-text-primary mt-1">$--</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-accent/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card) => (
          <Card key={card.title} className="bg-purple-surface border-purple-accent/50 hover:border-gold-primary/50 transition-colors group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-accent/20 flex items-center justify-center">
                    <card.icon className="h-5 w-5 text-purple-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-text-primary text-lg">{card.title}</CardTitle>
                    <CardDescription className="text-text-secondary text-sm">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className="text-gold-primary hover:text-gold-primary hover:bg-gold-primary/10 group"
                asChild
              >
                <Link href={card.href} className="flex items-center gap-2">
                  {card.count}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
