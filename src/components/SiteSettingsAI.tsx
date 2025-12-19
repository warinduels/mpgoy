import { useState } from "react";
import { MessageSquare, Send, Loader2, Copy, Check, Sparkles, Bot, Settings, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  isUncensored: boolean;
  setIsUncensored: (value: boolean) => void;
}
interface SettingChange {
  setting: string;
  oldValue: string;
  newValue: string;
}
interface ChatMessage {
  role: "user" | "ai";
  content: string;
  changes?: SettingChange[];
}
export function SiteSettingsAI({
  customPrompt,
  setCustomPrompt,
  selectedTone,
  setSelectedTone,
  fanName,
  setFanName,
  modelName,
  setModelName,
  isUncensored,
  setIsUncensored
}: SiteSettingsAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastChanges, setLastChanges] = useState<SettingChange[]>([]);
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    const userMessage = currentMessage.trim();
    setMessages(prev => [...prev, {
      role: "user",
      content: userMessage
    }]);
    setCurrentMessage("");
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("ai-chat", {
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
- Toggle uncensored mode (respond with "SETTING:UNCENSORED:true" or "SETTING:UNCENSORED:false")

When you make changes, explain what you did naturally. You can make multiple changes at once.
Current settings:
- Tone: ${selectedTone}
- Fan name: ${fanName || "not set"}
- Model name: ${modelName || "not set"}
- Uncensored mode: ${isUncensored ? "enabled" : "disabled"}
- Prompt length: ${customPrompt.length} characters

Always be helpful and conversational. If the user asks for something unrelated to settings, just have a normal conversation.`
        }
      });
      if (error) throw error;
      const aiResponse = data.response || data.result || "No response";

      // Parse any settings changes from the response
      const changes = parseAndApplySettings(aiResponse);
      setLastChanges(changes);
      setMessages(prev => [...prev, {
        role: "ai",
        content: cleanResponse(aiResponse),
        changes
      }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
      setMessages(prev => [...prev, {
        role: "ai",
        content: `Error: ${err.message}`
      }]);
      setLastChanges([]);
    } finally {
      setIsLoading(false);
    }
  };
  const parseAndApplySettings = (response: string): SettingChange[] => {
    const changes: SettingChange[] = [];

    // Check for tone changes
    const toneMatch = response.match(/SETTING:TONE:(\w+)/i);
    if (toneMatch) {
      const newTone = toneMatch[1].toLowerCase() as ReplyTone;
      if (['friendly', 'flirty', 'spicy', 'explicit', 'sweet'].includes(newTone)) {
        changes.push({
          setting: 'Tone',
          oldValue: selectedTone,
          newValue: newTone
        });
        setSelectedTone(newTone);
      }
    }

    // Check for fan name changes
    const fanMatch = response.match(/SETTING:FAN:([^\n]+)/i);
    if (fanMatch) {
      const newFan = fanMatch[1].trim();
      changes.push({
        setting: 'Fan Name',
        oldValue: fanName || 'not set',
        newValue: newFan
      });
      setFanName(newFan);
    }

    // Check for model name changes
    const modelMatch = response.match(/SETTING:MODEL:([^\n]+)/i);
    if (modelMatch) {
      const newModel = modelMatch[1].trim();
      changes.push({
        setting: 'Model Name',
        oldValue: modelName || 'not set',
        newValue: newModel
      });
      setModelName(newModel);
    }

    // Check for prompt changes
    const promptMatch = response.match(/SETTING:PROMPT:([\s\S]+?)(?=SETTING:|$)/i);
    if (promptMatch) {
      changes.push({
        setting: 'AI Prompt',
        oldValue: `${customPrompt.length} chars`,
        newValue: 'updated'
      });
      setCustomPrompt(promptMatch[1].trim());
    }

    // Check for uncensored mode changes
    const uncensoredMatch = response.match(/SETTING:UNCENSORED:(true|false)/i);
    if (uncensoredMatch) {
      const newValue = uncensoredMatch[1].toLowerCase() === 'true';
      changes.push({
        setting: 'Uncensored',
        oldValue: isUncensored ? 'on' : 'off',
        newValue: newValue ? 'on' : 'off'
      });
      setIsUncensored(newValue);
    }
    if (changes.length > 0) {
      toast.success(`${changes.length} setting(s) updated`);
    }
    return changes;
  };
  const cleanResponse = (response: string) => {
    // Remove setting commands from visible response
    return response.replace(/SETTING:TONE:\w+/gi, '').replace(/SETTING:FAN:[^\n]+/gi, '').replace(/SETTING:MODEL:[^\n]+/gi, '').replace(/SETTING:PROMPT:[\s\S]+?(?=SETTING:|$)/gi, '').replace(/SETTING:UNCENSORED:(true|false)/gi, '').trim();
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
  return;
}