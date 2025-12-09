-- Fix allowed_emails: Replace public policy with authenticated check
DROP POLICY IF EXISTS "Anyone can check if email is allowed" ON public.allowed_emails;

-- Only allow authenticated users to check if their own email is in the whitelist
-- And allow unauthenticated users to check during signup (via service role in edge function if needed)
CREATE POLICY "Users can check their own email" 
ON public.allowed_emails 
FOR SELECT 
USING (lower(email) = lower(auth.email()));

-- Add UPDATE policy for profiles table
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);