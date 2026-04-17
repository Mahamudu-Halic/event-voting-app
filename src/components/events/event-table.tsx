'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  Trash2, Calendar,
  MoreVertical,
  Pencil
} from 'lucide-react'
import {
  type EventListItem,
  type EventSort,
  type EventSortField,
  type PaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/validations/event'
import { QuickEditEventSheet } from './quick-edit-event-sheet'

interface EventTableProps {
  events: PaginatedResult<EventListItem>
  sort?: EventSort
  onSort?: (sort: EventSort) => void
  onPageChange: (page: number) => void
  onDelete?: (eventId: string, eventName?: string) => void
  onUpdate?: (eventId: string, data: Partial<EventListItem>) => void
  isAdmin?: boolean
  isLoading?: boolean
  isUpdating?: string | null
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  approved: {
    label: 'Approved',
    className: 'bg-success/20 text-success border-success/30',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-error/20 text-error border-error/30',
  },
}

// Helper to calculate event progress
function getEventProgress(event: EventListItem): {
  label: string
  className: string
} {
  const now = new Date()
  const nominationStart = event.nominationStartDate ? new Date(event.nominationStartDate) : null
  const nominationEnd = event.nominationEndDate ? new Date(event.nominationEndDate) : null
  const votingStart = event.votingStartDate ? new Date(event.votingStartDate) : null
  const votingEnd = event.votingEndDate ? new Date(event.votingEndDate) : null

  // Check if ended
  if (votingEnd && now > votingEnd) {
    return { label: 'Ended', className: 'bg-slate-500/20 text-slate-300 border-slate-400/40' }
  }
  
  // Check if in voting period - only open if approved by admin
  if (votingStart && votingEnd && now >= votingStart && now <= votingEnd) {
    if (event.approvalStatus === 'approved') {
      return { label: 'Voting Open', className: 'bg-purple-accent/20 text-purple-accent border-purple-accent/30' }
    } else {
      return { label: 'Pending Approval', className: 'bg-amber-500/20 text-amber-300 border-amber-400/40' }
    }
  }
  
  // Check if in nominations
  if (nominationStart && nominationEnd && now >= nominationStart && now <= nominationEnd) {
    return { label: 'Nominations Open', className: 'bg-gold-primary/20 text-gold-primary border-gold-primary/30' }
  }
  
  // Not started yet
  if (nominationStart && now < nominationStart) {
    return { label: 'Not Started', className: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30' }
  }
  
  // Between nominations and voting
  if (nominationEnd && votingStart && now > nominationEnd && now < votingStart) {
    return { label: 'Upcoming', className: 'bg-info/20 text-info border-info/30' }
  }

  return { label: 'Unknown', className: 'bg-text-tertiary/20 text-text-tertiary' }
}

function SortHeader({
  field,
  label,
  sort,
  onSort,
}: {
  field: EventSortField
  label: string
  sort?: EventSort
  onSort?: (sort: EventSort) => void
}) {
  const isActive = sort?.field === field
  const order = isActive ? sort?.order : null

  return (
    <button
      onClick={() => {
        if (onSort) {
          onSort({
            field,
            order: order === 'asc' ? 'desc' : 'asc',
          })
        }
      }}
      className="flex items-center gap-1 hover:text-gold-primary transition-colors"
    >
      {label}
      <span className="inline-flex flex-col">
        <ChevronUp
          className={cn(
            'h-3 w-3',
            isActive && order === 'asc' ? 'text-gold-primary' : 'text-text-tertiary/30'
          )}
        />
        <ChevronDown
          className={cn(
            'h-3 w-3 -mt-1',
            isActive && order === 'desc' ? 'text-gold-primary' : 'text-text-tertiary/30'
          )}
        />
      </span>
    </button>
  )
}

export function EventTable({
  events,
  sort,
  onSort,
  onPageChange,
  onDelete,
  onUpdate,
  isAdmin = false,
  isLoading = false,
  isUpdating = null,
}: EventTableProps) {
  const { data, page, totalPages, hasNextPage, hasPrevPage, total } = events
  const [selectedEvent, setSelectedEvent] = useState<EventListItem | null>(null)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)

  const handleQuickEdit = (event: EventListItem) => {
    setSelectedEvent(event)
    setIsQuickEditOpen(true)
  }

  const handleSaveQuickEdit = (eventId: string, formData: any) => {
    if (onUpdate) {
      onUpdate(eventId, formData)
    }
    setIsQuickEditOpen(false)
    setSelectedEvent(null)
  }

  if (isLoading) {
    return (
      <Card className="bg-purple-surface border-purple-accent/50">
        <CardContent className="p-8">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-purple-bg/50 rounded animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-purple-surface border-purple-accent/50">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-accent/20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-purple-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No events found
          </h3>
          <p className="text-text-secondary max-w-sm mx-auto">
            {isAdmin
              ? 'There are no events matching your filters. Try adjusting your search criteria.'
              : "You haven't created any events yet. Click the button below to create your first event."}
          </p>
          {!isAdmin && (
            <Button className="mt-6 bg-gold-primary hover:bg-gold-dark text-text-tertiary" asChild>
              <Link href="/organizer/events/new">Create Event</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-purple-surface border-purple-accent/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-purple-accent/30 hover:bg-transparent">
              <TableHead className="text-text-secondary">
                <SortHeader field="event_name" label="Event" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead className="text-text-secondary">
                <SortHeader field="approval_status" label="Status" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead className="text-text-secondary">Progress</TableHead>
              <TableHead className="text-text-secondary">Categories</TableHead>
              <TableHead className="text-text-secondary text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((event) => {
              const progress = getEventProgress(event)
              return (
                <TableRow
                  key={event.id}
                  className="border-purple-accent/20 hover:bg-purple-accent/10"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-purple-bg border border-purple-accent/30">
                        {event.eventImageUrl ? (
                          <Image
                            src={event.eventImageUrl}
                            alt={event.eventName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-text-tertiary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary line-clamp-1">
                          {event.eventName}
                        </p>
                        <p className="text-xs text-text-secondary">ID: {event.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium',
                        statusConfig[event.approvalStatus].className
                      )}
                    >
                      {statusConfig[event.approvalStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('font-medium', progress.className)}
                    >
                      {progress.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs bg-purple-accent/10 border-purple-accent/30 text-purple-accent">
                      {(event as any).categories || 0} {(event as any).categories === 1 ? 'Category' : 'Categories'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-48 bg-purple-surface border-purple-accent/50 p-2"
                          align="end"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start text-text-secondary hover:text-gold-primary hover:bg-gold-primary/10"
                              asChild
                            >
                              <Link href={`/organizer/events/${event.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start text-text-secondary hover:text-gold-primary hover:bg-gold-primary/10"
                              onClick={() => handleQuickEdit(event)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Quick Edit
                            </Button>

                            {event.approvalStatus === 'pending' && onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-text-secondary hover:text-error hover:bg-error/10"
                                onClick={() => onDelete(event.id, event.eventName)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(page - 1) * DEFAULT_PAGE_SIZE + 1} -{' '}
            {Math.min(page * DEFAULT_PAGE_SIZE, total)} of {total} events
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPrevPage}
              className="border-purple-accent/30 text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-text-secondary px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              className="border-purple-accent/30 text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Edit Sheet */}
      <QuickEditEventSheet
        event={selectedEvent}
        isOpen={isQuickEditOpen}
        onClose={() => {
          setIsQuickEditOpen(false)
          setSelectedEvent(null)
        }}
        onSave={handleSaveQuickEdit}
        isSaving={!!isUpdating}
      />
    </div>
  )
}
