'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Upload, X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { EventListItem } from '@/lib/validations/event'
import { uploadEventImage } from '@/apis/events'
import { toast } from 'sonner'

const quickEditSchema = z.object({
  eventName: z.string().min(2, 'Event name must be at least 2 characters'),
  eventDescription: z.string().min(10, 'Description must be at least 10 characters'),
  eventImage: z.union([
    z.instanceof(File),
    z.string(),
    z.null(),
  ]).optional(),
  nominationStartDate: z.date().optional(),
  nominationEndDate: z.date().optional(),
  votingStartDate: z.date().optional(),
  votingEndDate: z.date().optional(),
})

type QuickEditFormData = z.infer<typeof quickEditSchema>

interface QuickEditEventSheetProps {
  event: EventListItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (eventId: string, data: QuickEditFormData & { eventImageUrl?: string | null }) => void
  isSaving?: boolean
}

export function QuickEditEventSheet({
  event,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: QuickEditEventSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: {
      eventName: event?.eventName || '',
      eventDescription: event?.eventDescription || '',
      eventImage: event?.eventImageUrl || null,
      nominationStartDate: event?.nominationStartDate ? new Date(event.nominationStartDate) : undefined,
      nominationEndDate: event?.nominationEndDate ? new Date(event.nominationEndDate) : undefined,
      votingStartDate: event?.votingStartDate ? new Date(event.votingStartDate) : undefined,
      votingEndDate: event?.votingEndDate ? new Date(event.votingEndDate) : undefined,
    },
  })

  // Watch date values for the calendar popovers
  const nominationStartDate = watch('nominationStartDate')
  const nominationEndDate = watch('nominationEndDate')
  const votingStartDate = watch('votingStartDate')
  const votingEndDate = watch('votingEndDate')

  // Reset form when event changes (only when event.id changes)
  useEffect(() => {
    if (event && isOpen) {
      reset({
        eventName: event.eventName,
        eventDescription: event.eventDescription || '',
        eventImage: event.eventImageUrl,
        nominationStartDate: event.nominationStartDate ? new Date(event.nominationStartDate) : new Date(),
        nominationEndDate: event.nominationEndDate ? new Date(event.nominationEndDate) : new Date(),
        votingStartDate: event.votingStartDate ? new Date(event.votingStartDate) : new Date(),
        votingEndDate: event.votingEndDate ? new Date(event.votingEndDate) : new Date(),
      })
      setPreviewUrl(event.eventImageUrl)
    }
  }, [event?.id, isOpen, reset])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    setValue('eventImage', file)
  }

  const clearImage = () => {
    setPreviewUrl(null)
    setValue('eventImage', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: QuickEditFormData) => {
    if (!event) return

    let imageUrl: string | null = null
    
    // Upload new image if it's a File
    if (data.eventImage instanceof File) {
      setIsUploading(true)
      try {
        imageUrl = await uploadEventImage(data.eventImage)
      } catch (error) {
        toast.error('Failed to upload image')
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    } else if (typeof data.eventImage === 'string') {
      imageUrl = data.eventImage
    }

    onSave(event.id, { ...data, eventImageUrl: imageUrl })
  }

  const watchedImage = watch('eventImage')
  const displayImage = previewUrl || (typeof watchedImage === 'string' ? watchedImage : null) as string | null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-purple-surface border-purple-accent/50 overflow-y-auto">
        <SheetHeader className="space-y-2.5 pb-4">
          <SheetTitle className="text-text-primary">Quick Edit Event</SheetTitle>
          <SheetDescription className="text-text-secondary">
            Make quick changes to your event details.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
          {/* Event Image */}
          <div className="space-y-2">
            <Label className="text-text-primary">Event Image</Label>
            <div className="relative">
              {displayImage ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden">
                  <Image
                    src={displayImage}
                    alt="Event preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1 bg-error/80 hover:bg-error text-text-tertiary rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 rounded-lg border-2 border-dashed border-purple-accent/30 bg-purple-bg flex flex-col items-center justify-center cursor-pointer hover:border-purple-accent/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-text-secondary mb-2" />
                  <p className="text-sm text-text-secondary">Click to upload image</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName" className="text-text-primary">
              Event Name
            </Label>
            <Input
              id="eventName"
              {...register('eventName')}
              className="bg-purple-bg border-purple-accent/30 text-text-primary"
            />
            {errors.eventName && (
              <p className="text-sm text-error">{errors.eventName.message}</p>
            )}
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <Label htmlFor="eventDescription" className="text-text-primary">
              Description
            </Label>
            <Textarea
              id="eventDescription"
              {...register('eventDescription')}
              rows={3}
              className="bg-purple-bg border-purple-accent/30 text-text-primary resize-none"
            />
            {errors.eventDescription && (
              <p className="text-sm text-error">{errors.eventDescription.message}</p>
            )}
          </div>

          {/* Nomination Dates */}
          <div className="space-y-4">
            <Label className="text-text-primary font-medium">Nomination Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-purple-bg border-purple-accent/30',
                        !nominationStartDate && 'text-text-secondary'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nominationStartDate ? (
                        format(nominationStartDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={nominationStartDate}
                      onSelect={(date) => setValue('nominationStartDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-text-secondary text-sm">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-purple-bg border-purple-accent/30',
                        !nominationEndDate && 'text-text-secondary'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nominationEndDate ? (
                        format(nominationEndDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={nominationEndDate}
                      onSelect={(date) => setValue('nominationEndDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Voting Dates */}
          <div className="space-y-4">
            <Label className="text-text-primary font-medium">Voting Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-text-secondary text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-purple-bg border-purple-accent/30',
                        !votingStartDate && 'text-text-secondary'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {votingStartDate ? (
                        format(votingStartDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={votingStartDate}
                      onSelect={(date) => setValue('votingStartDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-text-secondary text-sm">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-purple-bg border-purple-accent/30',
                        !votingEndDate && 'text-text-secondary'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {votingEndDate ? (
                        format(votingEndDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={votingEndDate}
                      onSelect={(date) => setValue('votingEndDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-purple-accent/30 text-text-primary hover:bg-purple-accent/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gold-primary hover:bg-gold-dark text-text-tertiary"
              disabled={isSaving || isUploading}
            >
              {isSaving || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
