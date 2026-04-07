'use client'

import { useFormContext } from 'react-hook-form'
import { EventFormData } from '@/lib/validations/event'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/forms/image-upload'
import { Calendar, Type, FileImage } from 'lucide-react'

export function Step1BasicInfo() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<EventFormData>()

  const eventImage = watch('eventImage')

  return (
    <Card className="bg-purple-surface border-purple-accent/50">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gold-primary" />
          Basic Information
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Enter the details about your event. This information will be displayed to voters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor="eventName" className="text-text-primary flex items-center gap-2">
            <Type className="h-4 w-4 text-purple-accent" />
            Event Name
          </Label>
          <Input
            id="eventName"
            placeholder="e.g., Annual Awards Night 2024"
            className="bg-purple-bg border-purple-accent text-text-primary placeholder-text-secondary/50 focus:border-gold-primary focus:ring-gold-primary"
            {...register('eventName')}
          />
          {errors.eventName && (
            <p className="text-sm text-error">{errors.eventName.message}</p>
          )}
        </div>

        {/* Event Description */}
        <div className="space-y-2">
          <Label htmlFor="eventDescription" className="text-text-primary">
            Event Description
          </Label>
          <Textarea
            id="eventDescription"
            placeholder="Describe your event, what it's about, and what voters can expect..."
            rows={4}
            className="bg-purple-bg border-purple-accent text-text-primary placeholder-text-secondary/50 focus:border-gold-primary focus:ring-gold-primary resize-none"
            {...register('eventDescription')}
          />
          <p className="text-xs text-text-secondary">
            {watch('eventDescription')?.length || 0}/500 characters
          </p>
          {errors.eventDescription && (
            <p className="text-sm text-error">{errors.eventDescription.message}</p>
          )}
        </div>

        {/* Event Image */}
        <div className="space-y-2">
          <Label className="text-text-primary flex items-center gap-2">
            <FileImage className="h-4 w-4 text-purple-accent" />
            Event Image
          </Label>
          <ImageUpload
            value={eventImage}
            onChange={(file) => setValue('eventImage', file, { shouldValidate: true })}
            error={errors.eventImage?.message}
          />
          <p className="text-xs text-text-secondary">
            Upload an eye-catching image for your event. Recommended size: 1200x630 pixels.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
