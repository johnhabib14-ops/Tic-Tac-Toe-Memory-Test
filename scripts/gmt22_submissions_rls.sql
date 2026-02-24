-- Run this in Supabase SQL Editor when RLS is enabled on gmt22_submissions.
-- Fixes 502 "new row violates row-level security policy for table gmt22_submissions".
-- Ensure the table exists first (run gmt22_submissions_table.sql if needed).

-- DROP POLICY IF EXISTS "Allow anon insert on gmt22_submissions" ON gmt22_submissions;
-- DROP POLICY IF EXISTS "Allow anon select on gmt22_submissions" ON gmt22_submissions;

CREATE POLICY "Allow anon insert on gmt22_submissions"
ON gmt22_submissions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon select on gmt22_submissions"
ON gmt22_submissions
FOR SELECT
TO anon
USING (true);
