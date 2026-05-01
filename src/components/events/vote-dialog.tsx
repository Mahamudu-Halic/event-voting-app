"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PublicNominee } from "@/apis/events";
import { initializePaystackPayment, generatePaymentReference } from "@/apis/paystack";
import { Ticket, Minus, Plus, Loader2, TrendingUp, User, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface VoteDialogProps {
  nominee: PublicNominee;
  eventId: string;
  amountPerVote: number;
  serviceFee: number;
  isLive: boolean;
  currency?: "GHS" | "NGN";
}

export function VoteDialog({
  nominee,
  eventId,
  amountPerVote,
  serviceFee,
  isLive,
  currency = "NGN", // Default to NGN for broader compatibility
}: VoteDialogProps) {
  const DEFAULT_VOTER_EMAIL = "tomame247@gmail.com";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  const router = useRouter()

  const [voteCount, setVoteCount] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [voterName, setVoterName] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    totalAmount?: number;
  } | null>(null);
  // const router = useRouter()

  const baseAmount = amountPerVote * voteCount;
  // const feeAmount = baseAmount * (serviceFee / 100);
  const totalAmount = baseAmount; // Only charge base amount, no service fee to voter

  // Currency symbol based on selected currency
  const currencySymbol = currency === "GHS" ? "₵" : "₦";

  const handleVoteCountChange = (value: number) => {
    setVoteCount(Math.max(1, Math.min(1000, value)));
  };

  const handleProceedToPayment = () => {
    setShowPaymentForm(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      // Generate unique payment reference
      const reference = generatePaymentReference();

      // Initialize Paystack payment with API callback
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_UR}/api/verify-payment`;

      // Close dialog before opening Paystack
      setIsOpen(false);

      // Small delay to ensure dialog closes smoothly before Paystack opens
      setTimeout(() => {
        initializePaystackPayment({
          email: DEFAULT_VOTER_EMAIL,
          amount: Math.round(totalAmount * 100), // Convert to kobo/pesewas
          reference,
          callback_url: callbackUrl,
          currency,
          metadata: {
            event_id: eventId,
            nominee_id: nominee.id,
            votes_count: voteCount,
            voter_email: DEFAULT_VOTER_EMAIL,
            voter_name: voterName || undefined,
          },
          onSuccess: async (response) => {
            // Payment successful - verify and process via API
            setIsVerifying(true);
            setIsOpen(true);
            try {
              const verifyResponse = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  reference: response.reference,
                  eventId,
                }),
              });

              const result = await verifyResponse.json();

              setResult({
                success: result.success,
                message: result.message,
                totalAmount: result.totalAmount || totalAmount,
              });
              setIsVerifying(false);
              setIsSubmitting(false);
              router.refresh()
            } catch (error) {
              console.error('Payment verification error:', error);
              setResult({
                success: false,
                message: 'Payment successful but verification failed',
              });
              setIsVerifying(false);
              setIsSubmitting(false);
            }
          },
          onCancel: () => {
            // Payment cancelled - reopen dialog
            setIsOpen(true);
            setIsSubmitting(false);
          },
          onClose: () => {
            // Payment modal closed without completing
            setIsOpen(true);
            setIsSubmitting(false);
          },
        });
      }, 300);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to initialize payment",
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after a delay
    setTimeout(() => {
      setVoteCount(1);
      setResult(null);
      setVoterName("");
      setShowPaymentForm(false);
      setIsVerifying(false);
    }, 200);
  };

  // Don't show anything if voting is not live
  if (!isLive) {
    return (
      <Button
        className="w-full bg-purple-surface text-text-secondary cursor-not-allowed"
        disabled
      >
        <Ticket className="mr-2 h-4 w-4" />
        Voting Closed
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gold-primary text-text-tertiary hover:bg-gold-dark">
          <Ticket className="mr-2 h-4 w-4" />
          Cast Vote
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-purple-bg border-purple-accent/30 sm:max-w-md">
        {isVerifying ? (
          /* Verification Loading State */
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gold-primary/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-gold-primary animate-spin" />
            </div>
            <DialogTitle className="text-text-primary mb-2">Verifying Payment</DialogTitle>
            <p className="text-text-secondary">Please wait while we verify your payment...</p>
          </div>
        ) : !result ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-text-primary">Cast Your Vote</DialogTitle>
            </DialogHeader>

            {/* Nominee Info */}
            <div className="flex items-center gap-4 py-4 border-b border-purple-accent/20">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-purple-surface shrink-0">
                {nominee.nomineeImageUrl ? (
                  <Image
                    src={nominee.nomineeImageUrl}
                    alt={nominee.nomineeName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-accent/20 to-gold-primary/20">
                    <User className="h-8 w-8 text-text-secondary/30" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{nominee.nomineeName}</h3>
                <p className="text-sm text-text-secondary flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {nominee.votesCount.toLocaleString()} votes
                </p>
              </div>
            </div>

            {/* Vote Count Input */}
            <div className="space-y-4 py-4">
              <Label htmlFor="voteCount" className="text-text-primary">
                Number of Votes
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-purple-accent text-text-primary hover:bg-purple-surface"
                  onClick={() => handleVoteCountChange(voteCount - 1)}
                  disabled={voteCount <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="voteCount"
                  type="number"
                  min={1}
                  max={1000}
                  value={voteCount}
                  onChange={(e) => handleVoteCountChange(parseInt(e.target.value) || 1)}
                  className="text-center bg-purple-surface border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-purple-accent text-text-primary hover:bg-purple-surface"
                  onClick={() => handleVoteCountChange(voteCount + 1)}
                  disabled={voteCount >= 1000}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Voter Info Form */}
            {!showPaymentForm ? (
              <div className="space-y-4 py-4 border-t border-purple-accent/20">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-primary">
                    Your Name (Optional)
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    className="bg-purple-surface border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                  />
                </div>
                <Button
                  onClick={handleProceedToPayment}
                  className="w-full bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                >
                  Proceed to Payment
                </Button>
              </div>
            ) : (
              <>
                {/* Pricing Breakdown */}
                <div className="bg-purple-surface rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      {voteCount} vote{voteCount !== 1 ? "s" : ""} @ {currencySymbol}{amountPerVote.toFixed(2)}
                    </span>
                    <span className="text-text-primary">{currencySymbol}{baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-purple-accent/20 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-text-primary">Total Amount</span>
                      <span className="text-gold-primary">{currencySymbol}{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="space-y-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Ticket className="mr-2 h-4 w-4" />
                        Pay & Cast {voteCount} Vote{voteCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    className="w-full border-purple-accent text-text-primary hover:bg-purple-surface"
                  >
                    Back
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Result Screen */
          <div className="text-center py-6">
            {result.success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <DialogTitle className="text-text-primary mb-2">Vote Cast Successfully!</DialogTitle>
                <p className="text-text-secondary mb-4">{result.message}</p>
                <p className="text-lg font-semibold text-gold-primary mb-6">
                  Total Paid: {currencySymbol}{result.totalAmount?.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-error text-2xl font-bold">!</span>
                </div>
                <DialogTitle className="text-text-primary mb-2">Vote Failed</DialogTitle>
                <p className="text-text-secondary mb-6">{result.message}</p>
              </>
            )}
            <Button
              onClick={handleClose}
              className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
            >
              {result.success ? "Done" : "Try Again"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
