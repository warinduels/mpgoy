import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-secret-key',
};

// Gemini API keys for rotation
const getGeminiApiKeys = () => {
  const keys = [
    Deno.env.get('GEMINI_API_KEY'),
    Deno.env.get('GEMINI_API_KEY_2'),
    Deno.env.get('GEMINI_API_KEY_3'),
    Deno.env.get('GEMINI_API_KEY_4'),
  ].filter(Boolean) as string[];
  return keys;
};

// Call Gemini with automatic key rotation for image analysis
async function callGeminiWithFallback(model: string, systemPrompt: string, userText: string, imageData: string) {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  const modelMap: Record<string, string> = {
    'google/gemini-2.5-flash': 'gemini-2.0-flash',
    'google/gemini-2.5-pro': 'gemini-2.0-flash',
    'google/gemini-2.5-flash-lite': 'gemini-2.0-flash',
    'google/gemini-3-pro-preview': 'gemini-2.0-flash',
  };

  const geminiModel = modelMap[model] || 'gemini-2.0-flash';
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    console.log(`Trying Gemini API key ${i + 1}/${keys.length}`);
    
    try {
      // Build parts array with text and image
      const parts: any[] = [{ text: userText }];
      
      // Extract base64 data from data URL
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inline_data: {
              mime_type: matches[1],
              data: matches[2]
            }
          });
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 1024,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Gemini API key ${i + 1} error:`, response.status, errorData);
        
        if (response.status === 429 || response.status === 403 || errorData.includes('RESOURCE_EXHAUSTED') || errorData.includes('quota')) {
          console.log(`Key ${i + 1} rate limited/quota exceeded, trying next key...`);
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("No response from Gemini");
      }

      console.log(`Successfully used Gemini API key ${i + 1}`);
      return text;
    } catch (error) {
      console.error(`Error with key ${i + 1}:`, error);
    }
  }
  
  // Fallback to OpenAI with vision
  console.log("All Gemini keys exhausted, trying OpenAI...");
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (OPENAI_API_KEY) {
    try {
      // Build content array for OpenAI vision
      const openaiContent: any[] = [{ type: "text", text: userText }];
      if (imageData.startsWith('data:')) {
        openaiContent.push({ type: "image_url", image_url: { url: imageData } });
      }
      
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: openaiContent }
          ],
          max_tokens: 1024,
          temperature: 0.9,
        }),
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        const result = openaiData.choices?.[0]?.message?.content;
        if (result) {
          console.log("Successfully used OpenAI vision fallback");
          return result;
        }
      } else {
        const errorText = await openaiResponse.text();
        console.error("OpenAI error:", openaiResponse.status, errorText);
      }
    } catch (openaiError) {
      console.error("OpenAI fallback failed:", openaiError);
    }
  }
  
  // Final fallback to Lovable AI Gateway
  console.log("OpenAI failed or not configured, falling back to Lovable AI Gateway");
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error("All API providers exhausted (Gemini, OpenAI, Lovable). Please add more API keys.");
  }
  
  // Build content array with text and image for vision
  const userContent: any[] = [{ type: "text", text: userText }];
  if (imageData.startsWith('data:')) {
    userContent.push({ type: "image_url", image_url: { url: imageData } });
  }
  
  const lovableResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
    }),
  });

  if (!lovableResponse.ok) {
    const errorText = await lovableResponse.text();
    console.error("Lovable AI Gateway error:", lovableResponse.status, errorText);
    
    if (lovableResponse.status === 402) {
      throw new Error("PAYMENT_REQUIRED: All API quotas exhausted.");
    }
    if (lovableResponse.status === 429) {
      throw new Error("RATE_LIMITED: Too many requests.");
    }
    throw new Error(`Lovable AI Gateway error: ${lovableResponse.status}`);
  }

  const lovableData = await lovableResponse.json();
  const result = lovableData.choices?.[0]?.message?.content;
  if (!result) throw new Error("No response from Lovable AI Gateway");
  
  console.log("Successfully used Lovable AI Gateway fallback");
  return result;
}

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

    const userText = `Generate 5 caption variations for this selfie.${additionalContext ? `\n\nAdditional context from the model: ${additionalContext}` : ''}`;
    
    const content = await callGeminiWithFallback(model, systemPrompt, userText, selfieImage);
    
    // Parse JSON from response
    let captions = [];
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
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
    
    if (errorMessage.includes('exhausted') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return new Response(JSON.stringify({ error: "All API keys exhausted. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
