import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Max 5 attempts per window

function getRateLimitKey(req: Request): string {
  // Get client IP from various headers (Cloudflare, proxies, etc.)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || realIP || forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);
  
  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(clientIP);
  }
  
  const currentRecord = rateLimitStore.get(clientIP);
  
  if (!currentRecord) {
    // First request from this IP
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (currentRecord.count >= MAX_ATTEMPTS) {
    const resetIn = currentRecord.resetTime - now;
    return { allowed: false, remaining: 0, resetIn };
  }
  
  // Increment count
  currentRecord.count++;
  rateLimitStore.set(clientIP, currentRecord);
  
  return { 
    allowed: true, 
    remaining: MAX_ATTEMPTS - currentRecord.count, 
    resetIn: currentRecord.resetTime - now 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limit first
    const clientIP = getRateLimitKey(req);
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Too many attempts. Please try again later.",
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000))
        },
      });
    }

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

    // Compare secret keys
    const isValid = secretKey === SIGNUP_SECRET_KEY;

    if (!isValid) {
      console.warn(`Failed login attempt from IP: ${clientIP}`);
    } else {
      console.log('Secret key validation: success');
    }

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
