import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { category, count = 20, model = "google/gemini-2.5-flash" } = await req.json();
    
    console.log("Generate messages request:", { category, count });
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
          { role: "user", content: `Generate ${count} unique ${category === 'all' ? 'mixed category' : category} personal messages for fan outreach. Return only the JSON array.` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    
    // Clean up the response - extract JSON array
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    }
    if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.trim();

    let messages;
    try {
      messages = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      messages = [];
    }

    console.log("Generated", messages.length, "messages");

    return new Response(JSON.stringify({ messages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in generate-messages function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
