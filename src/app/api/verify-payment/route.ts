import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackPayment } from "@/apis/paystack";
import { verifyAndProcessVote } from "@/apis/events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, eventId } = body;

    if (!reference || !eventId) {
      return NextResponse.json(
        { success: false, message: "Missing reference or eventId" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paymentData = await verifyPaystackPayment(reference);

    if (!paymentData) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred while processing your payment",
      },
      { status: 500 }
    );
  }
}
