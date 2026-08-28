-- Snooker App: initial schema
-- Run via `supabase db push` or the Supabase SQL editor.

-- 1. Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- 2. Wallets (never let clients write balance directly — only Edge Functions should)
create table wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance_cents bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table wallets enable row level security;

create policy "Users can view only their own wallet"
  on wallets for select using (auth.uid() = user_id);

-- No insert/update policy for regular users — writes happen only via
-- service-role Edge Functions (bet settlement, deposits, withdrawals).

-- 3. Challenges (send/accept/decline opponent requests)
create table challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references profiles(id) on delete cascade,
  opponent_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  stake_cents bigint not null check (stake_cents > 0),
  created_at timestamptz not null default now()
);

alter table challenges enable row level security;

create policy "Challenger or opponent can view a challenge"
  on challenges for select using (auth.uid() = challenger_id or auth.uid() = opponent_id);

create policy "Challenger can create a challenge"
  on challenges for insert with check (auth.uid() = challenger_id);

create policy "Opponent can respond to a challenge"
  on challenges for update using (auth.uid() = opponent_id);

-- 4. Matches (created once a challenge is accepted)
create table matches (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id),
  player_a uuid not null references profiles(id),
  player_b uuid not null references profiles(id),
  status text not null default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  winner_id uuid references profiles(id),
  stake_cents bigint not null,
  house_cut_cents bigint not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table matches enable row level security;

create policy "Matches are viewable by everyone"
  on matches for select using (true);

-- Match creation/completion should go through an Edge Function using the
-- service role, not direct client writes, to prevent result tampering.

-- 5. Spectator bets (side bets on an in-progress match)
create table spectator_bets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  bettor_id uuid not null references profiles(id),
  backed_player uuid not null references profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'open' check (status in ('open','won','lost','refunded')),
  created_at timestamptz not null default now()
);

alter table spectator_bets enable row level security;

create policy "Spectator bets are viewable by everyone"
  on spectator_bets for select using (true);

create policy "A user can place their own spectator bet"
  on spectator_bets for insert with check (auth.uid() = bettor_id);

-- 6. Ratings (1-5 stars + implicit win/loss pulled from matches)
create table ratings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  rater_id uuid not null references profiles(id),
  rated_player uuid not null references profiles(id),
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (match_id, rater_id, rated_player)
);

alter table ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on ratings for select using (true);

create policy "A user can rate an opponent from their own match"
  on ratings for insert with check (auth.uid() = rater_id);
