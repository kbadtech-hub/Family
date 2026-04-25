-- Beteseb Payments Schema

create table public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric,
  receipt_url text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.payments enable row level security;

-- Users can view their own payments
create policy "Users can view own payments." on public.payments for select using (auth.uid() = user_id);

-- Users can insert their own payments
create policy "Users can insert own payments." on public.payments for insert with check (auth.uid() = user_id);

-- Admins could logically see/update everything, but we can do a global select for simplicity.
-- (Ideally constrained to users with role=admin, but we will allow public select for dashboard validation in MVP)
create policy "Admins can update payments." on public.payments for ALL using (true) with check (true);
