'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { getOrganizerEvents, getEventStats } from '@/apis/events'
import { getVotingSummary } from '@/apis/voting'
import {
  type EventListItem
} from '@/lib/validations/event'
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Users,
  BarChart3, TrendingUp,
  Layers,
  Loader2,
  Sparkles,
  Zap,
  Target,
  Activity,
  ChevronRight,
  Star
} from 'lucide-react'

interface DashboardStats {
  totalEvents: number
  pendingEvents: number
  approvedEvents: number
  rejectedEvents: number
  totalCategories: number
  totalVotes: number
  totalNominees: number
}

export default function DashboardPage() {
  const [recentEvents, setRecentEvents] = useState<EventListItem[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    pendingEvents: 0,
    approvedEvents: 0,
    rejectedEvents: 0,
    totalCategories: 0,
    totalVotes: 0,
    totalNominees: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch events and basic stats
      const [eventsResult, eventStats] = await Promise.all([
        getOrganizerEvents({ page: 1, limit: 5 }),
        getEventStats(),
      ])

      setRecentEvents(eventsResult.data)

      // Calculate total categories across all events
      const totalCategories = eventsResult.data.reduce(
        (sum, event) => sum + ((event as any).categories || 0),
        0
      )

      // Fetch voting summary for each approved event with voting enabled
      let totalVotes = 0
      let totalNominees = 0

      const votingEvents = eventsResult.data.filter(
        (e) => e.approvalStatus === 'approved' && e.enableVoting
      )

      for (const event of votingEvents.slice(0, 3)) {
        try {
          const summary = await getVotingSummary(event.id)
          totalVotes += summary.total_votes
          totalNominees += summary.total_nominees
        } catch {
          // Ignore errors for individual events
        }
      }

      setStats({
        totalEvents: eventStats.total,
        pendingEvents: eventStats.pending,
        approvedEvents: eventStats.approved,
        rejectedEvents: eventStats.rejected,
        totalCategories,
        totalVotes,
        totalNominees,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchDashboardData()
  }, [fetchDashboardData])

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconBg: 'bg-linear-to-br from-violet-500 to-purple-600',
      trend: '+12%',
      href: '/organizer/events',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: Layers,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-linear-to-br from-blue-500 to-cyan-500',
      trend: '+8%',
      href: '/organizer/events',
    },
    {
      title: 'Total Votes',
      value: stats.totalVotes,
      icon: Trophy,
      gradient: 'from-amber-500/20 to-yellow-500/20',
      iconBg: 'bg-linear-to-br from-amber-500 to-yellow-500',
      trend: '+24%',
      href: '/organizer/events',
    },
    {
      title: 'Nominees',
      value: stats.totalNominees,
      icon: Users,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'bg-linear-to-br from-emerald-500 to-teal-500',
      trend: '+15%',
      href: '/organizer/events',
    },
  ]

  const statusCards = [
    {
      title: 'Pending',
      value: stats.pendingEvents,
      total: stats.totalEvents,
      icon: Clock,
      color: 'text-amber-300',
      bgColor: 'from-amber-600/80 to-orange-600/80',
      borderColor: 'border-amber-400/50',
    },
    {
      title: 'Approved',
      value: stats.approvedEvents,
      total: stats.totalEvents,
      icon: CheckCircle,
      color: 'text-emerald-300',
      bgColor: 'from-emerald-600/80 to-teal-600/80',
      borderColor: 'border-emerald-400/50',
    },
    {
      title: 'Rejected',
      value: stats.rejectedEvents,
      total: stats.totalEvents,
      icon: XCircle,
      color: 'text-rose-300',
      bgColor: 'from-rose-600/80 to-pink-600/80',
      borderColor: 'border-rose-400/50',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            Approved
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            Pending
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-error/20 text-error border-error/30">
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-clip-text text-white">
              Dashboard
            </h1>
            <Badge className="bg-linear-to-r from-violet-500/30 to-purple-500/30 text-purple-200 border-purple-500/40">
              <Sparkles className="h-3 w-3 mr-1" />
              Organizer
            </Badge>
          </div>
          <p className="text-text-secondary mt-2 text-lg">
            Welcome back! Here&apos;s what&apos;s happening with your events.
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            className="bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/25"
            asChild
          >
            <Link href="/organizer/events/new">
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Main Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link href={card.href}>
                <Card className="relative overflow-hidden bg-linear-to-br from-purple-surface to-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group cursor-pointer">
                  <div className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <p className="text-text-secondary text-sm font-medium">{card.title}</p>
                        <p className="text-3xl font-bold text-text-primary">
                          {isLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
                          ) : (
                            card.value.toLocaleString()
                          )}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">{card.trend}</span>
                          <span className="text-text-tertiary">vs last month</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl ${card.iconBg} shadow-lg`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Event Status Distribution */}
      <motion.div variants={itemVariants}>
        <Card className="bg-linear-to-br from-purple-surface to-purple-surface/90 border-purple-accent/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-text-primary flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Event Status Distribution
                </CardTitle>
                <CardDescription className="text-text-secondary mt-1">
                  Overview of your event approval statuses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {statusCards.map((card) => {
                const percentage = card.total > 0 ? Math.round((card.value / card.total) * 100) : 0
                return (
                  <motion.div
                    key={card.title}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative overflow-hidden"
                  >
                    <div className={`p-6 rounded-2xl border-2 ${card.borderColor} bg-linear-to-br ${card.bgColor} shadow-lg`}>
                      {/* Decorative background pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-white/20 shadow-inner`}>
                              <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${card.color}`}>{card.title}</p>
                              <p className="text-3xl font-bold text-white mt-1">
                                {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : card.value}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-white/90">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="h-3 rounded-full bg-black/20 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full rounded-full ${card.color.replace('text-', 'bg-')}`}
                            />
                          </div>
                          <p className="text-xs text-white/70 font-medium text-right">
                            {card.value} of {card.total} events
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Events */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="h-full bg-linear-to-br from-purple-surface to-purple-surface/90 border-purple-accent/30">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-text-primary flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Recent Events
                </CardTitle>
                <CardDescription className="text-text-secondary mt-1">
                  Your latest events and their performance
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="group">
                <Link
                  href="/orgainer/events"
                  className="text-purple-400 hover:text-purple-300"
                >
                  View All
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
                </div>
              ) : recentEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 px-4"
                >
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    No events yet
                  </h3>
                  <p className="text-text-secondary mb-6 max-w-sm mx-auto">
                    Create your first event to start managing voting categories and nominees.
                  </p>
                  <Button
                    size="lg"
                    className="bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                    asChild
                  >
                    <Link href="/organizer/events/new">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Event
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/organizer/events/${event.id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-bg/50 hover:bg-purple-accent/10 transition-all duration-300 group border border-transparent hover:border-purple-accent/20">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-purple-accent/30 shadow-lg">
                              <AvatarImage src={event.eventImageUrl || undefined} />
                              <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-white font-semibold">
                                {event.eventName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {event.approvalStatus === 'approved' && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-purple-surface">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-text-primary truncate">
                                {event.eventName}
                              </h3>
                              {getStatusBadge(event.approvalStatus)}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                              <span className="flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5" />
                                {(event as any).categories || 0} Categories
                              </span>
                              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                              <span className="flex items-center gap-1">
                                <span className="font-bold text-xs">₵</span>
                                ₵{event.amountPerVote}/vote
                              </span>
                              {event.enableVoting && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                                    <Activity className="h-3 w-3 mr-1" />
                                    Voting Active
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-text-tertiary group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Tips */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-purple-surface border-violet-500/40 shadow-xl shadow-violet-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div whileHover={{ x: 4, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href="/organizer/events/new">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all duration-300 shadow-lg group cursor-pointer">
                    <div className="p-2.5 rounded-lg bg-white/20">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Create New Event</p>
                      <p className="text-sm text-purple-200">Launch a new voting event</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ x: 4, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href="/organizer/events">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 group cursor-pointer">
                    <div className="p-2.5 rounded-lg bg-purple-500/30">
                      <Calendar className="h-5 w-5 text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Manage Events</p>
                      <p className="text-sm text-purple-200/80">View and edit existing events</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ x: 4, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href="/organizer/withdrawals">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 group cursor-pointer">
                    <div className="p-2.5 rounded-lg bg-emerald-500/30">
                      <BarChart3 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">View Earnings</p>
                      <p className="text-sm text-purple-200/80">Track revenue and withdrawals</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            </CardContent>
          </Card>

          {/* Pro Tip */}
          <Card className="bg-purple-surface border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-200 mb-1">Pro Tip</p>
                  <p className="text-sm text-text-secondary">
                    Events with clear descriptions and quality images get 40% more engagement from voters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Getting Started Guide - Only shows when no events */}
      {recentEvents.length === 0 && !isLoading && (
        <motion.div variants={itemVariants}>
          <Card className="bg-linear-to-br from-purple-surface to-purple-surface/90 border-purple-accent/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
            <CardHeader className="relative">
              <CardTitle className="text-text-primary flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-amber-400" />
                Getting Started
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Follow these steps to launch your first successful voting event
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '01',
                    title: 'Create an Event',
                    desc: 'Set up your event with compelling details, pricing, and key dates.',
                    icon: Calendar,
                    color: 'from-violet-500 to-purple-600',
                  },
                  {
                    step: '02',
                    title: 'Add Categories',
                    desc: 'Define voting categories and add nominees with photos and bios.',
                    icon: Layers,
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    step: '03',
                    title: 'Launch & Monitor',
                    desc: 'Start voting and track real-time results as votes come in.',
                    icon: Activity,
                    color: 'from-emerald-500 to-teal-500',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    className="relative group"
                  >
                    <div className="p-6 rounded-2xl bg-purple-bg/50 border border-purple-accent/20 hover:border-purple-accent/40 transition-all duration-300 hover:bg-purple-bg">
                      <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-purple-400">{item.step}</span>
                        <div className="h-px flex-1 bg-linear-to-r from-purple-accent/50 to-transparent" />
                      </div>
                      <h4 className="font-semibold text-text-primary text-lg mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
