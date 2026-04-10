'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminEventTable } from '@/components/events/admin-event-table'
import { EventFilters } from '@/components/events/event-filters'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  getAllEvents,
  getPendingEventsCount,
  approveEvent,
  rejectEvent,
} from '@/apis/events'
import {
  type EventListItem,
  type PaginatedResult,
  type EventFilters as EventFiltersType,
  type EventSort,
  DEFAULT_PAGE_SIZE,
} from '@/lib/validations/event'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
} from 'lucide-react'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<PaginatedResult<EventListItem>>({
    data: [],
    total: 0,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<EventFiltersType>({
    status: 'all',
  })
  const [sort, setSort] = useState<EventSort | undefined>({
    field: 'created_at',
    order: 'desc',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAllEvents({
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

  const fetchPendingCount = useCallback(async () => {
    try {
      const count = await getPendingEventsCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    fetchPendingCount()
  }, [fetchPendingCount])

  const handlePageChange = useCallback((page: number) => {
    setEvents((prev) => ({ ...prev, page }))
  }, [])

  const handleFiltersChange = useCallback((newFilters: EventFiltersType) => {
    setFilters(newFilters)
    setEvents((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleSortChange = useCallback((newSort: EventSort) => {
    setSort(newSort)
  }, [])

  const handleApprove = useCallback(async (eventId: string, eventName: string) => {
    try {
      await approveEvent(eventId)
      toast.success(`Event "${eventName}" has been approved`)
      fetchEvents()
      fetchPendingCount()
    } catch (error) {
      console.error('Error approving event:', error)
      toast.error('Failed to approve event')
    }
  }, [fetchEvents, fetchPendingCount])

  const handleReject = useCallback(async (eventId: string, eventName: string, reason?: string) => {
    try {
      await rejectEvent(eventId, reason)
      toast.success(`Event "${eventName}" has been rejected`)
      fetchEvents()
      fetchPendingCount()
    } catch (error) {
      console.error('Error rejecting event:', error)
      toast.error('Failed to reject event')
    }
  }, [fetchEvents, fetchPendingCount])

  const statsCards = [
    {
      title: 'Total Events',
      value: events.total,
      icon: Calendar,
      color: 'text-purple-accent',
      bgColor: 'bg-purple-accent/20',
    },
    {
      title: 'Pending Approval',
      value: pendingCount,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
      badge: pendingCount > 0,
    },
    {
      title: 'Approved',
      value: events.total - pendingCount, // Approximation
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/20',
    },
    {
      title: 'Rejected',
      value: '—',
      icon: XCircle,
      color: 'text-error',
      bgColor: 'bg-error/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gold-primary/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-gold-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              All Events
            </h1>
            <p className="text-text-secondary mt-1">
              Manage and approve events across the platform
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <Badge
            variant="outline"
            className="bg-warning/20 text-warning border-warning/30 px-3 py-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            {pendingCount} pending approval
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card
            key={card.title}
            className="bg-purple-surface border-purple-accent/50"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {isLoading && events.total === 0 ? (
                      <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}
                >
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-purple-surface border-purple-accent/50">
        <CardHeader>
          <CardTitle className="text-text-primary text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <EventFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isAdmin
          />
        </CardContent>
      </Card>

      {/* Events Table */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Event List
        </h2>
        <AdminEventTable
          events={events}
          sort={sort}
          onSort={handleSortChange}
          onPageChange={handlePageChange}
          onApprove={handleApprove}
          onReject={handleReject}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
