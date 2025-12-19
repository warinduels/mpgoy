import { useState, useMemo, useRef, useCallback } from "react";
import { Heart, Gift, Flame, MessageCircle, Sparkles, RefreshCw, Image, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QuickRepliesProps {
  onSelect: (reply: string) => void;
  secretKey?: string;
  tone?: string;
  isUncensored?: boolean;
}

const allReplies = {
  GREETINGS: {
    icon: Heart,
    replies: [
      "hey babe, so happy to see you here, how's your day going 💕",
      "omg hi, i was just thinking about you, what are you up to 🥰",
      "heyyy you, missed you, where have you been 💋",
      "hi cutie, you just made my day better by showing up 🥹",
      "hey there handsome, what's on your mind today 😘",
      "omg finally you're here, i've been waiting for you 💕",
      "hey babe, i love when you pop up in my messages 🥰",
      "hi love, tell me everything about your day 💋",
    ],
  },
  "THANK YOU": {
    icon: Gift,
    replies: [
      "you're literally the sweetest, thank you so much, this made my whole day 🥹💕",
      "aww you're too kind to me, i really appreciate the support babe 🥰",
      "omg you didn't have to but i'm so grateful, thank you baby 💋",
      "this is so sweet of you, you always know how to make me smile 🥹",
      "thank you so much love, you're one of my favorites 💕",
      "i can't believe how generous you are, you're amazing 🥰",
      "you're honestly the best, thank you for thinking of me 💋",
      "aww babe this means so much to me, thank you 🥹💕",
    ],
  },
  FLIRTY: {
    icon: Flame,
    replies: [
      "you always know how to make me smile, what else is on your mind 😏💋",
      "mmm i love when you message me, tell me more 🔥",
      "you're making me blush over here, keep going 😘",
      "i can't stop thinking about you either 🥰💋",
      "you're so good at this, what else you got 😏",
      "ooh you're being naughty today, i like it 🔥",
      "keep talking like that and see what happens 😈💋",
      "you know exactly what to say to get my attention 😘",
    ],
  },
  EXPLICIT: {
    icon: Flame,
    replies: [
      "fuck you're making me so wet right now, keep talking like that 💦😈",
      "i want you so bad rn, thinking about what i'd do to you 🥵💦",
      "mmm you're getting me so turned on baby 😈🔥",
      "i wish you were here right now, i'd show you exactly what i mean 💦",
      "you're so fucking hot, i can't handle it 🥵😈",
      "keep going, i love when you talk dirty to me 💦🔥",
      "i'm touching myself thinking about you rn 🥵💦",
      "fuck i need you so bad, tell me what you'd do to me 😈",
    ],
  },
  ENGAGEMENT: {
    icon: MessageCircle,
    replies: [
      "i'd love to hear more about that, tell me everything 👀✨",
      "that's so interesting babe, what made you think of that 🤔💭",
      "omg really, i wanna know more 👀",
      "that's actually so cool, keep going 😊✨",
      "i love learning new things about you, tell me more 🥰",
      "wait that's so interesting, explain more 🤔💭",
      "you're so smart babe, i love this 😊",
      "ooh tell me more, i'm so curious now 👀✨",
    ],
  },
  "PPV TEASE": {
    icon: Sparkles,
    replies: [
      "i have something special just for you, want me to send it 😈✨",
      "been working on something hot, think you can handle it, dm me if you want to see 😏🔥",
      "i made something exclusive today, you're gonna love it 🔥",
      "got some spicy content ready just for you babe 😈",
      "want to see what i've been up to, it's pretty naughty 💦",
      "i think you deserve something special today 😏✨",
      "i've got something that'll make your day way better 🔥",
      "feeling generous, want me to send you a little treat 😈💋",
    ],
  },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function QuickReplies({ onSelect, secretKey, tone, isUncensored }: QuickRepliesProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [imageContext, setImageContext] = useState<string | null>(null);
  const [imageReplies, setImageReplies] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    return Object.entries(allReplies).map(([title, data]) => ({
      title,
      icon: data.icon,
      replies: shuffleArray(data.replies).slice(0, 2),
    }));
  }, [refreshKey]);

  const handleRegenerate = () => {
    setRefreshKey(prev => prev + 1);
    toast.success("Quick replies regenerated");
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setPastedImage(base64);
          setImageContext(null);
          setImageReplies([]);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const analyzeImage = async () => {
    if (!pastedImage || !secretKey) {
      toast.error('Please paste an image and ensure you are authenticated');
      return;
    }

    setIsAnalyzing(true);
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
            type: 'image_quick_replies',
            imageBase64: pastedImage,
            tone: tone || 'flirty',
            isUncensored: isUncensored || false,
            count: 5
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          toast.error('AI credits exhausted. Please add credits.');
          return;
        }
        if (response.status === 429) {
          toast.error('Rate limited. Please wait and try again.');
          return;
        }
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      if (data?.context) setImageContext(data.context);
      if (data?.messages && Array.isArray(data.messages)) {
        setImageReplies(data.messages);
        toast.success(`Generated ${data.messages.length} contextual replies`);
      }
    } catch (err: any) {
      console.error('Analyze error:', err);
      toast.error(err.message || 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setPastedImage(null);
    setImageContext(null);
    setImageReplies([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <h3 className="text-sm font-medium text-foreground">quick replies</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          className="h-7 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          regenerate
        </Button>
      </div>

      {/* Paste Screenshot Area */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-primary font-medium">
          <Image className="w-3 h-3" />
          Paste Screenshot for Context
        </div>
        
        {!pastedImage ? (
          <div
            ref={pasteAreaRef}
            onPaste={handlePaste}
            tabIndex={0}
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors focus:outline-none focus:border-primary"
          >
            <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Click here and paste (Ctrl+V) a screenshot
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              AI will analyze it and generate contextual replies
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={pastedImage} 
                alt="Pasted screenshot" 
                className="w-full max-h-[150px] object-contain bg-muted/30"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearImage}
                className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {imageContext && (
              <div className="p-2 rounded bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Context:</span> {imageContext}
                </p>
              </div>
            )}

            {imageReplies.length === 0 ? (
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                size="sm"
                className="w-full h-8 text-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generate Contextual Replies
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-primary">AI-Generated from Screenshot</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="h-5 px-2 text-[10px]"
                  >
                    <RefreshCw className={`w-2 h-2 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    refresh
                  </Button>
                </div>
                {imageReplies.map((reply, idx) => (
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
        )}
      </div>

      <ScrollArea className="h-[250px] pr-2">
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.title} className="space-y-2">
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider">
                {category.title}
              </span>
              <div className="space-y-2">
                {category.replies.map((reply, idx) => (
                  <button
                    key={`${refreshKey}-${idx}`}
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