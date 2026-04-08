'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventTable } from '@/components/events/event-table'
import { EventFilters } from '@/components/events/event-filters'
import { toast } from 'sonner'
import { useDeleteConfirmation, DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import {
  getOrganizerEvents,
  deleteEvent,
  getEventStats,
  updateEvent,
} from '@/apis/events'
import {
  type EventListItem,
  type PaginatedResult,
  type EventFilters as EventFiltersType,
  type EventSort,
  DEFAULT_PAGE_SIZE,
} from '@/lib/validations/event'
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Filter,
  TrendingUp,
  ChevronRight,
  Layers,
  Zap,
} from 'lucide-react'

export default function EventsPage() {
  const [events, setEvents] = useState<PaginatedResult<EventListItem>>({
    data: [],
    total: 0,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<EventFiltersType>({})
  const [sort, setSort] = useState<EventSort | undefined>({
    field: 'created_at',
    order: 'desc',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const {
    isOpen: isDeleteDialogOpen,
    itemToDelete: eventToDelete,
    isDeleting,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useDeleteConfirmation()

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getOrganizerEvents({
        page: events.page,
        limit: DEFAULT_PAGE_SIZE,
        filters,
        sort,
      })
      setEvents(result)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [events.page, filters, sort])

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getEventStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handlePageChange = useCallback((page: number) => {
    setEvents((prev) => ({ ...prev, page }))
  }, [])

  const handleFiltersChange = useCallback((newFilters: EventFiltersType) => {
    setFilters(newFilters)
    setEvents((prev) => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }, [])

  const handleSortChange = useCallback((newSort: EventSort) => {
    setSort(newSort)
  }, [])

  const handleUpdate = useCallback(async (eventId: string, data: Partial<EventListItem>) => {
    setIsUpdating(eventId)
    try {
      await updateEvent(eventId, {
        eventName: data.eventName,
        eventDescription: data.eventDescription,
        eventImageUrl: data.eventImageUrl,
        nominationStartDate: data.nominationStartDate || undefined,
        nominationEndDate: data.nominationEndDate || undefined,
        votingStartDate: data.votingStartDate || undefined,
        votingEndDate: data.votingEndDate || undefined,
      })
      toast.success('Event updated successfully')
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    } finally {
      setIsUpdating(null)
    }
  }, [fetchEvents])

  const handleDelete = useCallback(
    async (eventId: string, eventName?: string) => {
      openDeleteDialog(eventId, eventName)
    },
    [openDeleteDialog]
  )

  const executeDelete = useCallback(async () => {
    await confirmDelete(async (id) => {
      try {
        await deleteEvent(id)
        toast.success('Event deleted successfully')
        fetchEvents()
        fetchStats()
      } catch (error) {
        console.error('Error deleting event:', error)
        toast.error(
          'Failed to delete event. Only pending events can be deleted.'
        )
      }
    })
  }, [confirmDelete, fetchEvents, fetchStats])

  const statsCards = [
    {
      title: 'Total Events',
      value: stats.total,
      icon: Calendar,
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      trend: '+12%',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      trend: '+2',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      trend: '+8',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      gradient: 'from-rose-500/20 to-pink-500/20',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      trend: '-1',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              My Events
            </h1>
            <Badge className="bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-purple-200 border-purple-500/40">
              <Layers className="h-3 w-3 mr-1" />
              {stats.total} Total
            </Badge>
          </div>
          <p className="text-text-secondary mt-2 text-lg">
            Manage your events and track their approval status
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/25"
            asChild
          >
            <Link href="/events/new">
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-surface to-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-text-secondary text-sm font-medium">{card.title}</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {isLoading && stats.total === 0 ? (
                          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
                        ) : (
                          card.value
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">{card.trend}</span>
                        <span className="text-text-secondary">this month</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${card.iconBg} shadow-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border-violet-500/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/30">
                <Filter className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Filters
                </CardTitle>
                <CardDescription className="text-purple-200/70">
                  Filter and search through your events
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-violet-400/30 text-violet-300">
              {events.total} events found
            </Badge>
          </CardHeader>
          <CardContent>
            <EventFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Events Table */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-purple-surface to-purple-surface/90 border-purple-accent/30">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/30">
                <Zap className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <CardTitle className="text-text-primary flex items-center gap-2">
                  Event List
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  Manage and track all your events
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="group">
              <span className="text-purple-400 group-hover:text-purple-300">View Analytics</span>
              <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardHeader>
          <CardContent>
            <EventTable
              events={events}
              sort={sort}
              onSort={handleSortChange}
              onPageChange={handlePageChange}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              isLoading={isLoading}
              isUpdating={isUpdating}
            />
          </CardContent>
        </Card>
      </motion.div>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={executeDelete}
        title="Delete Event"
        description="This action cannot be undone. All associated categories and nominees will also be removed."
        itemName={eventToDelete?.name}
        isDeleting={isDeleting}
      />
    </motion.div>
  )
}
