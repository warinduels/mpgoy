import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey } = await req.json();
    
    if (!secretKey || typeof secretKey !== 'string') {
      return new Response(JSON.stringify({ valid: false, error: "Secret key is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SIGNUP_SECRET_KEY = Deno.env.get('SIGNUP_SECRET_KEY');
    
    if (!SIGNUP_SECRET_KEY) {
      console.error('SIGNUP_SECRET_KEY is not configured');
      return new Response(JSON.stringify({ valid: false, error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = secretKey === SIGNUP_SECRET_KEY;

    console.log('Secret key validation:', isValid ? 'success' : 'failed');

    return new Response(JSON.stringify({ valid: isValid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in validate-signup-key function:", error);
    return new Response(JSON.stringify({ valid: false, error: "Validation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
