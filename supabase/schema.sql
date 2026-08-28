-- Supabase SQL Schema for Brand My Guitar (Bidding Model)

-- 1. Create zones table
create table if not exists zones (
  id text primary key,               -- e.g. 'headstock', 'upper-bout-left'
  name text not null,
  size text not null,                -- 'small' | 'medium' | 'large'
  min_bid_cents integer not null,
  current_bid_cents integer,
  bids_count integer default 0,
  brand_name text,
  website_url text,
  logo_url text,
  top_bidder_email text,
  created_at timestamptz default now()
);

-- 2. Create bids table
create table if not exists bids (
  id text primary key,
  zone_id text references zones(id),
  bidder_name text not null,
  bidder_email text not null,
  website_url text not null,
  logo_url text not null,
  amount_cents integer not null,
  deposit_cents integer not null,
  stripe_payment_intent_id text,
  stripe_session_id text,
  status text not null default 'active', -- active | outbid | won
  refunded boolean default false,
  created_at timestamptz default now()
);

-- 3. Create campaign table
create table if not exists campaign (
  id int primary key default 1,
  goal_cents integer not null default 200000,
  raised_cents integer not null default 0,
  ends_at timestamptz not null default (now() + interval '14 days'),
  currency text not null default 'EUR'
);

-- 4. Seed campaign
insert into campaign (id, goal_cents, raised_cents, currency) 
values (1, 200000, 34000, 'EUR')
on conflict (id) do nothing;

-- 5. Seed zones
insert into zones (id, name, size, min_bid_cents) values
  ('headstock', 'Headstock', 'small', 10000),
  ('upper-bout-left', 'Upper Left Body', 'medium', 15000),
  ('upper-bout-right', 'Upper Right Body', 'medium', 15000),
  ('pickguard', 'Pickguard', 'medium', 20000),
  ('lower-bout-left', 'Lower Left Body', 'large', 25000),
  ('lower-bout-right', 'Lower Right Body', 'large', 25000),
  ('bottom-center', 'Bottom Center', 'medium', 20000)
on conflict (id) do update set
  name = excluded.name,
  size = excluded.size,
  min_bid_cents = excluded.min_bid_cents;

-- 6. Row level security
alter table zones enable row level security;
alter table bids enable row level security;
alter table campaign enable row level security;

create policy "public read zones" on zones for select using (true);
create policy "public read bids" on bids for select using (true);
create policy "public read campaign" on campaign for select using (true);

-- Enable Realtime
alter publication supabase_realtime add table zones;
alter publication supabase_realtime add table bids;
alter publication supabase_realtime add table campaign;
