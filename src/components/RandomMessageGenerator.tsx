import { useState, useEffect } from "react";
import { Shuffle, Copy, Check, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type MessageCategory = "all" | "morning" | "night" | "comeback" | "horny" | "seducing" | "casual";

interface Message {
  text: string;
  category: MessageCategory;
}

interface DisplayMessage extends Message {
  id: string;
  isNew?: boolean;
}

const categories: { value: MessageCategory; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "morning", label: "Morning", emoji: "🌅" },
  { value: "night", label: "Night", emoji: "🌙" },
  { value: "comeback", label: "Comeback", emoji: "💔" },
  { value: "horny", label: "Horny", emoji: "🥵" },
  { value: "seducing", label: "Seducing", emoji: "😈" },
  { value: "casual", label: "Casual", emoji: "💬" },
];

let messageIdCounter = 0;
const generateId = () => `msg-${++messageIdCounter}-${Date.now()}`;

const toDisplayMessage = (msg: Message, isNew = false): DisplayMessage => ({
  ...msg,
  id: generateId(),
  isNew,
});

interface RandomMessageGeneratorProps {
  model?: string;
}

export function RandomMessageGenerator({ model = "google/gemini-2.5-flash" }: RandomMessageGeneratorProps) {
  const { secretKey } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>("all");
  const [shuffledMessages, setShuffledMessages] = useState<DisplayMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateMessagesFromAI = async (category: MessageCategory, showToast = true) => {
    setIsLoading(true);
    try {
      // secretKey comes from useAuth hook
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-secret-key": secretKey || "",
          },
          body: JSON.stringify({ category, count: 20, model }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 402) {
          toast.error("AI credits depleted. Please add credits.");
        } else {
          toast.error(error.error || "Failed to generate messages");
        }
        return;
      }

      const data = await response.json();
      const messages = data.messages || [];
      
      setShuffledMessages(messages.map((m: Message) => toDisplayMessage(m, true)));
      if (showToast) {
        toast.success(`Generated ${messages.length} fresh AI messages!`);
      }
    } catch (error) {
      console.error("Error generating messages:", error);
      toast.error("Failed to generate messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate initial messages on mount
  useEffect(() => {
    generateMessagesFromAI("all", false);
  }, []);

  const handleCategoryChange = (category: MessageCategory) => {
    setSelectedCategory(category);
    generateMessagesFromAI(category);
  };

  const generateNewMessages = () => {
    generateMessagesFromAI(selectedCategory);
  };

  const resetMessages = () => {
    generateMessagesFromAI(selectedCategory);
  };

  const copyMessage = async (message: DisplayMessage, index: number) => {
    await navigator.clipboard.writeText(message.text);
    setCopiedId(message.id);
    toast.success("Message copied!");
    
    // Remove the copied message after animation
    setTimeout(() => {
      setShuffledMessages(prev => prev.filter((_, i) => i !== index));
      setCopiedId(null);
    }, 300);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-3 pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            AI Random Messages
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetMessages} 
              title="Regenerate all messages"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateNewMessages}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Shuffle className="w-3 h-3 mr-1" />
              )}
              Shuffle
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              className={`cursor-pointer hover:bg-muted transition-colors ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.emoji} {cat.label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-2">
          {isLoading && shuffledMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Generating messages...</span>
              </div>
            </div>
          ) : shuffledMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-sm">No messages. Click Shuffle to generate!</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {shuffledMessages.map((message, index) => (
                <button
                  key={message.id}
                  onClick={() => copyMessage(message, index)}
                  className={`group text-left p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-all duration-300 relative ${
                    copiedId === message.id ? "opacity-0 scale-95" : ""
                  } ${message.isNew ? "animate-fade-in" : ""}`}
                >
                  <span className="text-sm text-foreground">{message.text}</span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedId === message.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
