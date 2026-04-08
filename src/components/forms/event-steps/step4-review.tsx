'use client'

import { useFormContext } from 'react-hook-form'
import { EventFormData } from '@/lib/validations/event'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Check, 
  Edit2, 
  Calendar, 
  Settings, 
  Coins, 
  Trophy,
  Users
} from 'lucide-react'
import Image from 'next/image'

interface Step4ReviewProps {
  onEditStep: (step: number) => void
}

export function Step4Review({ onEditStep }: Step4ReviewProps) {
  const { watch } = useFormContext<EventFormData>()

  const formData = watch()

  const calculateFees = () => {
    const feePercentage = parseInt(formData.serviceFee || '10') / 100
    const serviceFeeAmount = (formData.amountPerVote || 0) * feePercentage
    const organizerReceives = (formData.amountPerVote || 0) - serviceFeeAmount

    return {
      serviceFeeAmount,
      organizerReceives,
    }
  }

  const fees = calculateFees()

  const ReviewSection = ({ 
    step, 
    title, 
    icon: Icon, 
    children 
  }: { 
    step: number
    title: string
    icon: React.ElementType
    children: React.ReactNode 
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-primary/20 flex items-center justify-center">
            <Icon className="h-4 w-4 text-gold-primary" />
          </div>
          <h3 className="font-semibold text-text-primary">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditStep(step)}
          className="text-purple-accent hover:text-gold-primary hover:bg-purple-accent/20"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>
      <div className="pl-10">
        {children}
      </div>
    </div>
  )

  return (
    <Card className="bg-purple-surface border-purple-accent/50">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Check className="h-5 w-5 text-gold-primary" />
          Review Your Event
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Please review all the details before creating your event. You can edit any section by clicking the edit button.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Basic Info */}
        <ReviewSection step={1} title="Basic Information" icon={Calendar}>
          <div className="space-y-3 p-4 rounded-lg bg-purple-bg/50 border border-purple-accent/20">
            <div>
              <span className="text-xs text-text-secondary uppercase tracking-wider">Event Name</span>
              <p className="text-text-primary font-medium">{formData.eventName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-xs text-text-secondary uppercase tracking-wider">Description</span>
              <p className="text-text-primary text-sm leading-relaxed">{formData.eventDescription || 'Not provided'}</p>
            </div>
            {formData.eventImage && (
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider">Event Image</span>
                <div className="mt-2 relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-purple-accent">
                  {typeof formData.eventImage === 'string' ? (
                    <Image 
                      src={formData.eventImage} 
                      alt="Event" 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <Image 
                      src={URL.createObjectURL(formData.eventImage)} 
                      alt="Event" 
                      fill 
                      className="object-cover" 
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </ReviewSection>

        <Separator className="bg-purple-accent/30" />

        {/* Step 2: Event Tools */}
        <ReviewSection step={2} title="Event Tools" icon={Settings}>
          <div className="flex flex-wrap gap-3">
            <Badge 
              variant={formData.enableNominations ? 'default' : 'outline'}
              className={formData.enableNominations 
                ? 'bg-success text-text-tertiary' 
                : 'border-purple-accent text-text-secondary'
              }
            >
              <Users className="h-3 w-3 mr-1" />
              Nominations {formData.enableNominations ? 'Enabled' : 'Disabled'}
            </Badge>
            <Badge 
              variant={formData.enableVoting ? 'default' : 'outline'}
              className={formData.enableVoting 
                ? 'bg-success text-text-tertiary' 
                : 'border-purple-accent text-text-secondary'
              }
            >
              <Trophy className="h-3 w-3 mr-1" />
              Voting {formData.enableVoting ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </ReviewSection>

        <Separator className="bg-purple-accent/30" />

        {/* Step 3: Pricing */}
        <ReviewSection step={3} title="Pricing" icon={Coins}>
          <div className="space-y-3 p-4 rounded-lg bg-purple-bg/50 border border-purple-accent/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider">Amount Per Vote</span>
                <p className="text-text-primary font-medium text-lg">
                  ₵{(formData.amountPerVote || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider">Service Fee</span>
                <p className="text-text-primary font-medium text-lg">
                  {formData.serviceFee || 10}%
                </p>
              </div>
            </div>
            <Separator className="bg-purple-accent/20" />
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Service fee per vote:</span>
              <span className="text-error">-₵{fees.serviceFeeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-semibold">
              <span className="text-text-primary">You receive per vote:</span>
              <span className="text-success text-lg">₵{fees.organizerReceives.toFixed(2)}</span>
            </div>
          </div>
        </ReviewSection>
      </CardContent>
    </Card>
  )
}
