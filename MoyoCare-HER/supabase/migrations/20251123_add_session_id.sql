-- Add session_id column to messages table (nullable first to handle existing data)
ALTER TABLE public.messages ADD COLUMN session_id UUID;

-- Add language column to track conversation language
ALTER TABLE public.messages
ADD COLUMN language VARCHAR(10) DEFAULT 'en';

-- Create index for faster session queries
CREATE INDEX idx_messages_session_user ON public.messages (
    session_id,
    user_id,
    created_at DESC
);

-- Now set default for future inserts
ALTER TABLE public.messages
ALTER COLUMN session_id
SET DEFAULT gen_random_uuid ();