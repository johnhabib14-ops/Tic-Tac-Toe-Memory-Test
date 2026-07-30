-- Run in Supabase SQL Editor when RLS is enabled on rit_submissions.
-- Ensure the table exists first (run rit_submissions_table.sql).

CREATE POLICY "Allow anon insert on rit_submissions"
ON rit_submissions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon select on rit_submissions"
ON rit_submissions
FOR SELECT
TO anon
USING (true);
