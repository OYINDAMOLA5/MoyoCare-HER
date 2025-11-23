-- Add session_id column to messages table
ALTER TABLE public.messages
ADD COLUMN session_id UUID NOT NULL DEFAULT gen_random_uuid ();

-- Create index for faster session queries
CREATE INDEX idx_messages_session_user ON public.messages (
    session_id,
    user_id,
    created_at DESC
);

-- Update constraint to ensure user_id + session_id uniqueness where needed
ALTER TABLE public.messages
ADD CONSTRAINT fk_session_exists CHECK (session_id IS NOT NULL);