-- Block anonymous/public access to profiles table
CREATE POLICY "Block public access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);