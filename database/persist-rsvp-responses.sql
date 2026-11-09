-- Run this in Supabase SQL Editor to enable permanent, cross-device RSVPs.
-- Safe to run more than once. Each guest's first answer is final.

alter table public.guests
  add column if not exists rsvp_status text not null default 'pending',
  add column if not exists rsvp_note text,
  add column if not exists rsvp_responded_at timestamptz;

alter table public.guests drop constraint if exists guests_rsvp_status_check;
alter table public.guests add constraint guests_rsvp_status_check
  check (rsvp_status in ('pending', 'accepted', 'declined'));

alter table public.guests drop constraint if exists guests_rsvp_note_length_check;
alter table public.guests add constraint guests_rsvp_note_length_check
  check (rsvp_note is null or char_length(rsvp_note) <= 500);

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

create or replace function public.submit_guest_rsvp(
  p_invite_token text,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql security definer
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
  set rsvp_status = p_status,
      rsvp_note = nullif(trim(p_note), ''),
      rsvp_responded_at = now()
  where invite_token = p_invite_token
    and active = true
    and rsvp_status = 'pending';

  return found;
end;
$$;
revoke all on function public.submit_guest_rsvp(text, text, text) from public;
grant execute on function public.submit_guest_rsvp(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
