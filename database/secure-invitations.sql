-- Secure guest data, the couple dashboard, and private selfie storage.
-- Run this in Supabase SQL Editor after creating the couple's Auth user.

create table if not exists public.wedding_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.wedding_admins enable row level security;
revoke all on public.wedding_admins from anon, authenticated;
grant select on public.wedding_admins to authenticated;
drop policy if exists "admins can read own membership" on public.wedding_admins;
create policy "admins can read own membership"
on public.wedding_admins for select to authenticated
using (user_id = auth.uid());

create or replace function public.is_wedding_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.wedding_admins where user_id = auth.uid());
$$;
revoke all on function public.is_wedding_admin() from public;
grant execute on function public.is_wedding_admin() to authenticated;

create or replace function public.get_guest_by_invite_token(p_invite_token text)
returns table (
  id uuid,
  name text,
  message text,
  reservation_number text,
  table_number integer,
  seat_number integer,
  rsvp_status text,
  rsvp_note text,
  rsvp_responded_at timestamptz
)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select g.id, g.name, g.message, g.reservation_number, g.table_number,
         g.seat_number, g.rsvp_status, g.rsvp_note, g.rsvp_responded_at
  from public.guests g
  where g.invite_token = p_invite_token and g.active = true
  limit 1;
$$;
revoke all on function public.get_guest_by_invite_token(text) from public;
grant execute on function public.get_guest_by_invite_token(text) to anon, authenticated;

create or replace function public.count_guest_photos_by_invite_token(p_invite_token text)
returns bigint
language sql stable security definer
set search_path = public, pg_temp
as $$
  select count(*)
  from public.guest_photos p
  join public.guests g on g.id = p.guest_id
  where p.invite_token = p_invite_token and g.active = true;
$$;
revoke all on function public.count_guest_photos_by_invite_token(text) from public;
grant execute on function public.count_guest_photos_by_invite_token(text) to anon, authenticated;

-- The three-photo trigger must count rows even when called by the anonymous
-- guest upload function, which is why it runs with the table owner's rights.
create or replace function public.limit_guest_to_three_photos()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if (select count(*) from public.guest_photos where guest_id = new.guest_id) >= 3 then
    raise exception 'Maximum of 3 photos allowed per guest';
  end if;
  return new;
end;
$$;

alter table public.guests enable row level security;
alter table public.guest_photos enable row level security;

drop policy if exists "anon can read active guests" on public.guests;
drop policy if exists "couple manages guests" on public.guests;
create policy "couple manages guests"
on public.guests for all to authenticated
using (public.is_wedding_admin())
with check (public.is_wedding_admin());

drop policy if exists "anon can insert own photos" on public.guest_photos;
drop policy if exists "anon can read own photos" on public.guest_photos;
drop policy if exists "couple reads guest photos" on public.guest_photos;
create policy "couple reads guest photos"
on public.guest_photos for select to authenticated
using (public.is_wedding_admin());

revoke all on public.guests from anon, authenticated;
grant select, insert, update, delete on public.guests to authenticated;
revoke all on public.guest_photos from anon, authenticated;
grant select on public.guest_photos to authenticated;

-- RSVP updates already use a token-validated SECURITY DEFINER function.
revoke all on function public.submit_guest_rsvp(text, text, text) from public;
grant execute on function public.submit_guest_rsvp(text, text, text) to anon, authenticated;

-- Keep the bucket private. Guest image reads/uploads go through the Edge
-- Function, which validates the invite token before using the service key.
update storage.buckets set public = false where id = 'wedding-photos';
drop policy if exists "wedding photo uploads" on storage.objects;
drop policy if exists "wedding photo reads" on storage.objects;
drop policy if exists "couple manages wedding photos" on storage.objects;
create policy "couple manages wedding photos"
on storage.objects for all to authenticated
using (bucket_id = 'wedding-photos' and public.is_wedding_admin())
with check (bucket_id = 'wedding-photos' and public.is_wedding_admin());

-- Create a couple account in Supabase Auth first, then add it as an admin:
-- insert into public.wedding_admins(user_id)
-- select id from auth.users where email = 'YOUR-LOGIN-EMAIL';
