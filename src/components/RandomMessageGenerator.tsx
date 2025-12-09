import { useState } from "react";
import { Shuffle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const personalMessages = [
  "heyy, are you busy? 🥺",
  "hey I miss you 😞",
  "thinking about you rn 💭",
  "wyd babe? 👀",
  "I can't stop thinking about our last chat 🥰",
  "hey stranger, where have you been? 😘",
  "just wanted to say hi 💕",
  "are you ignoring me? 🥺💔",
  "I had a dream about you last night 😏",
  "guess what I'm wearing rn 👀🔥",
  "bored... entertain me? 😈",
  "hey you, I've been waiting for you 💋",
  "omg I just thought of something funny we talked about 😂",
  "do you ever think about me? 🤔💭",
  "I wish you were here rn 😩",
  "hey cutie, what are you up to? 🥰",
  "can't sleep, you up? 🌙",
  "just saw something that reminded me of you 💕",
  "I have something special to show you 😏✨",
  "hey baby, miss your messages 💔",
  "wanna play a game with me? 🎮😈",
  "I'm so bored without you 😭",
  "thinking about that thing you said 👀",
  "hey, got a minute for me? 🥺",
  "just checking in on my favorite person 💖",
  "hey handsome, where you been hiding? 😘",
  "I need your attention rn 🥵",
  "psst... come here 👀💋",
  "you crossed my mind today 💭💕",
  "hey love, how's your day going? 🌸",
  "I've got news... you wanna hear it? 👀",
  "missing our convos 😞💔",
  "hey babe, you ghosting me? 😢",
  "just woke up thinking about you 😴💕",
  "come talk to me, I'm lonely 🥺",
  "hey, I need to tell you something 👀",
  "why haven't you messaged me? 😤💕",
  "I saved something special just for you 🎁",
  "hey you... yes you 😏💋",
  "can we chat? I miss you 🥺💭",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function RandomMessageGenerator() {
  const [messages, setMessages] = useState<string[]>(() => 
    shuffleArray(personalMessages).slice(0, 20)
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateNewMessages = () => {
    setMessages(shuffleArray(personalMessages).slice(0, 20));
    toast.success("Generated 20 new messages!");
  };

  const copyMessage = async (message: string, index: number) => {
    await navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    toast.success("Message copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shuffle className="w-4 h-4" />
          Random Personal Messages
        </CardTitle>
        <Button variant="outline" size="sm" onClick={generateNewMessages}>
          <Shuffle className="w-3 h-3 mr-1" />
          Shuffle
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {messages.map((message, index) => (
              <button
                key={index}
                onClick={() => copyMessage(message, index)}
                className="group text-left p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors relative"
              >
                <span className="text-sm text-foreground">{message}</span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
