-- Migration: Drop transactions, vote_receipts, and withdrawals tables
-- Created: 2026-04-17

-- ============================================================================
-- PART 1: Drop triggers that reference the tables
-- ============================================================================

DROP TRIGGER IF EXISTS on_vote_receipt_paid ON public.vote_receipts;
DROP TRIGGER IF EXISTS on_withdrawal_completed ON public.withdrawals;

-- ============================================================================
-- PART 2: Drop functions that reference the tables
-- ============================================================================

DROP FUNCTION IF EXISTS public.process_vote_payment();
DROP FUNCTION IF EXISTS public.process_withdrawal();
DROP FUNCTION IF EXISTS public.get_available_balance(UUID);

-- ============================================================================
-- PART 3: Drop tables (CASCADE to handle foreign key dependencies)
-- ============================================================================

DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.vote_receipts CASCADE;

-- ============================================================================
-- PART 4: Drop custom types
-- ============================================================================

DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS withdrawal_status;

-- ============================================================================
-- PART 5: Update handle_new_user function (remove account creation)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile only
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, 'organizer', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: Drop accounts table and related objects
-- ============================================================================

DROP TABLE IF EXISTS public.accounts CASCADE;