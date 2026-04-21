-- Migration: Create withdrawals table for organizer withdrawals
-- Created: 2026-04-19

-- ============================================================================
-- PART 1: Create withdrawals table
-- ============================================================================

CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    
    -- Withdrawal details
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    status withdrawal_status NOT NULL DEFAULT 'pending',
    
    -- Payment method details
    payment_method TEXT NOT NULL DEFAULT 'mobile_money', -- 'mobile_money', 'bank_transfer'
    phone_number TEXT, -- For mobile money
    account_name TEXT, -- For bank transfers
    account_number TEXT, -- For bank transfers
    bank_name TEXT, -- For bank transfers
    bank_code TEXT, -- For bank transfers
    
    -- Processing details
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    transaction_reference TEXT, -- Reference from payment provider
    failure_reason TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON public.withdrawals(created_at);

COMMENT ON TABLE public.withdrawals IS 'Organizer withdrawal requests';

-- RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users view own withdrawals" 
ON public.withdrawals FOR SELECT 
USING (user_id = auth.uid());

-- Users can create their own withdrawals
CREATE POLICY "Users create own withdrawals" 
ON public.withdrawals FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can only update pending withdrawals (to cancel)
CREATE POLICY "Users cancel pending withdrawals" 
ON public.withdrawals FOR UPDATE 
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

-- Admins can manage all withdrawals
CREATE POLICY "Admins manage withdrawals" 
ON public.withdrawals FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Service role can manage withdrawals for processing
CREATE POLICY "Service role manages withdrawals" 
ON public.withdrawals FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- PART 2: Create function to process withdrawal (deduct from balance)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
    p_user_id UUID,
    p_amount DECIMAL(12, 2),
    p_payment_method TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_account_name TEXT DEFAULT NULL,
    p_account_number TEXT DEFAULT NULL,
    p_bank_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_current_balance DECIMAL(12, 2);
    v_withdrawal_id UUID;
BEGIN
    -- Get account and check balance
    SELECT id, balance INTO v_account_id, v_current_balance
    FROM public.accounts
    WHERE user_id = p_user_id;
    
    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Account not found';
    END IF;
    
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_current_balance, p_amount;
    END IF;
    
    -- Deduct from balance immediately
    UPDATE public.accounts
    SET balance = balance - p_amount,
        total_withdrawn = total_withdrawn + p_amount,
        updated_at = now()
    WHERE id = v_account_id;
    
    -- Create withdrawal record
    INSERT INTO public.withdrawals (
        user_id,
        account_id,
        amount,
        status,
        payment_method,
        phone_number,
        account_name,
        account_number,
        bank_name
    ) VALUES (
        p_user_id,
        v_account_id,
        p_amount,
        'pending',
        p_payment_method,
        p_phone_number,
        p_account_name,
        p_account_number,
        p_bank_name
    )
    RETURNING id INTO v_withdrawal_id;
    
    RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Create function to update withdrawal status
-- ============================================================================

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
