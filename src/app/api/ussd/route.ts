import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface USSDSession {
  eventId?: string;
  categoryId?: string;
  nomineeId?: string;
  nomineeCode?: string;
  nomineeName?: string;
  votes?: number;
  amount?: number;
  amountPerVote?: number;
  serviceFee?: number;
  level?: number;
  reference?: string;
  organizerId?: string;
  [key: string]: unknown;
}

const sessionStore = new Map<string, USSDSession>();

// Process vote when payment succeeds - updates nominee votes, event revenue, organizer account
async function processVote(session: Record<string, any>, msisdn: string) {
  const supabase = await createClient();
  const now = new Date();

  const {
    nomineeId,
    eventId,
    votes,
    amount,
    reference,
    organizerId,
    nomineeCode,
    nomineeName,
    categoryId,
  } = session;

  if (!nomineeId || !eventId || !votes) {
    throw new Error("Missing required session data for vote processing");
  }

  // Get nominee details
  const { data: nominee, error: nomineeError } = await supabase
    .from("nominees")
    .select("id, votes_count")
    .eq("id", nomineeId)
    .eq("is_active", true)
    .single();

  if (nomineeError || !nominee) {
    throw new Error("Nominee not found");
  }

  // Update nominee vote count
  const { error: updateNomineeError } = await supabase
    .from("nominees")
    .update({
      votes_count: (nominee.votes_count || 0) + votes,
      updated_at: now.toISOString(),
    })
    .eq("id", nomineeId);

  if (updateNomineeError) {
    throw new Error(`Failed to update nominee votes: ${updateNomineeError.message}`);
  }


  // Get event details for revenue update
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("total_revenue, service_fee, created_by")
    .eq("id", eventId)
    .single();

  if (!eventError && event) {
    // Update event total_revenue
    await supabase
      .from("events")
      .update({
        total_revenue: (event.total_revenue || 0) + amount,
        updated_at: now.toISOString(),
      })
      .eq("id", eventId);

    // Credit organizer account
    const serviceFeeAmount = amount * (event.service_fee / 100);
    const netAmount = amount - serviceFeeAmount;
    const organizerUserId = organizerId || event.created_by;

    try {
      const adminClient = await createAdminClient();

      if (organizerUserId) {
        const { data: account } = await adminClient
          .from("accounts")
          .select("id, balance, total_earned")
          .eq("user_id", organizerUserId)
          .single();

        if (account) {
          await adminClient
            .from("accounts")
            .update({
              balance: (account.balance || 0) + netAmount,
              total_earned: (account.total_earned || 0) + netAmount,
              updated_at: now.toISOString(),
            })
            .eq("id", account.id);
        } else {
          await adminClient.from("accounts").insert({
            user_id: organizerUserId,
            balance: netAmount,
            total_earned: netAmount,
            total_withdrawn: 0,
          });
        }
      }
    } catch (accountError) {
      console.error("Error crediting organizer account:", accountError);
      // Don't throw - vote was already recorded
    }

    // Record transaction
    try {
      const adminClient = await createAdminClient();
      await adminClient.from("transactions").insert({
        user_id: organizerUserId,
        type: "vote_payment",
        amount: amount,
        fee: serviceFeeAmount,
        net_amount: netAmount,
        reference: reference,
        status: "completed",
        metadata: {
          nominee_id: nomineeId,
          nominee_code: nomineeCode,
          nominee_name: nomineeName,
          event_id: eventId,
          category_id: categoryId,
          votes: votes,
          msisdn: msisdn,
          source: "ussd",
        },
      });
    } catch (txError) {
      console.error("Error recording transaction:", txError);
    }
  }

  // Update pending vote status
  await supabase
    .from("pending_votes")
    .update({
      status: "completed",
      completed_at: now.toISOString(),
    })
    .eq("reference", reference);

}

