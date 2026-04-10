'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  type EventListItem,
  type EventSort,
  type EventSortField,
  type PaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/validations/event'
import { EventDetailsSheet } from './event-details-sheet'

interface AdminEventTableProps {
  events: PaginatedResult<EventListItem>
  sort?: EventSort
  onSort?: (sort: EventSort) => void
  onPageChange: (page: number) => void
  onApprove?: (eventId: string, eventName: string) => void
  onReject?: (eventId: string, eventName: string, reason?: string) => void
  isLoading?: boolean
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
      className="flex items-center gap-1 hover:text-gold-primary transition-colors font-medium"
    >
      {label}
    </button>
  )
}

export function AdminEventTable({
  events,
  sort,
  onSort,
  onPageChange,
  onApprove,
  onReject,
  isLoading = false,
}: AdminEventTableProps) {
  const { data, page, totalPages, hasNextPage, hasPrevPage, total } = events

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'approve' | 'reject' | null
    event: EventListItem | null
    reason: string
  }>({
    isOpen: false,
    type: null,
    event: null,
    reason: '',
  })

  // Details sheet state
  const [selectedEvent, setSelectedEvent] = useState<EventListItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const openConfirmDialog = (event: EventListItem, type: 'approve' | 'reject') => {
    setConfirmDialog({
      isOpen: true,
      type,
      event,
      reason: '',
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      event: null,
      reason: '',
    })
  }

  const handleConfirmAction = () => {
    if (!confirmDialog.event || !confirmDialog.type) return

    if (confirmDialog.type === 'approve' && onApprove) {
      onApprove(confirmDialog.event.id, confirmDialog.event.eventName)
    } else if (confirmDialog.type === 'reject' && onReject) {
      onReject(confirmDialog.event.id, confirmDialog.event.eventName, confirmDialog.reason)
    }

    closeConfirmDialog()
  }

  const openDetails = (event: EventListItem) => {
    setSelectedEvent(event)
    setIsDetailsOpen(true)
  }

  const closeDetails = () => {
    setIsDetailsOpen(false)
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
            There are no events matching your filters. Try adjusting your search criteria.
          </p>
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
                <SortHeader field="approval_status" label="Approval Status" sort={sort} onSort={onSort} />
              </TableHead>
              <TableHead className="text-text-secondary">Progress</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve/Reject buttons for pending events */}
                      {event.approvalStatus === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-success/30 text-success hover:bg-success/10 hover:text-success"
                            onClick={() => openConfirmDialog(event, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-error/30 text-error hover:bg-error/10 hover:text-error"
                            onClick={() => openConfirmDialog(event, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* View details button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-text-secondary hover:text-gold-primary hover:bg-gold-primary/10"
                        onClick={() => openDetails(event)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
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

      {/* Approval/Rejection Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <DialogContent className="bg-purple-surface border-purple-accent/50 text-text-primary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Approve Event
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-error" />
                  Reject Event
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Are you sure you want to {confirmDialog.type} <strong className="text-text-primary">{confirmDialog.event?.eventName}</strong>?
              {confirmDialog.type === 'approve'
                ? ' This will make the event visible to the public.'
                : ' Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          {confirmDialog.type === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Rejection Reason
              </label>
              <textarea
                value={confirmDialog.reason}
                onChange={(e) => setConfirmDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for rejection..."
                className="w-full min-h-[80px] p-3 rounded-md bg-purple-bg/50 border border-purple-accent/30 text-text-primary placeholder:text-text-secondary/50 focus:border-gold-primary focus:outline-none resize-none"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              className="border-purple-accent/30 text-text-secondary hover:bg-purple-accent/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={cn(
                'text-text-tertiary',
                confirmDialog.type === 'approve'
                  ? 'bg-success hover:bg-success/90'
                  : 'bg-error hover:bg-error/90'
              )}
              disabled={confirmDialog.type === 'reject' && !confirmDialog.reason.trim()}
            >
              {confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Sheet */}
      <EventDetailsSheet
        event={selectedEvent}
        isOpen={isDetailsOpen}
        onClose={closeDetails}
        onApprove={onApprove ? (id, name) => {
          closeDetails()
          openConfirmDialog({ id, eventName: name } as EventListItem, 'approve')
        } : undefined}
        onReject={onReject ? (id, name) => {
          closeDetails()
          openConfirmDialog({ id, eventName: name } as EventListItem, 'reject')
        } : undefined}
      />
    </div>
  )
}
