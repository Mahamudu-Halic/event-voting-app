-- Migration: Fix withdrawal cancellation to refund balance
-- Created: 2026-04-20
-- Description: Update the update_withdrawal_status function to handle cancelled withdrawals properly

-- Drop and recreate the function with proper cancellation handling
DROP FUNCTION IF EXISTS public.update_withdrawal_status(UUID, withdrawal_status, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_withdrawal_status(
    p_withdrawal_id UUID,
    p_new_status withdrawal_status,
    p_processed_by UUID DEFAULT NULL,
    p_transaction_reference TEXT DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status withdrawal_status;
    v_user_id UUID;
    v_account_id UUID;
    v_amount DECIMAL(12, 2);
BEGIN
    -- Get current withdrawal details
    SELECT status, user_id, account_id, amount 
    INTO v_current_status, v_user_id, v_account_id, v_amount
    FROM public.withdrawals
    WHERE id = p_withdrawal_id;
    
    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Withdrawal not found';
    END IF;
    
    -- Handle status transitions
    IF p_new_status = 'failed' AND v_current_status IN ('pending', 'processing') THEN
        -- Refund the amount back to account
        UPDATE public.accounts
        SET balance = balance + v_amount,
            total_withdrawn = total_withdrawn - v_amount,
            updated_at = now()
        WHERE id = v_account_id;
    END IF;
    
    IF p_new_status = 'cancelled' AND v_current_status IN ('pending', 'processing') THEN
        -- Refund the amount back to account for cancelled withdrawals
        UPDATE public.accounts
        SET balance = balance + v_amount,
            total_withdrawn = total_withdrawn - v_amount,
            updated_at = now()
        WHERE id = v_account_id;
    END IF;
    
    -- Update withdrawal status
    UPDATE public.withdrawals
    SET status = p_new_status,
        processed_at = CASE WHEN p_new_status IN ('completed', 'failed', 'cancelled') THEN now() ELSE processed_at END,
        processed_by = p_processed_by,
        transaction_reference = COALESCE(p_transaction_reference, transaction_reference),
        failure_reason = COALESCE(p_failure_reason, failure_reason),
        updated_at = now()
    WHERE id = p_withdrawal_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
