-- Migration: Simplified accounts system for event organizers
-- Created: 2026-04-16

-- ============================================================================
-- PART 1: Add revenue tracking to events
-- ============================================================================

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.events.total_revenue IS 'Total money received from voters';

-- ============================================================================
-- PART 2: Simplified accounts table (one per user)
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

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own account" ON public.accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage accounts" ON public.accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- PART 3: Vote receipts table (payment records tied to votes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vote_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vote reference
    nominee_id UUID NOT NULL REFERENCES public.nominees(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- Voter info (anonymous voting supported)
    voter_name TEXT,
    voter_email TEXT,
    voter_phone TEXT,
    
    -- Payment details
    votes_purchased INTEGER NOT NULL CHECK (votes_purchased > 0),
    amount_per_vote DECIMAL(10, 2) NOT NULL,
    service_fee_percent INTEGER NOT NULL,
    gross_amount DECIMAL(10, 2) NOT NULL, -- votes_purchased * amount_per_vote
    service_fee DECIMAL(10, 2) NOT NULL,  -- gross * (service_fee_percent / 100)
    net_amount DECIMAL(10, 2) NOT NULL,   -- gross - service_fee (what organizer gets)
    
    -- Payment tracking
    payment_method TEXT, -- 'mobile_money', 'card', etc.
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_receipts_event ON public.vote_receipts(event_id);
CREATE INDEX idx_receipts_status ON public.vote_receipts(payment_status);
CREATE INDEX idx_receipts_paid_at ON public.vote_receipts(paid_at);

-- RLS
ALTER TABLE public.vote_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers view receipts for their events" ON public.vote_receipts FOR SELECT USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = vote_receipts.event_id AND e.created_by = auth.uid()));
CREATE POLICY "Admins manage receipts" ON public.vote_receipts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- PART 4: Transactions ledger (credits from vote receipts, debits from withdrawals)
-- ============================================================================

CREATE TYPE transaction_type AS ENUM ('credit', 'debit');

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type transaction_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL, -- always positive, type indicates direction
    description TEXT,
    
    -- References
    vote_receipt_id UUID REFERENCES public.vote_receipts(id), -- for credits
    withdrawal_id UUID, -- for debits (table created below)
    
    -- Running balance snapshot
    balance_after DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_receipt ON public.transactions(vote_receipt_id);

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- PART 5: Withdrawals table
-- ============================================================================

CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'processing', 'completed', 'rejected');

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    withdrawal_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    
    status withdrawal_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL, -- 'mobile_money', 'bank_transfer'
    payment_details JSONB, -- {phone: '...', provider: 'mtn'} or {account_number: '...', bank: '...'}
    
    -- Admin tracking
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_withdrawals_account ON public.withdrawals(account_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id);

-- RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own withdrawals" ON public.withdrawals FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins manage all withdrawals" ON public.withdrawals FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- PART 6: Trigger to credit account when vote receipt is paid
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_vote_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_organizer_id UUID;
  v_account_id UUID;
  v_new_balance DECIMAL(12, 2);
BEGIN
  -- Only process when payment becomes 'paid'
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    
    -- Get event organizer
    SELECT created_by INTO v_organizer_id FROM public.events WHERE id = NEW.event_id;
    
    -- Get or create account
    SELECT id, balance INTO v_account_id, v_new_balance 
    FROM public.accounts WHERE user_id = v_organizer_id;
    
    IF v_account_id IS NULL THEN
      INSERT INTO public.accounts (user_id, balance, total_earned, total_withdrawn)
      VALUES (v_organizer_id, 0, 0, 0)
      RETURNING id, balance INTO v_account_id, v_new_balance;
    END IF;
    
    -- Update account
    v_new_balance := v_new_balance + NEW.net_amount;
    
    UPDATE public.accounts 
    SET balance = v_new_balance, 
        total_earned = total_earned + NEW.net_amount,
        updated_at = now()
    WHERE id = v_account_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (account_id, user_id, type, amount, description, vote_receipt_id, balance_after)
    VALUES (v_account_id, v_organizer_id, 'credit', NEW.net_amount, 
            'Vote payment for ' || NEW.votes_purchased || ' votes',
            NEW.id, v_new_balance);
    
    -- Update event revenue
    UPDATE public.events 
    SET total_revenue = total_revenue + NEW.gross_amount,
        updated_at = now()
    WHERE id = NEW.event_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_receipt_paid
  AFTER UPDATE ON public.vote_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_vote_payment();

-- ============================================================================
-- PART 7: Function to process withdrawal (debit account)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_balance DECIMAL(12, 2);
  v_new_balance DECIMAL(12, 2);
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Verify sufficient balance
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.accounts WHERE user_id = NEW.user_id;
    
    IF v_balance < NEW.net_amount THEN
      RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_balance, NEW.net_amount;
    END IF;
    
    -- Update account
    v_new_balance := v_balance - NEW.net_amount;
    
    UPDATE public.accounts
    SET balance = v_new_balance,
        total_withdrawn = total_withdrawn + NEW.net_amount,
        updated_at = now()
    WHERE id = v_account_id;
    
    -- Create transaction record
    INSERT INTO public.transactions (account_id, user_id, type, amount, description, withdrawal_id, balance_after)
    VALUES (v_account_id, NEW.user_id, 'debit', NEW.net_amount,
            'Withdrawal via ' || NEW.payment_method,
            NEW.id, v_new_balance);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_withdrawal_completed
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.process_withdrawal();

-- ============================================================================
-- PART 8: Helper function to get available balance
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_available_balance(p_user_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_balance DECIMAL(12, 2);
  v_pending DECIMAL(12, 2);
BEGIN
  SELECT balance INTO v_balance FROM public.accounts WHERE user_id = p_user_id;
  
  SELECT COALESCE(SUM(net_amount), 0) INTO v_pending
  FROM public.withdrawals
  WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'processing');
  
  RETURN COALESCE(v_balance, 0) - v_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 9: Auto-create account on signup (update existing trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, 'organizer', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create account
  INSERT INTO public.accounts (user_id, balance, total_earned, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 10: Migrate existing users
-- ============================================================================

INSERT INTO public.accounts (user_id, balance, total_earned, total_withdrawn)
SELECT id, 0, 0, 0 FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.accounts)
ON CONFLICT (user_id) DO NOTHING;