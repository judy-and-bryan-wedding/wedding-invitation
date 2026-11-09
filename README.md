PRIVATE WEDDING INVITATION WEBSITE
==================================

WHAT IS NEW
-----------
1. Each guest receives one private invitation link:
   https://your-domain.com/?invite=SECRET_TOKEN

2. The guest page automatically shows:
   - Their own name
   - Their personal invitation
   - Their own uploaded photos only

3. Their name is automatically printed onto the ACTUAL saved selfie image.

4. The couple has admin.html:
   - Add guest names
   - Automatically create private invitation tokens
   - Copy each personalized invitation link
   - View all guests' uploaded photos

5. Dress code palettes:
   LADIES:
   dark sage -> sage -> soft sage -> pale sage

   GENTLEMEN:
   pale blue-gray -> soft slate -> slate blue -> deep slate blue

PROJECT STRUCTURE
-----------------
index.html                         Guest-facing invitation
admin.html                         Couple/admin gallery
assets/css/style.css               Site design
assets/js/script.js                Guest page + camera + private gallery
assets/js/admin.js                 Guest management + all-photo gallery
assets/js/config.js                Couple/event + Supabase configuration
assets/images/attire/              Attire inspiration galleries
assets/images/references/          Color-palette reference images
database/supabase-setup.sql        Database tables and starter RLS
database/add-seating-fields.sql    Optional seating-field migration
database/add-rsvp-fields.sql       RSVP migration for an existing database
docs/setup-guide.md                Detailed deployment instructions
docs/secure-rollout.md             Supabase privacy and launch steps
README.md                          This overview

IMPORTANT ABOUT PHOTO STORAGE
-----------------------------
The first version of the site was purely static.

A real "guest posts a photo and I can see it later" system requires a database
and cloud file storage. HTML/CSS alone cannot permanently store photos across
different phones. This project is prepared for Supabase.

SUPABASE SETUP
--------------
1. Go to Supabase and create a project.
2. Open Project Settings / API.
3. Copy:
   - Project URL
   - anon/public key
4. Paste both into assets/js/config.js.
5. Open SQL Editor and run database/supabase-setup.sql.
6. Open Storage and create a PRIVATE bucket named:
   wedding-photos

Before sharing guest links, complete docs/secure-rollout.md. It closes public
guest-list/photo reads and sets up couple-only admin access.

If the database was created before RSVP support was added, also run:
database/persist-rsvp-responses.sql

This migration lets each private invite link retrieve and save its guest's
answer in Supabase. The saved answer is shown again on any browser or device,
and the first answer is final. Run it in Supabase SQL Editor before sharing
links when upgrading an existing database.

SECURITY NOTE
-------------
The included site demonstrates token-based personalized invitations.
For a real deployment, the strongest setup is:

Guest browser
  -> Supabase Edge Function
  -> validates invite token
  -> uploads/returns only that guest's photos

Admin
  -> Supabase Auth login
  -> sees all guest records/photos

That prevents guests from inspecting the public browser key and querying data
outside their own invitation.

The secure rollout uses an Edge Function for guest photo access and Supabase
Auth for the couple dashboard.

CAMERA
------
Camera requires HTTPS or localhost.

Use GitHub Pages/Netlify/Vercel/Cloudflare Pages for the website frontend.
For actual database/photo upload, configure Supabase as described above.


LATEST UPDATE
-------------
- Camera preview now automatically fits within the phone screen.
- Full mobile responsive rescaling was improved.
- Camera controls stack neatly on narrow phones.
- Filter list is scrollable on desktop but expands naturally on mobile.
- Added more selfie filters:
  * Garden flowers
  * Kissing love birds
  * Floral arch
  * Rings & roses
  * Existing RSVP / honor / celebration frames
- Decorations are drawn onto the saved selfie, not only shown in preview.
- Admin page now includes a Supabase Configuration panel.
- Admin can paste Project URL + anon/public key and save it in the browser.

IMPORTANT ABOUT ADMIN SUPABASE SETTINGS
---------------------------------------
A static website cannot rewrite assets/js/config.js on the web server from the browser.

The admin configuration form therefore stores the Supabase values in the
ADMIN BROWSER using localStorage.

For your actual published wedding site, place the SAME Supabase Project URL
and anon/public key in assets/js/config.js so every invited guest's phone can connect.


ADDITIONAL UPDATE
-----------------
- Camera preview size was reduced further so it fits better on desktop and mobile screens.
- Couple names on the invitation now use a calligraphy font (Great Vibes).
