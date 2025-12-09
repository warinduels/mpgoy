-- Add a minimal SELECT policy that denies direct table access
-- Users must use the is_email_allowed function instead
CREATE POLICY "No direct access to allowed_emails" 
ON public.allowed_emails 
FOR SELECT 
USING (false);