-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy".
-- Required when RLS is enabled on gmt2_submissions and the app uses the anon key to insert.
-- If a policy already exists, run the DROP lines below first (uncomment), then run this again.

-- DROP POLICY IF EXISTS "Allow anon insert on gmt2_submissions" ON gmt2_submissions;
-- DROP POLICY IF EXISTS "Allow anon select on gmt2_submissions" ON gmt2_submissions;

-- Allow anonymous inserts (used by Vercel serverless with anon key)
CREATE POLICY "Allow anon insert on gmt2_submissions"
ON gmt2_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Optional: allow anon to read rows (e.g. for a data export page using anon)
CREATE POLICY "Allow anon select on gmt2_submissions"
ON gmt2_submissions
FOR SELECT
TO anon
USING (true);
