import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    Deno.env.get('GEMINI_API_KEY_5'),
  ].filter(Boolean) as string[];
  return keys;
};

// Call Gemini with automatic key rotation
async function callGeminiWithFallback(model: string, systemPrompt: string, userMessage: string, imageBase64?: string) {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  const modelMap: Record<string, string> = {
    "google/gemini-2.5-flash": "gemini-2.5-flash",
    "google/gemini-2.5-pro": "gemini-2.5-pro",
    "google/gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
    "google/gemini-3-pro-preview": "gemini-3-pro-preview",
  };

  const geminiModel = modelMap[model] || "gemini-2.5-flash";
  
  // Build content parts based on whether we have an image
  const userParts: any[] = [{ text: userMessage }];
  if (imageBase64) {
    // Extract mime type and data from base64 string
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      userParts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    console.log(`Trying Gemini API key ${i + 1}/${keys.length}`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: userParts }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 2048,
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
  
  // Final fallback: Lovable AI Gateway
  console.log("Gemini failed/exhausted, falling back to Lovable AI Gateway");
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  // Build message content for Lovable AI
  const messageContent: any = imageBase64 
    ? [
        { type: "text", text: userMessage },
        { type: "image_url", image_url: { url: imageBase64 } }
      ]
    : userMessage;

  const lovableResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageContent },
      ],
    }),
  });

  if (!lovableResponse.ok) {
    const errorText = await lovableResponse.text();
    console.error("Lovable AI Gateway error:", lovableResponse.status, errorText);

    if (lovableResponse.status === 402) throw new Error("PAYMENT_REQUIRED");
    if (lovableResponse.status === 429) throw new Error("RATE_LIMITED");

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
    // Validate secret key
    const secretKey = req.headers.get('x-secret-key');
    const SIGNUP_SECRET_KEY = Deno.env.get('SIGNUP_SECRET_KEY');

    if (!secretKey || !SIGNUP_SECRET_KEY || secretKey !== SIGNUP_SECRET_KEY) {
      console.error('Unauthorized: Invalid or missing secret key');
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { category, count = 20, model = "google/gemini-2.5-flash", type, modelName, fanName, tone, isUncensored, context, imageBase64 } = await req.json();
    
    console.log("Generate messages request:", { category, count, type, hasImage: !!imageBase64 });

    // Handle image-based quick replies generation
    if (type === 'image_quick_replies' && imageBase64) {
      const imageAnalysisPrompt = `You are analyzing a screenshot from a FanVue/OnlyFans chat conversation.

TASK:
1. First, analyze the image to understand the conversation context
2. Then generate ${count || 5} quick reply options that would be appropriate responses

RULES:
1. Tone: ${tone || 'flirty'}
2. ${isUncensored ? 'EXPLICIT MODE: Use vulgar sexual language freely (fuck, cock, wet, cum, horny, pussy, etc.)' : 'Keep it suggestive but not explicit'}
3. All lowercase, casual texting style
4. Include 1-2 emojis per reply
5. Keep replies SHORT (under 25 words)
6. Make them feel natural and personal
7. Replies should be contextually relevant to what's shown in the screenshot

Return ONLY a JSON object with this format:
{"context": "brief description of what you see in the image", "messages": ["reply 1", "reply 2", ...]}`;

      const imageReplies = await callGeminiWithFallback(model, imageAnalysisPrompt, "Analyze this screenshot and generate contextual quick replies.", imageBase64);
      
      let cleanContent = imageReplies.trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
      cleanContent = cleanContent.trim();

      let result;
      try {
        result = JSON.parse(cleanContent);
      } catch (e) {
        console.error("Failed to parse image quick replies:", cleanContent);
        result = { context: "Unable to analyze image", messages: [] };
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle quick replies generation
    if (type === 'quick_replies') {
      const quickReplyPrompt = `You are generating quick reply options for a ${modelName || 'model'} chatting with ${fanName || 'a fan'} on FanVue/OnlyFans.

RULES:
1. Generate ${count || 5} unique quick reply options
2. Tone: ${tone || 'flirty'}
3. ${isUncensored ? 'EXPLICIT MODE: Use vulgar sexual language freely (fuck, cock, wet, cum, horny, pussy, etc.)' : 'Keep it suggestive but not explicit'}
4. All lowercase, casual texting style
5. Include 1-2 emojis per reply
6. Keep replies SHORT (under 20 words)
7. Make them feel natural and personal
${context ? `8. Context: ${context}` : ''}

Return ONLY a JSON array of strings, no other text. Example: ["hey babe 💕", "miss you rn 🥺"]`;

      const quickReplies = await callGeminiWithFallback(model, quickReplyPrompt, "Generate the quick replies now.");
      
      let cleanContent = quickReplies.trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
      cleanContent = cleanContent.trim();

      let messages;
      try {
        messages = JSON.parse(cleanContent);
      } catch (e) {
        console.error("Failed to parse quick replies:", cleanContent);
        messages = [];
      }

      return new Response(JSON.stringify({ messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const categoryPrompts: Record<string, string> = {
      all: "Mix of casual, morning, night, comeback, horny, and seducing messages",
      morning: "Good morning messages - warm, affectionate wake-up greetings",
      night: "Goodnight messages - cozy, intimate bedtime messages",
      comeback: "Comeback/re-engagement messages - for fans who haven't messaged in a while, slightly sad/missing them",
      horny: "Explicit horny messages - sexually charged, vulgar, using words like fuck, wet, cock, cum. Be very explicit.",
      seducing: "Seductive teasing messages - suggestive, playful, hinting at showing something special",
      casual: "Casual check-in messages - simple hey, thinking of you, what are you doing type messages",
    };

    const systemPrompt = `You are generating personal one-on-one messages for a FanVue/OnlyFans content creator to send to individual fans.

CRITICAL RULES:
1. Messages must feel PERSONAL and ONE-ON-ONE, like texting a specific person
2. NEVER write broadcast-style or mass-message content
3. Use casual texting style with lowercase, abbreviations like "rn", "wyd", "u"
4. Include 1-2 relevant emojis per message
5. Keep messages SHORT (under 15 words ideally)
6. Make them feel spontaneous and genuine
7. For horny/explicit category: Use explicit sexual language freely (fuck, cock, wet, cum, horny, etc.)

Category focus: ${categoryPrompts[category] || categoryPrompts.all}

Generate exactly ${count} unique messages. Return ONLY a JSON array of message objects with "text" and "category" fields.
Example format: [{"text": "hey babe, thinking about you rn 💭", "category": "casual"}]`;

    const userMessage = `Generate ${count} unique ${category === 'all' ? 'mixed category' : category} personal messages for fan outreach. Return only the JSON array.`;

    const content = await callGeminiWithFallback(model, systemPrompt, userMessage);
    
    // Clean up the response - extract JSON array
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    let messages;
    try {
      messages = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", cleanContent);
      messages = [];
    }

    console.log("Generated", messages.length, "messages");

    return new Response(JSON.stringify({ messages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-messages function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle payment required (all quotas exhausted)
    if (errorMessage.includes('PAYMENT_REQUIRED') || errorMessage.includes('402')) {
      return new Response(JSON.stringify({ 
        error: "All API quotas exhausted. Please wait for daily quota reset or add new API keys from different Google accounts.",
        code: "QUOTA_EXHAUSTED"
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Handle rate limiting
    if (errorMessage.includes('RATE_LIMITED') || errorMessage.includes('exhausted') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return new Response(JSON.stringify({ 
        error: "All API keys rate limited. Please try again later.",
        code: "RATE_LIMITED"
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
