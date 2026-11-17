-- Remove duplicate copies created by rerunning add-wedding-guests.sql.
-- Keeps the earliest-created guest row for each matching name and reservation.
-- Review the result before running if any duplicate row already has an RSVP
-- or uploaded photos; deleting a guest can also remove related photo records.

begin;

with ranked_guests as (
  select id,
         row_number() over (
           partition by name, reservation_number
           order by created_at asc, id asc
         ) as duplicate_rank
  from public.guests
  where reservation_number between 'R-01' and 'R-50'
)
delete from public.guests guest
using ranked_guests ranked
where guest.id = ranked.id
  and ranked.duplicate_rank > 1;

commit;
