"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface Account {
  id: string
  userId: string
  balance: number
  totalEarned: number
  totalWithdrawn: number
  createdAt: string
  updatedAt: string
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type PaymentMethod = 'mobile_money' | 'bank_transfer'

export interface Withdrawal {
  id: string
  userId: string
  accountId: string
  amount: number
  status: WithdrawalStatus
  paymentMethod: PaymentMethod
  phoneNumber?: string
  accountName?: string
  accountNumber?: string
  bankName?: string
  bankCode?: string
  processedAt?: string
  processedBy?: string
  transactionReference?: string
  failureReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateWithdrawalData {
  amount: number
  paymentMethod: PaymentMethod
  phoneNumber?: string
  accountName?: string
  accountNumber?: string
  bankName?: string
  bankCode?: string
}

export interface WithdrawalResult {
  success: boolean
  message: string
  withdrawalId?: string
}

// Get current user's account balance and stats
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, user_id, balance, total_earned, total_withdrawn, created_at, updated_at")
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching account:", error)
    throw new Error("Failed to fetch account")
  }

  return {
    id: data.id,
    userId: data.user_id,
    balance: data.balance,
    totalEarned: data.total_earned,
    totalWithdrawn: data.total_withdrawn,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Get withdrawal history for current user
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching withdrawals:", error)
    throw new Error("Failed to fetch withdrawals")
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    accountId: item.account_id,
    amount: item.amount,
    status: item.status,
    paymentMethod: item.payment_method,
    phoneNumber: item.phone_number,
    accountName: item.account_name,
    accountNumber: item.account_number,
    bankName: item.bank_name,
    bankCode: item.bank_code,
    processedAt: item.processed_at,
    processedBy: item.processed_by,
    transactionReference: item.transaction_reference,
    failureReason: item.failure_reason,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

// Create a new withdrawal request
export async function createWithdrawal(data: CreateWithdrawalData): Promise<WithdrawalResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Validate minimum withdrawal amount
  const MIN_WITHDRAWAL = 10.00
  if (data.amount < MIN_WITHDRAWAL) {
    return {
      success: false,
      message: `Minimum withdrawal amount is ₵${MIN_WITHDRAWAL.toFixed(2)}`,
    }
  }

  // Validate payment method details
  if (data.paymentMethod === 'mobile_money' && !data.phoneNumber) {
    return {
      success: false,
      message: "Phone number is required for mobile money withdrawals",
    }
  }

  if (data.paymentMethod === 'bank_transfer' && (!data.accountName || !data.accountNumber || !data.bankName)) {
    return {
      success: false,
      message: "Account name, account number, and bank name are required for bank transfers",
    }
  }

  try {
    // Use RPC function to process withdrawal atomically
    const { data: withdrawalId, error } = await supabase.rpc('process_withdrawal_request', {
      p_user_id: user.id,
      p_amount: data.amount,
      p_payment_method: data.paymentMethod,
      p_phone_number: data.phoneNumber || null,
      p_account_name: data.accountName || null,
      p_account_number: data.accountNumber || null,
      p_bank_name: data.bankName || null,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: `Withdrawal request for ₵${data.amount.toFixed(2)} submitted successfully`,
      withdrawalId,
    }
  } catch (error) {
    console.error("Error creating withdrawal:", error)
    
    // Check for specific error messages from the function
    const errorMessage = error instanceof Error ? error.message : "Failed to create withdrawal"
    
    if (errorMessage.includes("Insufficient balance")) {
      return {
        success: false,
        message: errorMessage,
      }
    }

    return {
      success: false,
      message: errorMessage,
    }
  }
}

// Cancel a pending withdrawal (refund balance)
export async function cancelWithdrawal(withdrawalId: string): Promise<WithdrawalResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    const { error } = await supabase.rpc('update_withdrawal_status', {
      p_withdrawal_id: withdrawalId,
      p_new_status: 'cancelled',
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: "Withdrawal cancelled successfully. Amount refunded to your balance.",
    }
  } catch (error) {
    console.error("Error cancelling withdrawal:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel withdrawal",
    }
  }
}

// Admin: Get all pending withdrawals
export async function getPendingWithdrawals(): Promise<Withdrawal[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("withdrawals")
    .select("*")
    .in("status", ['pending', 'processing'])
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching pending withdrawals:", error)
    throw new Error("Failed to fetch pending withdrawals")
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    accountId: item.account_id,
    amount: item.amount,
    status: item.status,
    paymentMethod: item.payment_method,
    phoneNumber: item.phone_number,
    accountName: item.account_name,
    accountNumber: item.account_number,
    bankName: item.bank_name,
    bankCode: item.bank_code,
    processedAt: item.processed_at,
    processedBy: item.processed_by,
    transactionReference: item.transaction_reference,
    failureReason: item.failure_reason,
    notes: item.notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

// Admin: Update withdrawal status
export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: WithdrawalStatus,
  transactionReference?: string,
  failureReason?: string
): Promise<WithdrawalResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error("Unauthorized")
  }

  try {
    const { error } = await supabase.rpc('update_withdrawal_status', {
      p_withdrawal_id: withdrawalId,
      p_new_status: status,
      p_processed_by: user.id,
      p_transaction_reference: transactionReference || null,
      p_failure_reason: failureReason || null,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: `Withdrawal status updated to ${status}`,
    }
  } catch (error) {
    console.error("Error updating withdrawal status:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update withdrawal status",
    }
  }
}
