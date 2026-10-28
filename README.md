# Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `schema.sql`.
3. In Project Settings -> API, copy the Project URL and anon/publishable key.
4. Put those values into `assets/js/supabase-client.js`.
5. Configure Authentication providers and allowed redirect URLs.
6. Set up Storage buckets and storage policies if listings need image uploads.
7. Add an admin role using a trusted server-side workflow (for example, app_metadata managed by a server/Edge Function). Never let users grant themselves admin access.
8. Test all Row Level Security policies using separate anonymous, seller, and admin accounts before production.

The current website bundle had no Supabase integration. This folder is a starter scaffold, not a claim that the current frontend is already connected. Review schema columns and policies against the app's actual forms and intended permissions.
