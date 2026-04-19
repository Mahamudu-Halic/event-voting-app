-- Migration: Recreate simplified accounts table for organizer earnings
-- Created: 2026-04-19

-- ============================================================================
-- PART 1: Create accounts table (one per user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_earned DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

COMMENT ON TABLE public.accounts IS 'Organizer accounts for tracking earnings from vote payments';

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own account" ON public.accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage accounts" ON public.accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Allow service role (server-side) to manage all accounts for payment processing
CREATE POLICY "Service role manages accounts" ON public.accounts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- PART 2: Update handle_new_user function to create account
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, 'organizer', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create account for organizer
  INSERT INTO public.accounts (user_id, balance, total_earned, total_withdrawn)
  VALUES (NEW.id, 0.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Create function to credit organizer account after payment
-- ============================================================================

CREATE OR REPLACE FUNCTION public.credit_organizer_account(
    p_event_id UUID,
    p_amount DECIMAL(12, 2),
    p_service_fee_percent DECIMAL(5, 2)
)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    v_organizer_id UUID;
    v_net_amount DECIMAL(12, 2);
    v_service_fee DECIMAL(12, 2);
BEGIN
    -- Get event organizer
    SELECT created_by INTO v_organizer_id
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_organizer_id IS NULL THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Calculate service fee and net amount
    v_service_fee := p_amount * (p_service_fee_percent / 100);
    v_net_amount := p_amount - v_service_fee;
    
    -- Update organizer account
    UPDATE public.accounts
    SET balance = balance + v_net_amount,
        total_earned = total_earned + v_net_amount,
        updated_at = now()
    WHERE user_id = v_organizer_id;
    
    -- If no account exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.accounts (user_id, balance, total_earned, total_withdrawn)
        VALUES (v_organizer_id, v_net_amount, v_net_amount, 0.00);
    END IF;
    
    RETURN v_net_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
