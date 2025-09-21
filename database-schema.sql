-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    rating TEXT CHECK (rating IN ('like', 'dislike'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_device_id ON public.chats(device_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for device-based access
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (true); -- We'll filter by device_id in the application

CREATE POLICY "Users can insert their own chats" ON public.chats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own chats" ON public.chats
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own chats" ON public.chats
    FOR DELETE USING (true);

CREATE POLICY "Users can view messages from their chats" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update messages" ON public.messages
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete messages" ON public.messages
    FOR DELETE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for chats table
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
