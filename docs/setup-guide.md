ZERO-COST DEPLOYMENT GUIDE
==========================

STACK
-----
Frontend:
GitHub Pages - Free

Backend:
Supabase Free

Your PC does NOT have to stay on.

Before sending invitations, complete `docs/secure-rollout.md`. It sets up
private guest data, couple sign-in, and secure photo access.

==================================================
PART 1 - CREATE SUPABASE PROJECT
==================================================

1. Create a free Supabase account.
2. Create a new project.
3. Save your database password somewhere safe.
4. Wait for the project to finish setting up.

==================================================
PART 2 - GET YOUR PROJECT DETAILS
==================================================

Inside Supabase, locate your project API settings.

Copy ONLY:
- Project URL
- Publishable / anon key

DO NOT use:
- service_role key
- secret key

Open assets/js/config.js.

Replace:

PASTE_YOUR_SUPABASE_PROJECT_URL_HERE

and:

PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE

with your real values.

==================================================
PART 3 - CREATE DATABASE
==================================================

Open:

Supabase > SQL Editor

Create a new query.

Paste EVERYTHING from:

database/supabase-setup.sql

Click Run.

This creates:

guests
guest_photos

It also enables personalized RSVP responses and optional guest notes.

If you already created the database using an older version of the setup file,
run database/add-rsvp-fields.sql once in the SQL Editor instead.

If RSVP was already enabled before permanent responses were added, also run
database/lock-rsvp-responses.sql once. The first submitted Accept or Decline
will then be final. Each guest's answer, note, and response time appear in
admin.html and in the Supabase guests table.

It also creates the database-side maximum:
3 photos per guest.

==================================================
PART 4 - CREATE PHOTO STORAGE
==================================================

Open:

Supabase > Storage

Create a bucket called EXACTLY:

wedding-photos

Set it to:

PRIVATE

Run `database/secure-invitations.sql` as described in the secure rollout guide.
It keeps the bucket private and restricts photo access.

==================================================
PART 5 - TEST A GUEST
==================================================

Open:

Supabase > Table Editor > guests

Insert a row.

Example:

name:
Anna Santos

message:
We would love to celebrate our wedding with you.

active:
true

Leave generated fields alone.

After saving, copy Anna's invite_token.

Her website URL becomes:

https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/?invite=THE_TOKEN

==================================================
PART 6 - GITHUB PAGES
==================================================

1. Create a new GitHub repository.

Example:

wedding-invitation

2. Upload these website files into the repository.

3. Open:

Repository > Settings > Pages

4. Under Build and deployment choose:

Source:
Deploy from a branch

Branch:
main

Folder:
/ (root)

5. Save.

GitHub will give you an address such as:

https://yourusername.github.io/wedding-invitation/

==================================================
GUEST LINKS
==================================================

Each guest gets the same website but a different token.

Example:

Anna:
https://yourusername.github.io/wedding-invitation/?invite=abc123

Juan:
https://yourusername.github.io/wedding-invitation/?invite=xyz789

Each link automatically loads that guest's name.

==================================================
PHOTO LIMIT
==================================================

Every guest can upload:

MAXIMUM 3 PHOTOS

The website shows:

0 / 3 photos uploaded
1 / 3 photos uploaded
2 / 3 photos uploaded
3 / 3 photos uploaded · Gallery complete

The frontend blocks a fourth photo.

Supabase ALSO blocks a fourth database entry.

==================================================
IMPORTANT
==================================================

The current guest-token approach is appropriate for a small private event,
but it is not equivalent to authenticated user accounts.

Do not place confidential information on the guest records.

Never expose a Supabase service-role/secret key in GitHub.
Only the frontend publishable/anon key belongs in assets/js/config.js.
