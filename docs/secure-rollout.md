# Secure rollout before sharing invitations

The public browser key is meant to be visible. The database rules and photo
function below ensure it cannot be used to list all guests or retrieve photos.

## One-time Supabase setup

1. In Supabase Dashboard, open **Authentication > Users** and create the
   couple's email/password user. Use an email only the couple controls.
2. Open **SQL Editor** and run `database/secure-invitations.sql`.
3. In SQL Editor, add that user as the only dashboard admin. Replace the email:

   ```sql
   insert into public.wedding_admins(user_id)
   select id from auth.users where email = 'YOUR-LOGIN-EMAIL'
   on conflict (user_id) do nothing;
   ```

4. Install the Supabase CLI if needed, then from the repository folder:

   ```text
   supabase login
   supabase link --project-ref weqylbliaqupnrixsvyf
   supabase functions deploy guest-photos --no-verify-jwt
   ```

   The function reads the platform's secret API key only on the server. Never
   copy a secret/service-role key into the website or GitHub repository.
5. Because the previous public policy allowed listing invitation tokens, rotate
   them once before sending links. This invalidates any old links:

   ```sql
   update public.guests
   set invite_token = encode(gen_random_bytes(16), 'hex')
   where active = true;
   ```

6. After the migration and function are live, publish the updated site code.
   Sign in at `admin.html`, confirm guest names/links load, then test one guest
   link in a private browser window, RSVP, and selfie upload.

The migration closes public table reads, adds a private couple sign-in, and
routes guest photo reads/uploads through a token-checked Edge Function. Existing
photos remain visible to the signed-in couple; the private read policy no
longer allows anonymous storage access.

## Free-plan availability

Supabase Free can pause a project after a week of low database activity. Guest
visits that load an invitation make real database requests. Check the Supabase
project weekly and before the wedding, and respond to any pause warning email.
If it pauses, resume it in the Supabase Dashboard. A paid plan is the only
option that guarantees no inactivity pause.
