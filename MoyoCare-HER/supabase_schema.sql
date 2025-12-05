-- Create the journal_entries table
create table public.journal_entries (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  date date not null,
  content text null,
  mood text null,
  created_at timestamp with time zone not null default now(),
  constraint journal_entries_pkey primary key (id),
  constraint journal_entries_user_date_key unique (user_id, date),
  constraint journal_entries_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Enable Row Level Security (RLS)
alter table public.journal_entries enable row level security;

-- Create Policy: Users can only see their own entries
create policy "Users can view their own journal entries"
on public.journal_entries
for select
using (auth.uid() = user_id);

-- Create Policy: Users can insert their own entries
create policy "Users can insert their own journal entries"
on public.journal_entries
for insert
with check (auth.uid() = user_id);

-- Create Policy: Users can update their own entries
create policy "Users can update their own journal entries"
on public.journal_entries
for update
using (auth.uid() = user_id);
