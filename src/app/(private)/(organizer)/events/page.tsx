'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      color: 'text-purple-accent',
      bgColor: 'bg-purple-accent/20',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/20',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-error',
      bgColor: 'bg-error/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">My Events</h1>
          <p className="text-text-secondary mt-1">
            Manage your events and track their approval status
          </p>
        </div>
        <Button
          className="bg-gold-primary hover:bg-gold-dark text-text-tertiary"
          asChild
        >
          <Link href="/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
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
                    {isLoading && stats.total === 0 ? (
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
          />
        </CardContent>
      </Card>

      {/* Events Table */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Event List
        </h2>
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
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={executeDelete}
        title="Delete Event"
        description="This action cannot be undone. All associated categories and nominees will also be removed."
        itemName={eventToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  )
}
