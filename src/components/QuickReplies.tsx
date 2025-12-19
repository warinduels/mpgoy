import { useState, useMemo } from "react";
import { Heart, Gift, Flame, MessageCircle, Sparkles, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QuickRepliesProps {
  onSelect: (reply: string) => void;
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

export function QuickReplies({ onSelect }: QuickRepliesProps) {
  const [refreshKey, setRefreshKey] = useState(0);

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

      <ScrollArea className="h-[350px] pr-2">
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