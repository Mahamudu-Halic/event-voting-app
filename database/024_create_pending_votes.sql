-- Migration: Create pending_votes table for USSD payment tracking
-- This table tracks votes initiated via USSD that are awaiting payment confirmation

CREATE TABLE IF NOT EXISTS public.pending_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference IDs
    reference TEXT NOT NULL UNIQUE,  -- Paystack payment reference
    nominee_id UUID NOT NULL REFERENCES public.nominees(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    -- Vote details
    votes_count INTEGER NOT NULL CHECK (votes_count > 0),
    amount DECIMAL(12, 2) NOT NULL,  -- Total amount in GHS
    
    -- User info
    msisdn TEXT NOT NULL,  -- Phone number in international format
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    paystack_reference TEXT,  -- Final Paystack reference after completion
    
    -- Metadata for reconstruction
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pending_votes_reference ON public.pending_votes(reference);
CREATE INDEX IF NOT EXISTS idx_pending_votes_status ON public.pending_votes(status);
CREATE INDEX IF NOT EXISTS idx_pending_votes_nominee ON public.pending_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_pending_votes_event ON public.pending_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_pending_votes_msisdn ON public.pending_votes(msisdn);

-- RLS Policies
ALTER TABLE public.pending_votes ENABLE ROW LEVEL SECURITY;

-- Admins can view all pending votes
CREATE POLICY "Admins can view all pending votes"
    ON public.pending_votes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Event organizers can view pending votes for their events
CREATE POLICY "Organizers can view pending votes for their events"
    ON public.pending_votes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = pending_votes.event_id 
        AND events.created_by = auth.uid()
    ));

-- System can insert/update pending votes (via service role)
CREATE POLICY "Service role can manage pending votes"
    ON public.pending_votes FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.pending_votes TO authenticated;
GRANT INSERT, UPDATE ON public.pending_votes TO service_role;
