'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Settings,
  Shield,
  TrendingUp,
  ArrowRight,
  Crown,
  Activity,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }
  }
}

export default function AdminDashboardPage() {
  const adminCards = [
    {
      title: 'Manage Organizers',
      description: 'View and manage all event organizers on the platform',
      icon: Users,
      href: '/admin/organizers',
      count: 'View All',
      color: 'from-violet-500/20 to-purple-500/20',
      iconColor: 'text-violet-400',
    },
    {
      title: 'All Events',
      description: 'Monitor and manage all events across the platform',
      icon: Calendar,
      href: '/admin/events',
      count: 'View All',
      color: 'from-gold-primary/20 to-amber-500/20',
      iconColor: 'text-gold-primary',
    },
    {
      title: 'Withdrawal Management',
      description: 'Review and process withdrawal requests from organizers',
      icon: DollarSign,
      href: '/admin/withdrawals',
      count: 'Manage',
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings and service fees',
      icon: Settings,
      href: '/admin/settings',
      count: 'Configure',
      color: 'from-rose-500/20 to-pink-500/20',
      iconColor: 'text-rose-400',
    },
    {
      title: 'Security & Access',
      description: 'Manage admin access and security settings',
      icon: Shield,
      href: '/admin/security',
      count: 'Manage',
      color: 'from-indigo-500/20 to-blue-500/20',
      iconColor: 'text-indigo-400',
    },
  ]

  const stats = [
    {
      title: 'Total Organizers',
      value: '--',
      icon: Users,
      color: 'from-violet-500/30 to-purple-500/30',
      iconColor: 'text-violet-400',
      trend: '+12%',
    },
    {
      title: 'Total Events',
      value: '--',
      icon: Calendar,
      color: 'from-gold-primary/30 to-amber-500/30',
      iconColor: 'text-gold-primary',
      trend: '+8%',
    },
    {
      title: 'Total Votes',
      value: '--',
      icon: Activity,
      color: 'from-emerald-500/30 to-teal-500/30',
      iconColor: 'text-emerald-400',
      trend: '+24%',
    },
    {
      title: 'Revenue',
      value: '$--',
      icon: DollarSign,
      color: 'from-rose-500/30 to-pink-500/30',
      iconColor: 'text-rose-400',
      trend: '+15%',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 rounded-xl bg-linear-to-br from-gold-primary/30 to-amber-500/30 flex items-center justify-center border border-gold-primary/30"
          >
            <Crown className="h-7 w-7 text-gold-primary" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary mt-1">
              Manage organizers, events, and system settings
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-gold-primary/20 text-gold-primary border-gold-primary/30 px-4 py-1.5 text-sm font-medium w-fit"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin Access
        </Badge>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="bg-purple-surface/80 backdrop-blur-sm border-purple-accent/30 hover:border-purple-accent/50 transition-all duration-300 group overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-text-secondary text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-text-primary mt-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">{stat.trend}</span>
                      <span className="text-xs text-text-secondary ml-1">vs last month</span>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center border border-white/10`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      >
        <Card className="bg-purple-surface/80 backdrop-blur-sm border-purple-accent/30">
          <CardHeader>
            <CardTitle className="text-text-primary text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-gold-primary" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-bg/50">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Approved Events</p>
                  <p className="text-2xl font-bold text-emerald-400">--</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-bg/50">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Pending Approval</p>
                  <p className="text-2xl font-bold text-amber-400">--</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-bg/50">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Rejected</p>
                  <p className="text-2xl font-bold text-rose-400">--</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin Actions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {adminCards.map((card, index) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Card className="bg-purple-surface/80 backdrop-blur-sm border-purple-accent/30 hover:border-gold-primary/30 transition-all duration-300 group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-12 h-12 rounded-xl bg-linear-to-br ${card.color} flex items-center justify-center border border-white/10`}
                    >
                      <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                    </motion.div>
                    <div>
                      <CardTitle className="text-text-primary text-lg">{card.title}</CardTitle>
                      <CardDescription className="text-text-secondary text-sm mt-1">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="text-gold-primary hover:text-gold-primary hover:bg-gold-primary/10 group/btn p-0 h-auto font-medium"
                  asChild
                >
                  <Link href={card.href} className="flex items-center gap-2">
                    {card.count}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
