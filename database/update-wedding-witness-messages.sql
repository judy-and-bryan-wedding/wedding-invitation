-- Run this if the guest rows were already added before the witness messages
-- were updated in add-wedding-guests.sql.

update public.guests
set message = 'Your support means so much to us. We are honored to have you as one of our wedding witnesses.'
where name in ('Spencer Sze', 'Marc Andrew Tan', 'Lorna Gotardo', 'Felicidad Abizo');
