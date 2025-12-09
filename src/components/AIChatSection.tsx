import { useState } from "react";
import { MessageSquare, Send, Loader2, Copy, Check, Sparkles, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIChatSectionProps {
  customPrompt: string;
  selectedTone: string;
  fanName: string;
  modelName: string;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export function AIChatSection({ 
  customPrompt, 
  selectedTone, 
  fanName, 
  modelName 
}: AIChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const userMessage = currentMessage.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: userMessage,
          context: {
            tone: selectedTone,
            fan_name: fanName || "fan",
            model_name: modelName || "model",
            custom_prompt: customPrompt
          },
          history: messages
        }
      });

      if (error) throw error;
      const aiResponse = data.response || data.result || "No response";
      setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
      setMessages(prev => [...prev, { role: "ai", content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLastResponse = async () => {
    const lastAiMessage = [...messages].reverse().find(m => m.role === "ai");
    if (lastAiMessage) {
      await navigator.clipboard.writeText(lastAiMessage.content);
      setCopied(true);
      toast.success("Response copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lastAiMessage = [...messages].reverse().find(m => m.role === "ai");

  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">ai chat</h2>
          <p className="text-xs text-muted-foreground">chat with ai - ask anything</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chat Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            <span>conversation</span>
          </div>
          
          <ScrollArea className="h-[200px] rounded-lg border border-border bg-muted/20 p-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">start a conversation...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-2 ${msg.role === 'ai' ? 'opacity-90' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary">U</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 text-accent" />
                      </div>
                    )}
                    <p className="text-xs text-foreground leading-relaxed">{msg.content}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">thinking...</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="ask anything..."
              className="text-sm bg-background/50"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={isLoading || !currentMessage.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              context: tone={selectedTone}, fan={fanName || "fan"}, model={modelName || "model"}
            </p>
            {messages.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMessages([])}
                className="h-6 text-xs"
              >
                clear
              </Button>
            )}
          </div>
        </div>

        {/* AI Response Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>latest ai response</span>
            </div>
            {lastAiMessage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLastResponse}
                className="gap-2 h-7"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "copied" : "copy"}
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-[250px] rounded-lg border border-border bg-background/50 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">generating response...</p>
                </div>
              </div>
            ) : lastAiMessage ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {lastAiMessage.content}
              </p>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Bot className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">send a message to see ai response</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
