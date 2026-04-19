"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { verifyPaystackPayment } from "@/apis/paystack";
import { verifyAndProcessVote } from "@/apis/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const CURRENCY_SYMBOL =
  (process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY as "GHS" | "NGN") === "GHS"
    ? "₵"
    : "₦";

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [message, setMessage] = useState("Verifying your payment...");
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [netAmount, setNetAmount] = useState<number | null>(null);
  const [serviceFee, setServiceFee] = useState<number | null>(null);

  const reference = searchParams.get("reference");
  const eventId = params.id as string;

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    const processPayment = async () => {
      try {
        // Verify payment with Paystack
        const paymentData = await verifyPaystackPayment(reference);

        if (!paymentData) {
          setStatus("error");
          setMessage("Payment verification failed. Please contact support.");
          return;
        }

        // Extract metadata
        const metadata = paymentData.metadata;
        const amountInPesewas = paymentData.amount;

        // Process the vote
        const result = await verifyAndProcessVote({
          reference,
          amount: amountInPesewas,
          eventId: metadata.event_id || eventId,
          nomineeId: metadata.nominee_id,
          votesCount: parseInt(metadata.votes_count, 10),
        });

        if (result.success) {
          setStatus("success");
          setMessage(result.message);
          setTotalAmount(result.totalAmount);
          setNetAmount(result.netAmount ?? null);
          setServiceFee(result.serviceFee ?? null);
        } else {
          setStatus("error");
          setMessage(result.message || "Failed to process vote.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "An error occurred while processing your payment.",
        );
      }
    };

    processPayment();
  }, [reference, eventId]);

  return (
    <div className="min-h-screen bg-purple-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-purple-surface border-purple-accent/30">
        <CardHeader className="text-center">
          <CardTitle className="text-text-primary text-2xl">
            {status === "verifying" && "Verifying Payment"}
            {status === "success" && "Payment Successful!"}
            {status === "error" && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 text-gold-primary animate-spin" />
              <p className="text-text-secondary">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <div className="space-y-2">
                <p className="text-text-primary font-medium">{message}</p>
                {totalAmount && (
                  <div className="bg-purple-surface rounded-lg p-3 mt-2">
                    <div className="text-sm text-text-secondary mb-2">
                      Payment Details
                    </div>
                    <div className="flex justify-between font-semibold text-success border-t border-purple-accent/20 pt-1 mt-1">
                      <span>Total Paid</span>
                      <span className="font-medium">
                        {CURRENCY_SYMBOL}
                        {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-text-secondary text-sm">
                  Reference: {reference}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  asChild
                  className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                >
                  <Link href={`/events/${eventId}`}>Back to Event</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-error" />
              </div>
              <div className="space-y-2">
                <p className="text-text-primary font-medium">{message}</p>
                {reference && (
                  <p className="text-text-secondary text-sm">
                    Reference: {reference}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-purple-accent text-text-primary hover:bg-purple-surface"
                >
                  <Link href={`/events/${eventId}`}>Back to Event</Link>
                </Button>
                <Button
                  onClick={() => router.refresh()}
                  className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-purple-bg flex items-center justify-center">
          <Card className="w-full max-w-md bg-purple-surface border-purple-accent/30">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-16 w-16 text-gold-primary animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyPaymentContent />
    </Suspense>
  );
}
