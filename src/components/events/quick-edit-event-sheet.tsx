'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Upload, X, Loader2, Sparkles, Calendar, FileText, Image as ImageIcon, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
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
      votingStartDate: event?.votingStartDate ? new Date(event.votingStartDate) : undefined,
      votingEndDate: event?.votingEndDate ? new Date(event.votingEndDate) : undefined,
    },
  })

  // Watch date values for the calendar popovers
  const votingStartDate = watch('votingStartDate')
  const votingEndDate = watch('votingEndDate')

  // Reset form when event changes (only when event.id changes)
  useEffect(() => {
    if (event && isOpen) {
      reset({
        eventName: event.eventName,
        eventDescription: event.eventDescription || '',
        eventImage: event.eventImageUrl,
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
      <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-violet-950 via-purple-950 to-purple-900 border-violet-500/30 overflow-y-auto">
        <SheetHeader className="space-y-3 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="text-2xl font-bold text-white">Quick Edit Event</SheetTitle>
          </div>
          <SheetDescription className="text-purple-200/70 text-base">
            Make quick changes to your event details and voting schedule.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">
          {/* Event Image */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-violet-400" />
              <Label className="text-white font-medium">Event Image</Label>
            </div>
            <div className="relative">
              {displayImage ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-48 rounded-2xl overflow-hidden ring-2 ring-violet-500/30"
                >
                  <Image
                    src={displayImage}
                    alt="Event preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-3 right-3 p-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-xl transition-all shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="absolute bottom-3 left-3 text-white/90 text-sm font-medium">
                    Current event image
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 rounded-2xl border-2 border-dashed border-violet-500/40 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400/60 hover:bg-white/10 transition-all group"
                >
                  <div className="p-4 rounded-2xl bg-violet-500/20 mb-3 group-hover:bg-violet-500/30 transition-colors">
                    <Upload className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-white font-medium">Click to upload image</p>
                  <p className="text-sm text-white/50 mt-1">Recommended: 1200 x 600px</p>
                </motion.div>
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-400" />
              <Label htmlFor="eventName" className="text-white font-medium">
                Event Name
              </Label>
            </div>
            <Input
              id="eventName"
              {...register('eventName')}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
            />
            {errors.eventName && (
              <p className="text-sm text-rose-400 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.eventName.message}
              </p>
            )}
          </div>

          {/* Event Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-400" />
              <Label htmlFor="eventDescription" className="text-white font-medium">
                Description
              </Label>
            </div>
            <Textarea
              id="eventDescription"
              {...register('eventDescription')}
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20 transition-all resize-none"
            />
            {errors.eventDescription && (
              <p className="text-sm text-rose-400 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.eventDescription.message}
              </p>
            )}
          </div>

          {/* Voting Dates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-400" />
              <Label className="text-white font-medium">Voting Period</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-purple-200/70 text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-11 justify-start text-left font-normal rounded-xl',
                        'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-white',
                        !votingStartDate && 'text-white/40'
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-violet-500/20 mr-2">
                        <CalendarIcon className="h-4 w-4 text-violet-400" />
                      </div>
                      {votingStartDate ? (
                        <span className="font-medium">{format(votingStartDate, 'MMM d, yyyy')}</span>
                      ) : (
                        <span>Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={votingStartDate}
                      onSelect={(date) => setValue('votingStartDate', date)}
                      initialFocus
                      className="bg-transparent text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200/70 text-sm">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-11 justify-start text-left font-normal rounded-xl',
                        'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-white',
                        !votingEndDate && 'text-white/40'
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-violet-500/20 mr-2">
                        <CalendarIcon className="h-4 w-4 text-violet-400" />
                      </div>
                      {votingEndDate ? (
                        <span className="font-medium">{format(votingEndDate, 'MMM d, yyyy')}</span>
                      ) : (
                        <span>Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={votingEndDate}
                      onSelect={(date) => setValue('votingEndDate', date)}
                      initialFocus
                      className="bg-transparent text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 border-white/20 text-black hover:bg-white/10 hover:text-white rounded-xl transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-500/25 transition-all"
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
