-- RLS Policy: Allow event creators to update voting dates only for approved events
-- This allows organizers to start/stop voting once their event is approved

-- First, create a function to validate only voting dates are being modified on approved events
CREATE OR REPLACE FUNCTION validate_event_update_on_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Organizer (non-admin) restrictions
    IF OLD.created_by = auth.uid() THEN
        -- Block voting date changes if event is pending
        IF OLD.approval_status = 'pending' THEN
            IF OLD.voting_start_date IS DISTINCT FROM NEW.voting_start_date OR
               OLD.voting_end_date IS DISTINCT FROM NEW.voting_end_date THEN
                RAISE EXCEPTION 'Cannot start voting until event is approved by admin.';
            END IF;
        END IF;
        
        -- On approved events, only allow voting date changes
        IF OLD.approval_status = 'approved' THEN
            IF OLD.event_name IS DISTINCT FROM NEW.event_name OR
               OLD.event_description IS DISTINCT FROM NEW.event_description OR
               OLD.event_image_url IS DISTINCT FROM NEW.event_image_url OR
               OLD.amount_per_vote IS DISTINCT FROM NEW.amount_per_vote OR
               OLD.service_fee IS DISTINCT FROM NEW.service_fee OR
               OLD.enable_nominations IS DISTINCT FROM NEW.enable_nominations OR
               OLD.enable_voting IS DISTINCT FROM NEW.enable_voting OR
               OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
                RAISE EXCEPTION 'Cannot modify event details after approval. Only voting dates can be updated.';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce the restriction
DROP TRIGGER IF EXISTS enforce_approved_event_restrictions ON events;

CREATE TRIGGER enforce_approved_event_restrictions
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION validate_event_update_on_approved();

-- Update the existing "Users can update their own pending events" policy
-- to also allow updating voting dates on approved events
DROP POLICY IF EXISTS "Users can update their own pending events" ON events;

CREATE POLICY "Users can update their own events"
    ON events
    FOR UPDATE
    USING (
        auth.uid() = created_by 
        AND is_active = TRUE
    )
    WITH CHECK (
        auth.uid() = created_by 
        AND is_active = TRUE
    );
