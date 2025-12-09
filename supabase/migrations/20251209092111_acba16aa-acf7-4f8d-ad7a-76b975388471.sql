-- Drop the restrictive policy and create one that allows checking during signup
DROP POLICY IF EXISTS "Users can check their own email" ON public.allowed_emails;

-- Allow checking email during signup (before auth) but only for exact email match
-- This uses a function to safely check without exposing the full list
CREATE OR REPLACE FUNCTION public.is_email_allowed(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails 
    WHERE lower(email) = lower(check_email)
  );
$$;

-- Grant execute to anon role for signup checking
GRANT EXECUTE ON FUNCTION public.is_email_allowed(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(text) TO authenticated;