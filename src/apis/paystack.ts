interface PaystackInitializeParams {
  email: string;
  amount: number; // in kobo/pesewas (multiply GHS by 100)
  reference: string;
  callback_url: string;
  currency?: "GHS" | "NGN"; // Paystack currency
  metadata: {
    event_id: string;
    nominee_id: string;
    votes_count: number;
    voter_email?: string;
    voter_name?: string;
  };
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      event_id: string;
      nominee_id: string;
      votes_count: string;
      voter_email?: string;
      voter_name?: string;
    };
    fees: number;
    customer: {
      id: number;
      email: string;
    };
  };
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_SECRET_KEY = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;
const DEFAULT_CURRENCY = (process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY as "GHS" | "NGN") || "NGN";

export function initializePaystackPayment(params: PaystackInitializeParams): void {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error("Paystack public key not configured");
  }

  // Load Paystack script dynamically
  const script = document.createElement("script");
  script.src = "https://js.paystack.co/v1/inline.js";
  script.async = true;

  script.onload = () => {
    // Detect currency from: 1) params, 2) env variable, 3) auto-detect from key
    // pk_test_... or pk_live_... followed by regional indicators
    const isGhanaAccount = PAYSTACK_PUBLIC_KEY!.includes("_gh_");
    const detectedCurrency = isGhanaAccount ? "GHS" : DEFAULT_CURRENCY;
    const currency = params.currency || detectedCurrency;

    const handler = (window as unknown as {
      PaystackPop: {
        setup: (config: {
          key: string;
          email: string;
          amount: number;
          ref: string;
          currency: string;
          callback: (response: { reference: string }) => void;
          onClose: () => void;
          metadata?: Record<string, string | number | undefined>;
        }) => { openIframe: () => void };
      };
    }).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY!,
      email: params.email,
      amount: params.amount,
      ref: params.reference,
      currency,
      // Flat metadata structure - Paystack expects string values
      metadata: {
        event_id: params.metadata.event_id,
        nominee_id: params.metadata.nominee_id,
        votes_count: String(params.metadata.votes_count),
        voter_email: params.metadata.voter_email || "",
        voter_name: params.metadata.voter_name || "",
      },
      callback: (response: { reference: string }) => {
        // Redirect to verify page with reference
        window.location.href = `${params.callback_url}?reference=${response.reference}`;
      },
      onClose: () => {
        // User closed the popup
        console.log("Payment cancelled by user");
      },
    });

    handler.openIframe();
  };

  document.body.appendChild(script);
}

export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyResponse["data"] | null> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to verify payment");
    }

    const result: PaystackVerifyResponse = await response.json();

    if (result.status && result.data.status === "success") {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return null;
  }
}

export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VOTE_${timestamp}_${random}`;
}