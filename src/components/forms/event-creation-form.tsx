'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventFormSchema, EventFormData, steps } from '@/lib/validations/event'
import { createEvent } from '@/apis/events'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Step1BasicInfo } from './event-steps/step1-basic-info'
import { Step2EventTools } from './event-steps/step2-event-tools'
import { Step3Pricing } from './event-steps/step3-pricing'
import { Step4Review } from './event-steps/step4-review'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Loader2,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

const STORAGE_KEY = 'event-creation-form'

export function EventCreationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: '',
      eventDescription: '',
      eventImage: null,
      enableNominations: false,
      enableVoting: true,
      amountPerVote: 1.00,
      serviceFee: '10',
    },
    mode: 'onChange',
  })

  const { trigger, formState: { errors }, watch, setValue } = methods

  // Load saved data from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Restore form data (note: File objects can't be serialized, so image will need re-upload)
        Object.keys(parsed.data || {}).forEach((key) => {
          if (key !== 'eventImage') { // Skip image as it can't be serialized
            setValue(key as keyof EventFormData, parsed.data[key])
          }
        })
        if (parsed.step) {
          setCurrentStep(parsed.step)
        }
        toast.info('Previous session restored', {
          description: 'Your progress has been loaded from your last session.',
        })
      } catch (error) {
        console.error('Failed to restore session:', error)
      }
    }
  }, [setValue])

  // Save to sessionStorage whenever form data changes
  useEffect(() => {
    const subscription = watch((data) => {
      const dataToSave = {
        data,
        step: currentStep,
        timestamp: new Date().toISOString(),
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    })
    return () => subscription.unsubscribe()
  }, [watch, currentStep])

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(['eventName', 'eventDescription', 'eventImage'])
      case 2:
        return await trigger(['enableNominations', 'enableVoting'])
      case 3:
        return await trigger(['amountPerVote', 'serviceFee'])
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (!isValid) {
      toast.error('Please fix the errors before proceeding')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleEditStep = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const formData = methods.getValues()
      
      // Get the image file if it's a File object
      const imageFile = formData.eventImage instanceof File ? formData.eventImage : null
      
      // Call the API to create the event
      const createdEvent = await createEvent(formData, imageFile)
      
      
      // Clear session storage
      sessionStorage.removeItem(STORAGE_KEY)
      
      toast.success('Event created successfully!', {
        description: 'Your event has been submitted for admin approval.',
      })
      
      // Redirect to events page
      router.push('/events')
      router.refresh()
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />
      case 2:
        return <Step2EventTools />
      case 3:
        return <Step3Pricing />
      case 4:
        return <Step4Review onEditStep={handleEditStep} />
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-3xl mx-auto">
        {/* Stepper */}
        <Card className="bg-purple-surface border-purple-accent/50 p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (step.id < currentStep) {
                        handleEditStep(step.id)
                      }
                    }}
                    disabled={step.id > currentStep}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200',
                      currentStep === step.id
                        ? 'bg-gold-primary text-text-tertiary ring-4 ring-gold-primary/20'
                        : currentStep > step.id
                        ? 'bg-success text-text-tertiary cursor-pointer hover:ring-2 hover:ring-success/50'
                        : 'bg-purple-bg text-text-secondary border border-purple-accent/50'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      'text-sm font-medium',
                      currentStep === step.id ? 'text-text-primary' : 'text-text-secondary'
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-text-secondary/70 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors duration-300',
                    currentStep > step.id ? 'bg-success' : 'bg-purple-accent/30'
                  )} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Form Content */}
        <div className="mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
            className="border-purple-accent text-text-primary bg-transparent hover:bg-purple-accent/20 disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-success text-text-tertiary hover:bg-success disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          )}
        </div>

        {/* Session Storage Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-secondary/70 flex items-center justify-center gap-1">
            <Save className="h-3 w-3" />
            Your progress is automatically saved and will be restored if you refresh the page
          </p>
        </div>
      </div>
    </FormProvider>
  )
}
