import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.event === "charge.success") {
    const data = body.data;
    const metadata = data.metadata;

    const {
      nomineeId,
      nomineeCode,
      eventId,
      votes,
      amountPerVote,
      serviceFee,
      organizerId,
      msisdn,
      source,
    } = metadata;

    console.log("Payment successful:", { nomineeId, nomineeCode, eventId, votes, msisdn, source });

    try {
      const supabase = await createClient();
      const now = new Date();

      // Get event details to verify and get current data
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("amount_per_vote, service_fee, voting_start_date, voting_end_date, total_revenue, created_by")
        .eq("id", eventId)
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .single();

      if (eventError || !event) {
        console.error("Event not found or not available for voting:", eventError);
        return NextResponse.json({ status: "error", message: "Event not available" }, { status: 400 });
      }

      // Check if voting is still open
      if (event.voting_start_date && new Date(event.voting_start_date) > now) {
        console.error("Voting has not started yet");
        return NextResponse.json({ status: "error", message: "Voting not started" }, { status: 400 });
      }
      if (event.voting_end_date && new Date(event.voting_end_date) < now) {
        console.error("Voting has ended");
        return NextResponse.json({ status: "error", message: "Voting ended" }, { status: 400 });
      }

      // Verify the payment amount matches expected amount
      const paidAmount = data.amount / 100; // Convert from pesewas to GHS
      const expectedAmount = event.amount_per_vote * votes;

      if (Math.abs(paidAmount - expectedAmount) > 0.01) {
        console.error("Payment amount mismatch:", { paidAmount, expectedAmount });
        return NextResponse.json({ status: "error", message: "Payment amount mismatch" }, { status: 400 });
      }

      // Get nominee details
      const { data: nominee, error: nomineeError } = await supabase
        .from("nominees")
        .select("id, votes_count, category_id")
        .eq("id", nomineeId)
        .eq("is_active", true)
        .single();

      if (nomineeError || !nominee) {
        console.error("Nominee not found:", nomineeError);
        return NextResponse.json({ status: "error", message: "Nominee not found" }, { status: 400 });
      }

      // Update nominee vote count
      const { error: updateNomineeError } = await supabase
        .from("nominees")
        .update({
          votes_count: Number(nominee.votes_count || 0) + Number(votes),
          updated_at: now.toISOString(),
        })
        .eq("id", nomineeId);

      if (updateNomineeError) {
        console.error("Error updating nominee votes:", updateNomineeError);
        return NextResponse.json({ status: "error", message: "Failed to update votes" }, { status: 500 });
      }

      console.log(`Updated nominee ${nomineeId} votes: ${nominee.votes_count} -> ${(nominee.votes_count || 0) + votes}`);

      // Update event total_revenue
      const { error: updateRevenueError } = await supabase
        .from("events")
        .update({
          total_revenue: (event.total_revenue || 0) + paidAmount,
          updated_at: now.toISOString(),
        })
        .eq("id", eventId);

      if (updateRevenueError) {
        console.error("Error updating event revenue:", updateRevenueError);
        // Don't throw - vote was already cast successfully
      } else {
        console.log(`Updated event ${eventId} revenue: ${event.total_revenue} -> ${(event.total_revenue || 0) + paidAmount}`);
      }

      // Credit organizer account with amount minus service fee
      const serviceFeeAmount = paidAmount * (event.service_fee / 100);
      const netAmount = paidAmount - serviceFeeAmount;
      const organizerUserId = organizerId || event.created_by;

      try {
        // Use admin client to bypass RLS for account updates
        const adminClient = await createAdminClient();

        if (organizerUserId) {
          // Update or create organizer account using admin client
          const { data: account, error: accountError } = await adminClient
            .from("accounts")
            .select("id, balance, total_earned")
            .eq("user_id", organizerUserId)
            .single();

          if (accountError && accountError.code !== "PGRST116") {
            console.error("Error fetching account:", accountError);
          }

          if (account) {
            // Update existing account
            const { error: updateError } = await adminClient
              .from("accounts")
              .update({
                balance: (account.balance || 0) + netAmount,
                total_earned: (account.total_earned || 0) + netAmount,
                updated_at: now.toISOString(),
              })
              .eq("id", account.id);

            if (updateError) {
              console.error("Error updating organizer account:", updateError);
            } else {
              console.log(`Credited organizer ${organizerUserId}: +GHS ${netAmount} (balance: ${(account.balance || 0) + netAmount})`);
            }
          } else {
            // Create new account for organizer
            const { error: insertError } = await adminClient
              .from("accounts")
              .insert({
                user_id: organizerUserId,
                balance: netAmount,
                total_earned: netAmount,
                total_withdrawn: 0,
              });

            if (insertError) {
              console.error("Error creating organizer account:", insertError);
            } else {
              console.log(`Created account for organizer ${organizerUserId} with balance: GHS ${netAmount}`);
            }
          }
        }
      } catch (accountError) {
        console.error("Error crediting organizer account:", accountError);
        // Don't throw - vote was already cast successfully
      }

      // Record the transaction
      try {
        const adminClient = await createAdminClient();
        await adminClient.from("transactions").insert({
          user_id: organizerUserId,
          type: "vote_payment",
          amount: paidAmount,
          fee: serviceFeeAmount,
          net_amount: netAmount,
          reference: data.reference,
          status: "completed",
          metadata: {
            nominee_id: nomineeId,
            nominee_code: nomineeCode,
            event_id: eventId,
            votes: votes,
            msisdn: msisdn,
            source: source || "web",
            paystack_data: {
              id: data.id,
              channel: data.channel,
              paid_at: data.paid_at,
            },
          },
        });
      } catch (txError) {
        console.error("Error recording transaction:", txError);
        // Don't throw - vote was already cast successfully
      }

      // Update pending vote status if it exists
      try {
        await supabase
          .from("pending_votes")
          .update({
            status: "completed",
            paystack_reference: data.reference,
            completed_at: now.toISOString(),
          })
          .eq("reference", data.reference);
      } catch (pendingError) {
        // Ignore error - pending_votes table might not exist
      }

      console.log("Vote processed successfully:", {
        nomineeId,
        votes,
        paidAmount,
        netAmount,
        serviceFeeAmount,
        organizerUserId,
      });

      return NextResponse.json({
        status: "ok",
        message: "Vote processed successfully",
        data: {
          nomineeId,
          votesAdded: votes,
          totalAmount: paidAmount,
          netAmount,
          serviceFee: serviceFeeAmount,
        },
      });

    } catch (error) {
      console.error("Error processing payment webhook:", error);
      return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
  }

  // Handle other events (charge.failed, etc.)
  if (body.event === "charge.failed") {
    const data = body.data;
    console.log("Payment failed:", data.reference, data.status);

    // Update pending vote status if it exists
    try {
      const supabase = await createClient();
      await supabase
        .from("pending_votes")
        .update({
          status: "failed",
          paystack_reference: data.reference,
          failed_at: new Date().toISOString(),
          failure_reason: data.message || "Payment failed",
        })
        .eq("reference", data.reference);
    } catch (pendingError) {
      // Ignore error
    }
  }

  return NextResponse.json({ status: "ok" });
}