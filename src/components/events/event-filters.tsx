'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, X, Calendar } from 'lucide-react'
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

const statusOptions: { value: EventApprovalStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Status', color: 'bg-violet-500' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
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

  const getSelectedStatusColor = () => {
    const selected = statusOptions.find(opt => opt.value === (localFilters.status || 'all'))
    return selected?.color || 'bg-violet-500'
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-violet-500/20">
          <Search className="h-4 w-4 text-violet-400" />
        </div>
        <Input
          placeholder="Search events by name..."
          value={localFilters.search || ''}
          onChange={(e) =>
            setLocalFilters({ ...localFilters, search: e.target.value })
          }
          className="pl-14 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
        />
        {localFilters.search && (
          <button
            onClick={() => {
              const newFilters = { ...localFilters, search: undefined }
              setLocalFilters(newFilters)
              onFiltersChange(newFilters)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        <Select
          value={localFilters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[160px] h-11 bg-white/5 border-white/10 hover:border-white/20 text-white rounded-xl transition-all">
              <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl">
            {statusOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white/90 focus:bg-violet-500/20 focus:text-white rounded-lg mx-1 my-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${option.color}`} />
                  {option.label}
                </div>
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
                'w-[160px] h-11 justify-start text-left font-normal rounded-xl',
                'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-white',
                !localFilters.dateFrom && 'text-white/40'
              )}
            >
              <div className="p-1.5 rounded-lg bg-violet-500/20 mr-2">
                <Calendar className="h-4 w-4 text-violet-400" />
              </div>
              {localFilters.dateFrom ? (
                <span className="font-medium">{format(new Date(localFilters.dateFrom), 'MMM d, yyyy')}</span>
              ) : (
                <span>From Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl" align="start">
            <CalendarComponent
              mode="single"
              selected={localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined}
              onSelect={handleDateFromChange}
              initialFocus
              className="bg-transparent text-white"
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] h-11 justify-start text-left font-normal rounded-xl',
                'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-white',
                !localFilters.dateTo && 'text-white/40'
              )}
            >
              <div className="p-1.5 rounded-lg bg-violet-500/20 mr-2">
                <Calendar className="h-4 w-4 text-violet-400" />
              </div>
              {localFilters.dateTo ? (
                <span className="font-medium">{format(new Date(localFilters.dateTo), 'MMM d, yyyy')}</span>
              ) : (
                <span>To Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl" align="start">
            <CalendarComponent
              mode="single"
              selected={localFilters.dateTo ? new Date(localFilters.dateTo) : undefined}
              onSelect={handleDateToChange}
              initialFocus
              className="bg-transparent text-white"
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-11 px-4 text-white/60 hover:text-white hover:bg-rose-500/20 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}
