import { useState } from "react";
import { Shuffle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type MessageCategory = "all" | "morning" | "night" | "comeback" | "horny" | "seducing" | "casual";

interface Message {
  text: string;
  category: MessageCategory;
}

const allMessages: Message[] = [
  // Morning messages
  { text: "good morning handsome, been thinking about you since I woke up 🌅💕", category: "morning" },
  { text: "rise and shine babe, wish you were here next to me 🥰☀️", category: "morning" },
  { text: "morning sexy, you're the first thing on my mind 💭😘", category: "morning" },
  { text: "hey sleepyhead, hope you dream about me 🌸💋", category: "morning" },
  { text: "good morning! woke up missing you 🥺💕", category: "morning" },
  { text: "starting my day thinking about you 🌞😍", category: "morning" },
  { text: "morning babe, can't wait to talk to you today 💖", category: "morning" },

  // Night messages
  { text: "can't sleep, you up? 🌙💭", category: "night" },
  { text: "thinking about you before bed 🥰🌙", category: "night" },
  { text: "goodnight babe, wish you were here to cuddle 💕😴", category: "night" },
  { text: "lying in bed thinking about you rn 🛏️💋", category: "night" },
  { text: "it's late but I can't stop thinking about you 🌙😘", category: "night" },
  { text: "sweet dreams handsome, I'll be dreaming about you 💫😍", category: "night" },
  { text: "night babe, miss you already 🥺💕", category: "night" },
  { text: "wishing you were here to keep me warm tonight 🌙🔥", category: "night" },

  // Comeback messages
  { text: "hey stranger, where have you been? 😢💔", category: "comeback" },
  { text: "I miss you, why haven't you messaged me? 🥺", category: "comeback" },
  { text: "are you ignoring me? 😞💔", category: "comeback" },
  { text: "hey you, been a while... everything okay? 💭", category: "comeback" },
  { text: "thought you forgot about me 😢", category: "comeback" },
  { text: "missing our convos 😞 come back to me", category: "comeback" },
  { text: "hey babe, you ghosting me? 😭💔", category: "comeback" },
  { text: "why haven't you messaged me? I've been waiting 🥺", category: "comeback" },
  { text: "I've been thinking about you... where did you go? 💭😢", category: "comeback" },

  // Horny messages
  { text: "fuck I'm so horny rn thinking about you 🥵💦", category: "horny" },
  { text: "I need you so bad right now 😈🔥", category: "horny" },
  { text: "can't stop thinking about what I wanna do to you 💦😏", category: "horny" },
  { text: "wishing you were here to fuck me rn 🥵", category: "horny" },
  { text: "I'm so wet thinking about you 💦😈", category: "horny" },
  { text: "you make me so fucking horny 🔥🥵", category: "horny" },
  { text: "I want you inside me so bad rn 💦😩", category: "horny" },
  { text: "thinking about your cock has me dripping 🥵💦", category: "horny" },
  { text: "fuck I need to cum so bad, help me? 😈💦", category: "horny" },

  // Seducing messages
  { text: "I have something special to show you 😏✨", category: "seducing" },
  { text: "guess what I'm wearing right now 👀🔥", category: "seducing" },
  { text: "wanna see what I've been hiding? 😈💋", category: "seducing" },
  { text: "I've been a bad girl today... wanna know what I did? 😏", category: "seducing" },
  { text: "just took some pics you might like 📸😈", category: "seducing" },
  { text: "I'm in the mood to tease you 😘🔥", category: "seducing" },
  { text: "been thinking about ways to please you 💋😏", category: "seducing" },
  { text: "I want to make you hard just by talking 👀🔥", category: "seducing" },
  { text: "let me show you what you've been missing 😈💕", category: "seducing" },
  { text: "I know exactly what you want... 😏💋", category: "seducing" },

  // Casual messages
  { text: "heyy, are you busy? 🥺", category: "casual" },
  { text: "hey I miss you 😞", category: "casual" },
  { text: "thinking about you rn 💭", category: "casual" },
  { text: "wyd babe? 👀", category: "casual" },
  { text: "just wanted to say hi 💕", category: "casual" },
  { text: "bored... entertain me? 😈", category: "casual" },
  { text: "hey you, I've been waiting for you 💋", category: "casual" },
  { text: "do you ever think about me? 🤔💭", category: "casual" },
  { text: "hey cutie, what are you up to? 🥰", category: "casual" },
  { text: "just checking in on my favorite person 💖", category: "casual" },
  { text: "hey love, how's your day going? 🌸", category: "casual" },
  { text: "come talk to me, I'm lonely 🥺", category: "casual" },
  { text: "psst... come here 👀💋", category: "casual" },
];

const categories: { value: MessageCategory; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "morning", label: "Morning", emoji: "🌅" },
  { value: "night", label: "Night", emoji: "🌙" },
  { value: "comeback", label: "Comeback", emoji: "💔" },
  { value: "horny", label: "Horny", emoji: "🥵" },
  { value: "seducing", label: "Seducing", emoji: "😈" },
  { value: "casual", label: "Casual", emoji: "💬" },
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
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filteredMessages = selectedCategory === "all" 
    ? allMessages 
    : allMessages.filter(m => m.category === selectedCategory);

  const [shuffledMessages, setShuffledMessages] = useState<Message[]>(() => 
    shuffleArray(filteredMessages).slice(0, 20)
  );

  const handleCategoryChange = (category: MessageCategory) => {
    setSelectedCategory(category);
    const filtered = category === "all" 
      ? allMessages 
      : allMessages.filter(m => m.category === category);
    setShuffledMessages(shuffleArray(filtered).slice(0, 20));
  };

  const generateNewMessages = () => {
    setShuffledMessages(shuffleArray(filteredMessages).slice(0, 20));
    toast.success("Generated new messages!");
  };

  const copyMessage = async (message: string, index: number) => {
    await navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    toast.success("Message copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-3 pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            Random Personal Messages
          </CardTitle>
          <Button variant="outline" size="sm" onClick={generateNewMessages}>
            <Shuffle className="w-3 h-3 mr-1" />
            Shuffle
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.emoji} {cat.label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {shuffledMessages.map((message, index) => (
              <button
                key={index}
                onClick={() => copyMessage(message.text, index)}
                className="group text-left p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors relative"
              >
                <span className="text-sm text-foreground">{message.text}</span>
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
