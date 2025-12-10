import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-secret-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate secret key from header
    const secretKey = req.headers.get('x-secret-key');
    const SIGNUP_SECRET_KEY = Deno.env.get('SIGNUP_SECRET_KEY');
    
    if (!secretKey || !SIGNUP_SECRET_KEY || secretKey !== SIGNUP_SECRET_KEY) {
      console.error('Invalid or missing secret key');
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid secret key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { selfieImage, additionalContext, isUncensored } = await req.json();

    if (!selfieImage) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a caption writer for a content creator's selfies. Your job is to write engaging, personal captions that models send to their fans on platforms like FanVue and OnlyFans.

CRITICAL RULES:
- Write the caption as if the MODEL is speaking directly to their fan
- Keep it personal and intimate, like a private message to someone special
- Make it feel like a one-on-one moment, not a broadcast
- All lowercase, casual texting style
- EMOJI PLACEMENT: Only add emojis at the VERY END of the caption, NEVER in the middle of sentences
- Keep captions concise (1-3 sentences max)
${isUncensored ? `
- UNCENSORED MODE: Be sexually suggestive and flirty
- Use explicit language when appropriate (ass, tits, etc.)
- Be seductive and provocative
- Reference the photo's sexiness directly` : `
- Keep it flirty but tasteful
- Suggestive without being explicit
- Tease and imply rather than state directly`}

ANALYZE THE SELFIE:
- What is the person wearing?
- What's the setting/background?
- What's the pose/expression?
- What mood does it convey?

Write a caption that acknowledges what's in the photo and creates a personal connection with the fan.`;

    console.log('Generating caption for selfie, uncensored:', isUncensored);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate a caption for this selfie.${additionalContext ? `\n\nAdditional context from the model: ${additionalContext}` : ''}\n\nReturn ONLY the caption text, nothing else.`
              },
              {
                type: "image_url",
                image_url: {
                  url: selfieImage
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content?.trim() || "";

    console.log('Generated caption:', caption);

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error generating caption:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate caption";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
