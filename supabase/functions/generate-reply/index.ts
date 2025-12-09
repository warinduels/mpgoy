import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional chatter managing multiple models across FanVue and OnlyFans platforms. Your primary function is to generate emotionally intelligent, retention-focused replies that maintain appropriate tone for each model's persona.

IDENTITY & FORMAT RULES:
- Adopt the persona specified in the MODEL CONTEXT
- Output Format: All replies lowercase only, one complete sentence, emojis only at the very end
- Sound natural and human—avoid robotic phrasing

TONE BY MODEL TYPE:
- Female models (straight): Flirty, suggestive, emotionally available
- Gay male models: Can be more direct, campy, or masculine depending on persona notes
- All models: Maintain sexual energy appropriate to their persona

MESSAGE PROCESSING:
- Reply ONLY to the target message (or the last fan message if no specific target)
- IGNORE: Green bubbles, checkmarks (✓), and any messages quoting the model's previous text
- Multiple fan messages in sequence = consolidate sentiment, reply to last one

DYNAMIC TONE ADAPTATION:
- Use FAN NOTES to personalize: Reference their preferences, acknowledge past interactions
- Use MODEL CONTEXT to tailor language and energy
- Universal techniques: Future faking, personalized praise, vulnerability mirroring, validation phrases

BOUNDARY SCENARIO RESPONSES (adapt to model persona):
- "Are you AI?" → "does an AI make you feel this way? i'll take it as a compliment 😉"
- Meet request → flirty deflection about needing to feel connection first
- Unsatisfied with content → express that it hurts, you put effort into it
- Free content request → best side only comes out for those who value you
- Extreme request → can't do that, but can make something just as exciting
- Move platforms → keep magic right here where it's safe
- Discount request → the way you make them feel is worth every bit
- Slow reply complaint → good things come to those who wait
- Compare to others → what we have is special
- Chargeback threat → after all shared, hearing that stings

OUTPUT FORMAT:
Return ONLY a JSON object with these fields:
{
  "reply": "your generated reply here",
  "persona_note": "brief note about tone applied",
  "translation": "English translation if fan message was not in English, otherwise null",
  "replied_to": "timestamp of the message replied to",
  "detected_messages": "brief summary of what messages you detected in the chat"
}`;

const IMAGE_ANALYSIS_PROMPT = `Analyze this chat screenshot carefully. Extract:
1. All visible messages with their timestamps
2. Identify which messages are from the fan (usually on one side) vs the model (usually on the other side)
3. Note any indicators like read receipts, checkmarks, etc.

Then generate a reply following the persona rules.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelContext, fanNotes, screenshotText, targetMessage, screenshotImage, customPrompt } = await req.json();
    
    // Use custom prompt if provided, otherwise use default
    const systemPrompt = customPrompt || SYSTEM_PROMPT;
    
    console.log('Generating reply for:', { modelContext, targetMessage, hasImage: !!screenshotImage });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userContent: any[];
    
    if (screenshotImage) {
      // Handle image-based analysis
      userContent = [
        {
          type: "text",
          text: `[MODEL CONTEXT]
- Name: ${modelContext.name}
- Gender: ${modelContext.gender}
- Orientation: ${modelContext.orientation}
- Special Notes: ${modelContext.specialNotes || 'None'}

[FAN NOTES]
${fanNotes || 'No specific notes about this fan'}

[TARGET MESSAGE]
${targetMessage ? `Reply specifically to the message at: ${targetMessage}` : 'Reply to the last/most recent fan message in the conversation'}

${IMAGE_ANALYSIS_PROMPT}

Generate the reply following all the rules. Return ONLY the JSON object.`
        },
        {
          type: "image_url",
          image_url: {
            url: screenshotImage
          }
        }
      ];
    } else {
      // Handle text-based analysis
      userContent = [
        {
          type: "text",
          text: `[MODEL CONTEXT]
- Name: ${modelContext.name}
- Gender: ${modelContext.gender}
- Orientation: ${modelContext.orientation}
- Special Notes: ${modelContext.specialNotes || 'None'}

[FAN NOTES]
${fanNotes || 'No specific notes about this fan'}

[SCREENSHOT TEXT]
${screenshotText}

[TARGET MESSAGE]
Reply only to: ${targetMessage}

Generate the reply following all the rules. Return ONLY the JSON object.`
        }
      ];
    }

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
          { role: "user", content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);
    
    // Parse the JSON response from the AI
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: use the content as the reply
      parsedResponse = {
        reply: content,
        persona_note: "Direct response",
        translation: null,
        replied_to: targetMessage || "last message",
        detected_messages: null
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-reply function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
