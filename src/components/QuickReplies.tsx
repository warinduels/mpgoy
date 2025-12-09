import { Heart, Gift, Flame, MessageCircle, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickRepliesProps {
  onSelect: (reply: string) => void;
}

const categories = [
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

export function QuickReplies({ onSelect }: QuickRepliesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        <h3 className="text-sm font-medium text-foreground">quick replies</h3>
      </div>
      <ScrollArea className="h-[400px] pr-2">
        <div className="space-y-4">
          {categories.map((category) => (
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
