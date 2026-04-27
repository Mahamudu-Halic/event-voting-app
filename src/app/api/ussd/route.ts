import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/lib/supabase/server";

const sessionStore = new Map<string, any>();

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { sessionID, userID, newSession, msisdn, userData } = body;

  // ---------------- NEW SESSION ----------------
  if (newSession) {
    const message =
      "Welcome to Tomame\n" +
      "1. Vote for a nominee";

    sessionStore.set(sessionID, { level: 1 });

    return NextResponse.json({
      message,
      continueSession: true,
    });
  }

  const session = sessionStore.get(sessionID);

  if (!session) {
    return NextResponse.json({
      message: "Session expired. Try again.",
      continueSession: false,
    });
  }

  let message = "";
  let continueSession = true;

  // ---------------- LEVEL 1 ----------------
  if (session.level === 1) {
    if (userData === "1") {
      message = "Enter nominee code:";
      session.level = 2;
    } else {
      message = "Invalid option";
      continueSession = false;
    }
  }

  // ---------------- LEVEL 2 ----------------
  else if (session.level === 2) {
    session.nomineeCode = userData;

    // Fetch nominee from Supabase using unique code
    const supabase = await createClient();
    const { data: nominee, error: nomineeError } = await supabase
      .from("nominees")
      .select("id, nominee_name, category_id, categories!inner(event_id, events!inner(amount_per_vote, service_fee, created_by, voting_start_date, voting_end_date, approval_status, is_active))")
      .eq("unique_code", userData)
      .eq("is_active", true)
      .single();

    if (nomineeError || !nominee) {
      message = "Invalid nominee code. Please try again:\n0. Back to main menu";
      if (userData === "0") {
        message = "Welcome to Tomame\n1. Vote for a nominee";
        session.level = 1;
      }
      sessionStore.set(sessionID, session);
      return NextResponse.json({ message, continueSession: true });
    }

    // Check if event is approved and active
    const eventData = (nominee.categories as unknown as { event_id: string; events: { amount_per_vote: number; service_fee: number; created_by: string; voting_start_date: string | null; voting_end_date: string | null; approval_status: string; is_active: boolean } })?.events;
    
    if (!eventData || eventData.approval_status !== "approved" || !eventData.is_active) {
      message = "This nominee is not available for voting.\n0. Back to main menu";
      sessionStore.set(sessionID, session);
      return NextResponse.json({ message, continueSession: true });
    }

    // Check if voting is open
    const now = new Date();
    if (eventData.voting_start_date && new Date(eventData.voting_start_date) > now) {
      message = "Voting has not started yet.\n0. Back to main menu";
      sessionStore.set(sessionID, session);
      return NextResponse.json({ message, continueSession: true });
    }
    if (eventData.voting_end_date && new Date(eventData.voting_end_date) < now) {
      message = "Voting has ended.\n0. Back to main menu";
      sessionStore.set(sessionID, session);
      return NextResponse.json({ message, continueSession: true });
    }

    session.nomineeId = nominee.id;
    session.nomineeName = nominee.nominee_name;
    session.eventId = (nominee.categories as unknown as { event_id: string })?.event_id;
    session.categoryId = nominee.category_id;
    session.amountPerVote = eventData.amount_per_vote;
    session.serviceFee = eventData.service_fee;
    session.organizerId = eventData.created_by;
    session.level = 3;

    message =
      `Nominee: ${session.nomineeName}\n` +
      `Price per vote: GHS ${session.amountPerVote}\n` +
      "Enter number of votes:";
  }

  // ---------------- LEVEL 3 ----------------
  else if (session.level === 3) {
    const votes = parseInt(userData);

    if (isNaN(votes) || votes <= 0) {
      message = "Enter a valid number:";
      return NextResponse.json({ message, continueSession: true });
    }

    const amount = votes * session.amountPerVote;
    const serviceFeeAmount = amount * (session.serviceFee / 100);
    const totalAmount = amount;

    session.votes = votes;
    session.amount = totalAmount;
    session.level = 4;

    message =
      `Confirm Vote\n` +
      `Nominee: ${session.nomineeName}\n` +
      `Votes: ${votes}\n` +
      `Price per vote: GHS ${session.amountPerVote}\n` +
      `Total: GHS ${totalAmount}\n` +
      `1. Confirm\n2. Cancel`;
  }

  // ---------------- LEVEL 4 ----------------
  else if (session.level === 4) {
    if (userData === "1") {
      // Trigger Paystack Payment

      const reference = `VOTE_${Date.now()}_${sessionID.slice(0, 8)}`;

      try {
        await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email: `${msisdn}@ussd.com`,
            amount: session.amount * 100, // pesewas
            reference,
            channels: ["mobile_money"],
            metadata: {
              nomineeId: session.nomineeId,
              nomineeCode: session.nomineeCode,
              nomineeName: session.nomineeName,
              eventId: session.eventId,
              categoryId: session.categoryId,
              votes: session.votes,
              amountPerVote: session.amountPerVote,
              serviceFee: session.serviceFee,
              organizerId: session.organizerId,
              msisdn,
              source: "ussd",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        // Save pending vote to Supabase
        const supabase = await createClient();
        await supabase.from("pending_votes").insert({
          reference,
          nominee_id: session.nomineeId,
          event_id: session.eventId,
          votes_count: session.votes,
          amount: session.amount,
          msisdn,
          status: "pending",
          metadata: {
            nomineeCode: session.nomineeCode,
            nomineeName: session.nomineeName,
            categoryId: session.categoryId,
            amountPerVote: session.amountPerVote,
            serviceFee: session.serviceFee,
            organizerId: session.organizerId,
          },
        });

      } catch (err) {
        console.error("Paystack error:", err);
        message = "Payment initialization failed. Please try again.\n0. Back to main menu";
        sessionStore.set(sessionID, session);
        return NextResponse.json({ message, continueSession: true });
      }

      message =
        `Payment prompt sent.\n` +
        `Approve GHS ${session.amount} on your phone.\n` +
        `Thank you for voting for ${session.nomineeName}!`;

      continueSession = false;
    }

    else {
      message = "Cancelled. Thank you!";
      continueSession = false;
    }
  }

  sessionStore.set(sessionID, session);

  return NextResponse.json({
    message,
    continueSession,
  });
}