import { useState } from "react";
import { Heart, Gift, Flame, MessageCircle, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface QuickRepliesProps {
  onSelect: (reply: string) => void;
  modelName?: string;
  fanName?: string;
  tone?: string;
  isUncensored?: boolean;
  secretKey?: string;
}

const defaultCategories = [
  {
    title: "GREETINGS",
    icon: Heart,
    replies: [
      "hey babe, so happy to see you here, how's your day going 💕",
      "omg hi, i was just thinking about you, what are you up to 🥰",
    ],
  },
  {
    title: "THANK YOU",
    icon: Gift,
    replies: [
      "you're literally the sweetest, thank you so much, this made my whole day 🥹💕",
      "aww you're too kind to me, i really appreciate the support babe 🥰",
    ],
  },
  {
    title: "FLIRTY",
    icon: Flame,
    replies: [
      "you always know how to make me smile, what else is on your mind 😏💋",
      "mmm i love when you message me, tell me more 🔥",
    ],
  },
  {
    title: "EXPLICIT",
    icon: Flame,
    replies: [
      "fuck you're making me so wet right now, keep talking like that 💦😈",
      "i want you so bad rn, thinking about what i'd do to you 🥵💦",
    ],
  },
  {
    title: "ENGAGEMENT",
    icon: MessageCircle,
    replies: [
      "i'd love to hear more about that, tell me everything 👀✨",
      "that's so interesting babe, what made you think of that 🤔💭",
    ],
  },
  {
    title: "PPV TEASE",
    icon: Sparkles,
    replies: [
      "i have something special just for you, want me to send it 😈✨",
      "been working on something hot, think you can handle it, dm me if you want to see 😏🔥",
    ],
  },
];

export function QuickReplies({ onSelect, modelName, fanName, tone, isUncensored, secretKey }: QuickRepliesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReplies, setAiReplies] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState("");

  const generateAIReplies = async () => {
    if (!secretKey) {
      toast.error('Authentication required');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "x-secret-key": secretKey,
          },
          body: JSON.stringify({
            type: 'quick_replies',
            modelName: modelName || 'model',
            fanName: fanName || 'fan',
            tone: tone || 'flirty',
            isUncensored: isUncensored || false,
            context: customContext || undefined,
            count: 5
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 402) {
          toast.error('AI credits exhausted. Please add credits.');
          return;
        }
        if (response.status === 429) {
          toast.error('Rate limited. Please wait and try again.');
          return;
        }
        throw new Error(errorData?.error || 'Failed to generate replies');
      }

      const data = await response.json();
      if (data?.messages && Array.isArray(data.messages)) {
        setAiReplies(data.messages);
        toast.success(`Generated ${data.messages.length} quick replies`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error(err.message || 'Failed to generate replies');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <h3 className="text-sm font-medium text-foreground">quick replies</h3>
        </div>
      </div>

      {/* AI Generation Section */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
        <div className="flex items-center gap-2 text-xs text-primary font-medium">
          <Sparkles className="w-3 h-3" />
          AI-Generated Replies
        </div>
        <Input
          placeholder="Optional context (e.g., 'fan just tipped', 'new subscriber')..."
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          className="h-8 text-xs"
        />
        <Button
          onClick={generateAIReplies}
          disabled={isGenerating}
          size="sm"
          className="w-full h-8 text-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 mr-1" />
              Generate Quick Replies
            </>
          )}
        </Button>

        {aiReplies.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {aiReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(reply)}
                className="w-full text-left p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <span className="text-xs text-foreground leading-relaxed">
                  {reply}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="h-[300px] pr-2">
        <div className="space-y-4">
          {defaultCategories.map((category) => (
            <div key={category.title} className="space-y-2">
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider">
                {category.title}
              </span>
              <div className="space-y-2">
                {category.replies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelect(reply)}
                    className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <category.icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {reply}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}