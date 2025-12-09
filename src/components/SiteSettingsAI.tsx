import { useState } from "react";
import { MessageSquare, Send, Loader2, Copy, Check, Sparkles, Bot, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReplyTone } from "@/components/ReplyToneSelector";

interface SiteSettingsAIProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  selectedTone: string;
  setSelectedTone: (tone: ReplyTone) => void;
  fanName: string;
  setFanName: (name: string) => void;
  modelName: string;
  setModelName: (name: string) => void;
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export function SiteSettingsAI({ 
  customPrompt,
  setCustomPrompt,
  selectedTone,
  setSelectedTone,
  fanName,
  setFanName,
  modelName,
  setModelName
}: SiteSettingsAIProps) {
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
            custom_prompt: customPrompt,
            is_site_settings: true
          },
          history: messages,
          systemOverride: `You are a helpful AI assistant for configuring a fan engagement platform. The user may ask you to:
- Update the AI system prompt (respond with "SETTING:PROMPT:" followed by the new prompt)
- Change the reply tone (respond with "SETTING:TONE:" followed by friendly/flirty/spicy/explicit/sweet)
- Set the fan name (respond with "SETTING:FAN:" followed by the name)
- Set the model name (respond with "SETTING:MODEL:" followed by the name)

When you make changes, explain what you did naturally. You can make multiple changes at once.
Current settings:
- Tone: ${selectedTone}
- Fan name: ${fanName || "not set"}
- Model name: ${modelName || "not set"}
- Prompt length: ${customPrompt.length} characters

Always be helpful and conversational. If the user asks for something unrelated to settings, just have a normal conversation.`
        }
      });

      if (error) throw error;
      const aiResponse = data.response || data.result || "No response";
      
      // Parse any settings changes from the response
      parseAndApplySettings(aiResponse);
      
      setMessages(prev => [...prev, { role: "ai", content: cleanResponse(aiResponse) }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
      setMessages(prev => [...prev, { role: "ai", content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseAndApplySettings = (response: string) => {
    // Check for tone changes
    const toneMatch = response.match(/SETTING:TONE:(\w+)/i);
    if (toneMatch) {
      const newTone = toneMatch[1].toLowerCase() as ReplyTone;
      if (['friendly', 'flirty', 'spicy', 'explicit', 'sweet'].includes(newTone)) {
        setSelectedTone(newTone);
        toast.success(`Tone updated to ${newTone}`);
      }
    }

    // Check for fan name changes
    const fanMatch = response.match(/SETTING:FAN:([^\n]+)/i);
    if (fanMatch) {
      setFanName(fanMatch[1].trim());
      toast.success(`Fan name updated to ${fanMatch[1].trim()}`);
    }

    // Check for model name changes
    const modelMatch = response.match(/SETTING:MODEL:([^\n]+)/i);
    if (modelMatch) {
      setModelName(modelMatch[1].trim());
      toast.success(`Model name updated to ${modelMatch[1].trim()}`);
    }

    // Check for prompt changes
    const promptMatch = response.match(/SETTING:PROMPT:([\s\S]+?)(?=SETTING:|$)/i);
    if (promptMatch) {
      setCustomPrompt(promptMatch[1].trim());
      toast.success("AI prompt updated");
    }
  };

  const cleanResponse = (response: string) => {
    // Remove setting commands from visible response
    return response
      .replace(/SETTING:TONE:\w+/gi, '')
      .replace(/SETTING:FAN:[^\n]+/gi, '')
      .replace(/SETTING:MODEL:[^\n]+/gi, '')
      .replace(/SETTING:PROMPT:[\s\S]+?(?=SETTING:|$)/gi, '')
      .trim();
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
          <Settings className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">site settings ai</h2>
          <p className="text-xs text-muted-foreground">chat with ai to configure all site settings</p>
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
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">ask me to change settings...</p>
                  <p className="text-[10px] text-muted-foreground/70">e.g., "set tone to explicit" or "make the fan name Scott"</p>
                </div>
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
              placeholder="e.g., 'set tone to flirty' or 'update the prompt to be more playful'"
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
              current: tone={selectedTone}, fan={fanName || "fan"}, model={modelName || "model"}
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
                  <p className="text-xs text-muted-foreground">processing your request...</p>
                </div>
              </div>
            ) : lastAiMessage ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {lastAiMessage.content}
              </p>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Settings className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">ask me to change any site setting</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
