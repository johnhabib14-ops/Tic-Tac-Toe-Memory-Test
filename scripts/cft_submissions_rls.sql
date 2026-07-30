-- Run in Supabase SQL Editor when RLS is enabled on cft_submissions.

CREATE POLICY "Allow anon insert on cft_submissions"
ON cft_submissions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon select on cft_submissions"
ON cft_submissions
FOR SELECT
TO anon
USING (true);
