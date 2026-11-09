-- ===========================================================
-- SUNNY / WEDDING INVITATION - SUPABASE SETUP
-- GitHub Pages + Supabase Free
-- ===========================================================

create extension if not exists pgcrypto;

-- -----------------------------
-- TABLES
-- -----------------------------
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text default 'We would be honored to celebrate this beautiful day with you.',
  invite_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  invitation_url text generated always as (
    'https://judy-and-bryan-wedding.github.io/wedding-invitation/?invite=' || invite_token
  ) stored,
  active boolean not null default true,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'accepted', 'declined')),
  rsvp_note text check (rsvp_note is null or char_length(rsvp_note) <= 500),
  rsvp_responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.guest_photos (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  invite_token text not null,
  storage_path text not null unique,
  filter_name text,
  created_at timestamptz not null default now()
);

-- -----------------------------
-- MAXIMUM 3 PHOTOS PER GUEST
-- -----------------------------
create or replace function public.limit_guest_to_three_photos()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.guest_photos
    where guest_id = new.guest_id
  ) >= 3 then
    raise exception 'Maximum of 3 photos allowed per guest';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_three_photos on public.guest_photos;

create trigger enforce_three_photos
before insert on public.guest_photos
for each row
execute function public.limit_guest_to_three_photos();

-- -----------------------------
-- RLS
-- -----------------------------
alter table public.guests enable row level security;
alter table public.guest_photos enable row level security;

-- Anonymous guest access is intentionally not granted here. Run
-- database/secure-invitations.sql to add token-checked RPC access and the
-- authenticated couple dashboard without exposing the tables directly.

-- -----------------------------
-- GRANTS
-- -----------------------------
revoke all on table public.guests from anon;
revoke all on table public.guest_photos from anon;

-- Guests submit an RSVP through their private invitation token.
create or replace function public.submit_guest_rsvp(
  p_invite_token text,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('accepted', 'declined') then
    raise exception 'Invalid RSVP status';
  end if;

  if p_note is not null and char_length(trim(p_note)) > 500 then
    raise exception 'RSVP note is too long';
  end if;

  update public.guests
  set
    rsvp_status = p_status,
    rsvp_note = nullif(trim(p_note), ''),
    rsvp_responded_at = now()
  where invite_token = p_invite_token
    and active = true
    and rsvp_status = 'pending';

  return found;
end;
$$;

revoke all on function public.submit_guest_rsvp(text, text, text) from public;
grant execute on function public.submit_guest_rsvp(text, text, text) to anon;

-- -----------------------------
-- STORAGE POLICIES
-- IMPORTANT:
-- First create a PRIVATE bucket manually named:
-- wedding-photos
-- -----------------------------

-- Keep storage private. Photo upload and signed reads are handled by the
-- token-validating Edge Function in supabase/functions/guest-photos.


alter table public.guests
  add column if not exists reservation_number text,
  add column if not exists table_number integer,
  add column if not exists seat_number integer;

alter table public.guests drop constraint if exists guests_table_number_check;
alter table public.guests add constraint guests_table_number_check
check (table_number is null or table_number between 1 and 3);

alter table public.guests drop constraint if exists guests_seat_number_check;
alter table public.guests add constraint guests_seat_number_check
check (
  seat_number is null
  or (table_number = 1 and seat_number between 1 and 13)
  or (table_number = 2 and seat_number between 1 and 24)
  or (table_number = 3 and seat_number between 1 and 13)
);