// Detect Ghana mobile money provider from phone number
// Returns: mtn, vod, tigo, or null if unknown
function detectProvider(phone: string): string | null {
  // Remove + and any non-digits
  const clean = phone.replace(/\D/g, "");
  
  // Remove leading 0 if present
  const normalized = clean.startsWith("0") ? clean.slice(1) : clean;
  
  // Ghana prefixes after removing country code
  const withoutCountryCode = normalized.startsWith("233") 
    ? normalized.slice(3) 
    : normalized;
  
  // MTN: 024, 054, 055, 059, 0244, 025, 053, 056
  if (/^(24|54|55|59|244|25|53|56)/.test(withoutCountryCode)) {
    return "mtn";
  }
  
  // Vodafone: 020, 050
  if (/^(20|50)/.test(withoutCountryCode)) {
    return "vod";
  }
  
  // AirtelTigo (formerly Tigo): 027, 057, 026, 056
  if (/^(27|57|26)/.test(withoutCountryCode)) {
    return "tigo";
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { sessionID, userID, newSession, msisdn, userData } = body;

  // ---------------- NEW SESSION ----------------
  if (newSession) {
    if (userData !== "*928*3454#") {
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message: "Invlid input",
          continueSession: false,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const message = "Welcome to Tomame\n" + "1. Vote for a nominee";

    sessionStore.set(sessionID, { level: 1 });

    return NextResponse.json(
      {
        message,
        userID,
        sessionID,
        msisdn,
        continueSession: true,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const session = sessionStore.get(sessionID);

  if (!session) {
    return NextResponse.json(
      {
        userID,
        sessionID,
        msisdn,
        message: "Session expired. Try again.",
        continueSession: false,
      },
      { headers: { "Content-Type": "application/json" } },
    );
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

    sessionStore.set(sessionID, session);

    return NextResponse.json(
      {
        userID,
        sessionID,
        msisdn,
        message,
        continueSession,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ---------------- LEVEL 2 ----------------
  else if (session.level === 2) {
    session.nomineeCode = userData;

    // Fetch nominee from Supabase using unique code
    const supabase = await createClient();
    const { data: nominee, error: nomineeError } = await supabase
      .from("nominees")
      .select(
        "id, nominee_name, category_id, categories!inner(event_id, events!inner(amount_per_vote, service_fee, created_by, voting_start_date, voting_end_date, approval_status, is_active))",
      )
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
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: true,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if event is approved and active
    const eventData = (
      nominee.categories as unknown as {
        event_id: string;
        events: {
          amount_per_vote: number;
          service_fee: number;
          created_by: string;
          voting_start_date: string | null;
          voting_end_date: string | null;
          approval_status: string;
          is_active: boolean;
        };
      }
    )?.events;

    if (
      !eventData ||
      eventData.approval_status !== "approved" ||
      !eventData.is_active
    ) {
      message =
        "This nominee is not available for voting.\n0. Back to main menu";
      sessionStore.set(sessionID, session);
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: true,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if voting is open
    const now = new Date();
    if (
      eventData.voting_start_date &&
      new Date(eventData.voting_start_date) > now
    ) {
      message = "Voting has not started yet.\n0. Back to main menu";
      sessionStore.set(sessionID, session);
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: true,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (
      eventData.voting_end_date &&
      new Date(eventData.voting_end_date) < now
    ) {
      message = "Voting has ended.\n0. Back to main menu";
      sessionStore.set(sessionID, session);
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: true,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }

    session.nomineeId = nominee.id;
    session.nomineeName = nominee.nominee_name;
    session.eventId = (
      nominee.categories as unknown as { event_id: string }
    )?.event_id;
    session.categoryId = nominee.category_id;
    session.amountPerVote = eventData.amount_per_vote;
    session.serviceFee = eventData.service_fee;
    session.organizerId = eventData.created_by;
    session.level = 3;

    message =
      `Nominee: ${session.nomineeName}\n` +
      `Price per vote: GHS ${session.amountPerVote}\n` +
      "Enter number of votes:";

    sessionStore.set(sessionID, session);

    return NextResponse.json(
      {
        userID,
        sessionID,
        msisdn,
        message,
        continueSession,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ---------------- LEVEL 3 ----------------
  else if (session.level === 3) {
    const votes = parseInt(userData);

    if (isNaN(votes) || votes <= 0) {
      message = "Enter a valid number:";
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: true,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (!session.amountPerVote || !session.serviceFee) {
      message = "Session error. Please start again.";
      sessionStore.delete(sessionID);
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: false,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const amount = votes * session.amountPerVote;
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

    sessionStore.set(sessionID, session);

    return NextResponse.json(
      {
        userID,
        sessionID,
        msisdn,
        message,
        continueSession,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ---------------- LEVEL 4 ----------------
  else if (session.level === 4) {
    if (userData === "1") {
      // Trigger Paystack Payment

      const reference = `VOTE_${Date.now()}_${sessionID.slice(0, 8)}`;

      // Detect mobile money provider from phone number
      const provider = detectProvider(msisdn);
      if (!provider) {
        throw new Error("Could not detect mobile money provider from phone number");
      }

      try {
        const paystackResponse = await axios.post(
          "https://api.paystack.co/charge",
          {
            email: `${msisdn}@ussd.com`,
            amount: (session.amount || 0) * 100, // pesewas
            reference,
            mobile_money: {
              phone: msisdn,
              provider: provider,
            },
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
              "Content-Type": "application/json",
            },
          },
        );

        const chargeData = paystackResponse.data.data;
        // Save pending vote to Supabase
        const supabase = await createClient();
        const { error: pendingVoteError } = await supabase.from("pending_votes").insert({
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

        if (pendingVoteError) {
          console.error("Error saving pending vote:", pendingVoteError);
        }

        // Check if the charge requires OTP
        if (chargeData.status === "send_otp") {
          // Paystack requires OTP verification
          session.reference = reference;
          session.level = 5;

          message =
            `Enter the OTP code sent to your phone\n` +
            `by Paystack to complete payment:`;

          sessionStore.set(sessionID, session);

          return NextResponse.json(
            {
              userID,
              sessionID,
              msisdn,
              message,
              continueSession: true,
            },
            { headers: { "Content-Type": "application/json" } },
          );
        }

        // For other statuses, show success message
        if (chargeData.status === "success") {
          // Payment succeeded immediately - process vote now
          try {
            await processVote(session, msisdn);
            message =
              `Payment successful!\n` +
              `Thank you for voting for ${session.nomineeName}!`;
          } catch (voteError) {
            console.error("Error processing vote:", voteError);
            message =
              `Payment successful but vote recording failed.\n` +
              `Please contact support with ref: ${reference}`;
          }
        } else {
          // pay_offline or pending - mobile money prompt sent, wait for webhook
          message =
            `Payment prompt sent.\n` +
            `Approve GHS ${session.amount} on your phone.\n` +
            `Thank you for voting for ${session.nomineeName}!`;
        }

        continueSession = false;

        sessionStore.set(sessionID, session);

        return NextResponse.json(
          {
            userID,
            sessionID,
            msisdn,
            message,
            continueSession,
          },
          { headers: { "Content-Type": "application/json" } },
        );
      } catch (err) {
        const errorData = err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : err;
        console.error("Paystack charge error:", errorData || err);
        message =
          "Payment initialization failed. Please try again.\n0. Back to main menu";
        sessionStore.set(sessionID, session);
        return NextResponse.json(
          {
            userID,
            sessionID,
            msisdn,
            message,
            continueSession: true,
          },
          { headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      message = "Cancelled. Thank you!";
      continueSession = false;

      sessionStore.set(sessionID, session);

      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // ---------------- LEVEL 5 (OTP Verification) ----------------
  else if (session.level === 5) {
    const otpCode = userData.trim();

    if (!otpCode || otpCode.length < 3) {
      message = "Invalid OTP. Please enter the code sent by Paystack:";
      return NextResponse.json(
        {
          userID,
          sessionID,
          msisdn,
          message,
          continueSession: true,
        },
        { headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      // Submit OTP to Paystack
      const otpResponse = await axios.post(
        "https://api.paystack.co/charge/submit_otp",
        {
          otp: otpCode,
          reference: session.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const chargeData = otpResponse.data.data;

      // If payment succeeded immediately, process vote now (don't wait for webhook)
      if (chargeData.status === "success") {
        try {
          await processVote(session, msisdn);
          message =
            `Payment successful!\n` +
            `Thank you for voting for ${session.nomineeName}!`;
        } catch (voteError) {
          console.error("Error processing vote after OTP:", voteError);
          message =
            `Payment successful but vote recording failed.\n` +
            `Please contact support with ref: ${session.reference}`;
        }
      } else if (chargeData.status === "pending") {
        message =
          `Payment is being processed.\n` +
          `You will receive a confirmation.\n` +
          `Thank you for voting for ${session.nomineeName}!`;
      } else {
        message =
          `Payment status: ${chargeData.status}\n` +
          `Please check your phone for further instructions.`;
      }

      continueSession = false;
    } catch (err) {
      const errorData = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data
        : err;
      console.error("OTP submission error:", errorData || err);

      const errorMessage = errorData && typeof errorData === "object" && "message" in errorData
        ? errorData.message
        : "Failed to verify OTP";

      message =
        `OTP verification failed: ${errorMessage}\n` +
        `1. Try again\n` +
        `0. Cancel`;

      session.level = 6; // Retry OTP level
    }

    sessionStore.set(sessionID, session);

    return NextResponse.json(
      {
        userID,
        sessionID,
        msisdn,
        message,
        continueSession,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ---------------- LEVEL 6 (Retry OTP) ----------------
  else if (session.level === 6) {
    if (userData === "1") {
      message = "Enter the OTP code sent to your phone:";
      session.level = 5;
      continueSession = true;
    } else {
      message = "Cancelled. Thank you!";
      continueSession = false;
    }

    sessionStore.set(sessionID, session);

    return NextResponse.json(
      {
        userID,
        sessionID,
        msisdn,
        message,
        continueSession,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  }

  sessionStore.set(sessionID, session);

  return NextResponse.json(
    {
      userID,
      sessionID,
      msisdn,
      message,
      continueSession,
    },
    { headers: { "Content-Type": "application/json" } },
  );
}
