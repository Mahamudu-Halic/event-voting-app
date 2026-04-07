'use client'

import { useFormContext } from 'react-hook-form'
import { EventFormData } from '@/lib/validations/event'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DollarSign, Percent, Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Step3Pricing() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EventFormData>()

  const amountPerVote = watch('amountPerVote') || 0
  const serviceFee = watch('serviceFee') || '10'

  const calculateFees = () => {
    const feePercentage = parseInt(serviceFee) / 100
    const serviceFeeAmount = amountPerVote * feePercentage
    const organizerReceives = amountPerVote - serviceFeeAmount

    return {
      serviceFeeAmount,
      organizerReceives,
      totalPerVote: amountPerVote,
    }
  }

  const fees = calculateFees()

  return (
    <Card className="bg-purple-surface border-purple-accent/50">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gold-primary" />
          Pricing Settings
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Set the price per vote and choose your service fee plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Per Vote */}
        <div className="space-y-2">
          <Label htmlFor="amountPerVote" className="text-text-primary">
            Amount Per Vote
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-accent" />
            <Input
              id="amountPerVote"
              type="number"
              step="0.01"
              min="0.10"
              max="1000"
              placeholder="1.00"
              className="bg-purple-bg border-purple-accent text-text-primary placeholder-text-secondary/50 focus:border-gold-primary focus:ring-gold-primary pl-10"
              {...register('amountPerVote', { valueAsNumber: true })}
            />
          </div>
          {errors.amountPerVote && (
            <p className="text-sm text-error">{errors.amountPerVote.message}</p>
          )}
          <p className="text-xs text-text-secondary">
            Minimum $0.10, maximum $1000.00 per vote
          </p>
        </div>

        {/* Service Fee Options */}
        <div className="space-y-3">
          <Label className="text-text-primary flex items-center gap-2">
            <Percent className="h-4 w-4 text-purple-accent" />
            Service Fee Plan
          </Label>
          
          <RadioGroup
            value={serviceFee}
            onValueChange={(value) => setValue('serviceFee', value as '10' | '12')}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* 10% Option */}
            <div className={cn(
              'relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all',
              serviceFee === '10'
                ? 'border-gold-primary bg-gold-primary/10'
                : 'border-purple-accent/30 bg-purple-bg/50 hover:border-purple-accent'
            )}>
              <RadioGroupItem value="10" id="fee-10" className="sr-only" />
              <Label htmlFor="fee-10" className="cursor-pointer space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">Basic Plan</span>
                  {serviceFee === '10' && (
                    <Check className="h-5 w-5 text-gold-primary" />
                  )}
                </div>
                <div className="text-2xl font-bold text-gold-primary">10%</div>
                <p className="text-sm text-text-secondary">
                  Standard service fee for platform maintenance and support
                </p>
              </Label>
            </div>

            {/* 12% Option */}
            <div className={cn(
              'relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all',
              serviceFee === '12'
                ? 'border-gold-primary bg-gold-primary/10'
                : 'border-purple-accent/30 bg-purple-bg/50 hover:border-purple-accent'
            )}>
              <RadioGroupItem value="12" id="fee-12" className="sr-only" />
              <Label htmlFor="fee-12" className="cursor-pointer space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">Premium Plan</span>
                  {serviceFee === '12' && (
                    <Check className="h-5 w-5 text-gold-primary" />
                  )}
                </div>
                <div className="text-2xl font-bold text-gold-primary">12%</div>
                <p className="text-sm text-text-secondary">
                  Priority support, enhanced analytics, and marketing features
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Price Summary */}
        {amountPerVote > 0 && (
          <div className="p-4 rounded-lg bg-purple-bg border border-purple-accent/30">
            <h4 className="font-medium text-text-primary mb-3">Price Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Amount per vote:</span>
                <span className="text-text-primary">${amountPerVote.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Service fee ({serviceFee}%):</span>
                <span className="text-error">-${fees.serviceFeeAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-purple-accent/30 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-text-primary">You receive:</span>
                  <span className="text-success">${fees.organizerReceives.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="flex gap-3 p-4 rounded-lg bg-purple-accent/10 border border-purple-accent/30">
          <Info className="h-5 w-5 text-purple-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">How pricing works</p>
            <p className="text-sm text-text-secondary">
              When a user pays ${amountPerVote.toFixed(2) || 'X.XX'} for a vote, 
              you receive ${fees.organizerReceives.toFixed(2) || 'Y.YY'} and we retain 
              ${fees.serviceFeeAmount.toFixed(2) || 'Z.ZZ'} as a service fee. 
              Funds are transferred to your account weekly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
