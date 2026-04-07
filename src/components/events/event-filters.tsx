'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Filter, X, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { type EventFilters, type EventApprovalStatus } from '@/lib/validations/event'

interface EventFiltersProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  isAdmin?: boolean
}

const statusOptions: { value: EventApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function EventFilters({ filters, onFiltersChange, isAdmin = false }: EventFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters)
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(localFilters)
    }, 300)

    return () => clearTimeout(timer)
  }, [localFilters.search])

  const handleStatusChange = useCallback((value: string) => {
    const newFilters = {
      ...localFilters,
      status: value as EventApprovalStatus | 'all',
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }, [localFilters, onFiltersChange])

  const handleDateFromChange = useCallback((date: Date | undefined) => {
    const newFilters = {
      ...localFilters,
      dateFrom: date ? format(date, 'yyyy-MM-dd') : undefined,
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    setDateFromOpen(false)
  }, [localFilters, onFiltersChange])

  const handleDateToChange = useCallback((date: Date | undefined) => {
    const newFilters = {
      ...localFilters,
      dateTo: date ? format(date, 'yyyy-MM-dd') : undefined,
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    setDateToOpen(false)
  }, [localFilters, onFiltersChange])

  const clearFilters = useCallback(() => {
    const cleared: EventFilters = {}
    setLocalFilters(cleared)
    onFiltersChange(cleared)
  }, [onFiltersChange])

  const hasActiveFilters =
    localFilters.search ||
    (localFilters.status && localFilters.status !== 'all') ||
    localFilters.dateFrom ||
    localFilters.dateTo

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <Input
          placeholder="Search events..."
          value={localFilters.search || ''}
          onChange={(e) =>
            setLocalFilters({ ...localFilters, search: e.target.value })
          }
          className="pl-10 bg-purple-bg border-purple-accent/30 text-text-primary placeholder:text-text-secondary"
        />
        {localFilters.search && (
          <button
            onClick={() => {
              const newFilters = { ...localFilters, search: undefined }
              setLocalFilters(newFilters)
              onFiltersChange(newFilters)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status Filter */}
        <Select
          value={localFilters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[140px] bg-purple-bg border-purple-accent/30 text-text-primary">
            <Filter className="h-4 w-4 mr-2 text-text-secondary" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-purple-surface border-purple-accent/30">
            {statusOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-text-primary focus:bg-purple-accent/20 focus:text-text-primary"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                'bg-purple-bg border-purple-accent/30 text-text-primary',
                !localFilters.dateFrom && 'text-text-secondary'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {localFilters.dateFrom ? (
                format(new Date(localFilters.dateFrom), 'MMM d, yyyy')
              ) : (
                <span>From Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-purple-surface border-purple-accent/30" align="start">
            <CalendarComponent
              mode="single"
              selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
              onSelect={handleDateFromChange}
              initialFocus
              className="bg-purple-surface"
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                'bg-purple-bg border-purple-accent/30 text-text-primary',
                !localFilters.dateTo && 'text-text-secondary'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {localFilters.dateTo ? (
                format(new Date(localFilters.dateTo), 'MMM d, yyyy')
              ) : (
                <span>To Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-purple-surface border-purple-accent/30" align="start">
            <CalendarComponent
              mode="single"
              selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
              onSelect={handleDateToChange}
              initialFocus
              className="bg-purple-surface"
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
