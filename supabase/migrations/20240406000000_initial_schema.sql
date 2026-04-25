-- Beteseb Initial Schema

-- Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  birth_date date not null,
  birth_time time not null,
  location text,
  gender text,
  religion text,
  education text,
  job text,
  height numeric,
  marital_status text,
  children_count integer default 0,
  living_arrangement text,
  star_sign text,
  
  -- Psychology Quiz Fields
  finance_habit text,
  conflict_resolution text,
  family_value text,
  
  -- Preferences
  partner_age_range_min integer default 18,
  partner_age_range_max integer default 100,
  partner_religion text[],
  partner_education text[],
  partner_children_choice text,
  future_children_intent text,
  
  avatar_url text,
  is_onboarded boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Verifications Table
create table public.verifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  doc_type text check (doc_type in ('id', 'passport', 'dl')),
  id_url text, 
  selfie_url text,
  status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
  badge_issued boolean default false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings Table (Global/Admin)
create table public.settings (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users not null,
  social_links jsonb default '{"tiktok": "", "youtube": "", "facebook": "", "telegram": "", "whatsapp": ""}'::jsonb,
  payment_gateways jsonb default '{}'::jsonb,
  cms_content jsonb default '{"hero_title": "Beteseb (ቤተሰብ)", "hero_subtitle": "Global Ethiopian Marriage Matching"}'::jsonb,
  footer_links jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Community Feed Table
create table public.community_posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table (Text Only)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

alter table public.verifications enable row level security;
create policy "Users can view own verification." on public.verifications for select using (auth.uid() = user_id);
create policy "Users can insert own verification." on public.verifications for insert with check (auth.uid() = user_id);

alter table public.community_posts enable row level security;
create policy "Approved posts are viewable by everyone." on public.community_posts for select using (is_approved = true or auth.uid() = author_id);
create policy "Users can create posts." on public.community_posts for insert with check (auth.uid() = author_id);

alter table public.messages enable row level security;
create policy "Users can read own messages." on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages." on public.messages for insert with check (auth.uid() = sender_id);
