'use client'

import Image from 'next/image'
import { format } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Percent,
  Vote,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type EventListItem } from '@/lib/validations/event'

interface EventDetailsSheetProps {
  event: EventListItem | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (eventId: string, eventName: string) => void
  onReject?: (eventId: string, eventName: string) => void
}

const statusConfig = {
  pending: {
    label: 'Pending Approval',
    className: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  },
}

export function EventDetailsSheet({
  event,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: EventDetailsSheetProps) {
  if (!event) return null

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set'
    return format(new Date(date), 'MMM d, yyyy')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-purple-surface border-purple-accent/50 overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b border-purple-accent/30">
            <div>
              <SheetTitle className="text-xl font-bold text-text-primary">
                Event Details
              </SheetTitle>
              <p className="text-text-secondary text-sm mt-1">
                ID: {event.id.slice(0, 8)}
              </p>
            </div>
            
          {/* Approval Status Badge */}
          <Badge
            variant="outline"
            className={cn('font-medium w-fit', statusConfig[event.approvalStatus].className)}
          >
            {statusConfig[event.approvalStatus].label}
          </Badge>

          {/* Action Buttons for Pending Events */}
          {event.approvalStatus === 'pending' && (onApprove || onReject) && (
            <div className="flex gap-2">
              {onApprove && (
                <Button
                  variant="outline"
                  className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={() => onApprove(event.id, event.eventName)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  variant="outline"
                  className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  onClick={() => onReject(event.id, event.eventName)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Event Image */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-purple-accent" />
              <h3 className="text-sm font-medium text-text-primary">Event Image</h3>
            </div>
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-purple-bg border border-purple-accent/30">
              {event.eventImageUrl ? (
                <Image
                  src={event.eventImageUrl}
                  alt={event.eventName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-text-tertiary" />
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-purple-accent/30" />

          {/* Event Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-accent" />
              <h3 className="text-sm font-medium text-text-primary">Event Name</h3>
            </div>
            <p className="text-lg font-semibold text-text-primary">{event.eventName}</p>
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-accent" />
              <h3 className="text-sm font-medium text-text-primary">Description</h3>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              {event.eventDescription || 'No description provided'}
            </p>
          </div>

          <Separator className="bg-purple-accent/30" />

          {/* Tools Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Vote className="h-4 w-4 text-purple-accent" />
              Event Tools
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-purple-bg/50 border border-purple-accent/20">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="h-4 w-4 text-gold-primary" />
                  <span className="text-sm font-medium text-text-primary">Nominations</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    event.enableNominations
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  )}
                >
                  {event.enableNominations ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-purple-bg/50 border border-purple-accent/20">
                <div className="flex items-center gap-2 mb-1">
                  <Vote className="h-4 w-4 text-gold-primary" />
                  <span className="text-sm font-medium text-text-primary">Voting</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    event.enableVoting
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  )}
                >
                  {event.enableVoting ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-purple-accent/30" />

          {/* Pricing Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-accent" />
              Pricing Details
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-purple-bg/50 border border-purple-accent/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Amount Per Vote</span>
                  <span className="text-lg font-semibold text-text-primary">
                    {formatCurrency(event.amountPerVote)}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-bg/50 border border-purple-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-text-secondary" />
                    <span className="text-sm text-text-secondary">Service Fee</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {event.serviceFee}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-purple-accent/30" />

          {/* Timeline Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-accent" />
              Timeline
            </h3>
            <div className="space-y-2">
              {event.nominationStartDate && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-bg/30">
                  <span className="text-sm text-text-secondary">Nominations Start</span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(event.nominationStartDate)}
                  </span>
                </div>
              )}
              {event.nominationEndDate && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-bg/30">
                  <span className="text-sm text-text-secondary">Nominations End</span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(event.nominationEndDate)}
                  </span>
                </div>
              )}
              {event.votingStartDate && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-bg/30">
                  <span className="text-sm text-text-secondary">Voting Starts</span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(event.votingStartDate)}
                  </span>
                </div>
              )}
              {event.votingEndDate && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-bg/30">
                  <span className="text-sm text-text-secondary">Voting Ends</span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(event.votingEndDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
