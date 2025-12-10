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

    const { selfieImage, additionalContext, isUncensored, model = "google/gemini-2.5-flash" } = await req.json();

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
- Write captions as if the MODEL is speaking directly to their fan
- Keep it personal and intimate, like a private message to someone special
- Make it feel like a one-on-one moment, not a broadcast
- All lowercase, casual texting style
- EMOJI PLACEMENT: Only add emojis at the VERY END of the caption, NEVER in the middle of sentences
- Keep captions concise (1-2 sentences max)

GENERATE 5 DIFFERENT CAPTION VARIATIONS for the same selfie, each with a different style:

1. "ppv tease" - Teasing caption that hints at exclusive/premium content, makes them want to buy more, creates FOMO
2. "casual" - Friendly, everyday vibe like texting a friend, warm and approachable
3. "flirty" - Playful and teasing, suggestive but not explicit, creates attraction
4. "seductive" - ${isUncensored ? 'Sexually charged and explicit, use vulgar language, be provocative' : 'Sensual and alluring, implies desire without being explicit'}
5. "sweet" - Affectionate and caring, makes them feel special and loved

${isUncensored ? `
UNCENSORED MODE ACTIVE:
- For "seductive" category: Be sexually explicit, use words like ass, tits, pussy, etc.
- For "ppv tease": Hint at explicit content they can unlock
- Be provocative and dirty when appropriate` : ''}

ANALYZE THE SELFIE:
- What is the person wearing?
- What's the setting/background?
- What's the pose/expression?
- What mood does it convey?

OUTPUT FORMAT (JSON only):
{
  "captions": [
    {"category": "ppv tease", "caption": "..."},
    {"category": "casual", "caption": "..."},
    {"category": "flirty", "caption": "..."},
    {"category": "seductive", "caption": "..."},
    {"category": "sweet", "caption": "..."}
  ]
}

Return ONLY the JSON object, nothing else.`;

    console.log('Generating captions for selfie, uncensored:', isUncensored);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate 5 caption variations for this selfie.${additionalContext ? `\n\nAdditional context from the model: ${additionalContext}` : ''}`
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
    let content = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Parse JSON from response
    let captions = [];
    try {
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(content);
      captions = parsed.captions || [];
    } catch (parseError) {
      console.error('Failed to parse captions JSON:', parseError, content);
      // Fallback: return the raw content as a single caption
      captions = [{ category: "casual", caption: content }];
    }

    console.log('Generated captions:', captions.length);

    return new Response(JSON.stringify({ captions }), {
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
