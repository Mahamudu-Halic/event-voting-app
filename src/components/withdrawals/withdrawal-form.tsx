"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Smartphone, Building2, ArrowRight } from "lucide-react"
import { createWithdrawal, type PaymentMethod } from "@/apis/withdrawals"

interface WithdrawalFormProps {
  maxAmount: number
  onSuccess: () => void
  onCancel: () => void
}

const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY === "GHS" ? "₵" : "₦"
const MIN_WITHDRAWAL = 10

export function WithdrawalForm({ maxAmount, onSuccess, onCancel }: WithdrawalFormProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)

    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ${CURRENCY_SYMBOL}${MIN_WITHDRAWAL.toFixed(2)}`)
      return
    }

    if (numAmount > maxAmount) {
      setError(`Amount exceeds available balance of ${CURRENCY_SYMBOL}${maxAmount.toFixed(2)}`)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createWithdrawal({
        amount: numAmount,
        paymentMethod,
        phoneNumber: paymentMethod === "mobile_money" ? phoneNumber : undefined,
        accountName: paymentMethod === "bank_transfer" ? accountName : undefined,
        accountNumber: paymentMethod === "bank_transfer" ? accountNumber : undefined,
        bankName: paymentMethod === "bank_transfer" ? bankName : undefined,
      })

      if (result.success) {
        onSuccess()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create withdrawal")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-purple-surface border-purple-accent/30">
      <CardHeader>
        <CardTitle className="text-text-primary text-lg">Request Withdrawal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-text-primary">
              Amount ({CURRENCY_SYMBOL})
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                {CURRENCY_SYMBOL}
              </span>
              <Input
                id="amount"
                type="number"
                min={MIN_WITHDRAWAL}
                max={maxAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-purple-bg border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-text-secondary">
              Available: {CURRENCY_SYMBOL}{maxAmount.toFixed(2)} | Min: {CURRENCY_SYMBOL}{MIN_WITHDRAWAL.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-text-primary">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="mobile_money"
                  id="mobile_money"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="mobile_money"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-purple-accent/30 bg-purple-bg p-4 hover:bg-purple-accent/10 peer-data-[state=checked]:border-gold-primary peer-data-[state=checked]:bg-gold-primary/10 cursor-pointer"
                >
                  <Smartphone className="mb-2 h-6 w-6 text-gold-primary" />
                  <span className="text-sm font-medium text-text-primary">Mobile Money</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="bank_transfer"
                  id="bank_transfer"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="bank_transfer"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-purple-accent/30 bg-purple-bg p-4 hover:bg-purple-accent/10 peer-data-[state=checked]:border-gold-primary peer-data-[state=checked]:bg-gold-primary/10 cursor-pointer"
                >
                  <Building2 className="mb-2 h-6 w-6 text-gold-primary" />
                  <span className="text-sm font-medium text-text-primary">Bank Transfer</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mobile Money Details */}
          {paymentMethod === "mobile_money" && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-text-primary">
                Mobile Money Number <span className="text-error">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-purple-bg border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                placeholder="e.g., 0241234567"
                required
              />
            </div>
          )}

          {/* Bank Transfer Details */}
          {paymentMethod === "bank_transfer" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-text-primary">
                  Account Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="accountName"
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="bg-purple-bg border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                  placeholder="Full name on account"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-text-primary">
                  Account Number <span className="text-error">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="bg-purple-bg border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                  placeholder="Bank account number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-text-primary">
                  Bank Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="bankName"
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bg-purple-bg border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                  placeholder="e.g., Ghana Commercial Bank"
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 border-purple-accent hover:bg-purple-surface"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gold-primary text-text-tertiary hover:bg-gold-dark"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
