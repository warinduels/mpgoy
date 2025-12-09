import { useState, useRef, useEffect } from "react";
import { MessageSquare, Upload, Send, Sparkles, Copy, Check, Settings2, ChevronDown, ChevronUp, Users, Loader2, RefreshCw, Flame, Bot, User, ShieldOff, Shield, Zap, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ReplyToneSelector, ReplyTone } from "@/components/ReplyToneSelector";
import { QuickReplies } from "@/components/QuickReplies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { SiteSettingsAI } from "@/components/SiteSettingsAI";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReplyHistory } from "@/components/ReplyHistory";
import { RandomMessageGenerator } from "@/components/RandomMessageGenerator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
interface InstructionMessage {
  role: "user" | "ai";
  content: string;
}
export default function Index() {
  const [fanMessage, setFanMessage] = useState("");
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<ReplyTone>("flirty");
  const [mergedReply, setMergedReply] = useState("");
  const [fanMessages, setFanMessages] = useState<string[]>([]);
  const [conversationSummary, setConversationSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [fanName, setFanName] = useState("");
  const [modelName, setModelName] = useState("");
  // AI Instruction Chat
  const [instructionMessages, setInstructionMessages] = useState<InstructionMessage[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState("");
  // Per-model instruction memory (persists throughout session)
  const [modelInstructionMemory, setModelInstructionMemory] = useState<Record<string, InstructionMessage[]>>({});
  // Session memory for fan/model conversations
  const [sessionHistory, setSessionHistory] = useState<Array<{
    fanName: string;
    modelName: string;
    fanMessage: string;
    reply: string;
  }>>([]);
  const [lastRequestBody, setLastRequestBody] = useState<any>(null);
  const [previousReply, setPreviousReply] = useState("");
  const [isUncensored, setIsUncensored] = useState(() => {
    return sessionStorage.getItem('uncensoredMode') === 'true';
  });
  const [showUncensoredDialog, setShowUncensoredDialog] = useState(false);
  // Track if user has already confirmed uncensored mode this session
  const [hasConfirmedUncensored, setHasConfirmedUncensored] = useState(() => {
    return sessionStorage.getItem('uncensoredConfirmed') === 'true';
  });
  // AI Token usage tracking
  const [requestCount, setRequestCount] = useState(() => {
    const stored = sessionStorage.getItem('aiRequestCount');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [sessionStartTime] = useState(() => {
    const stored = sessionStorage.getItem('sessionStartTime');
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    sessionStorage.setItem('sessionStartTime', now.toString());
    return now;
  });

  // Estimate rate limit thresholds (rough estimates for Lovable AI)
  const RATE_LIMIT_WARNING = 40; // Show warning at 40 requests
  const RATE_LIMIT_DANGER = 55; // Show danger at 55 requests
  const RATE_LIMIT_MAX = 60; // Estimated max per minute window

  const getUsageStatus = () => {
    if (requestCount >= RATE_LIMIT_DANGER) return 'danger';
    if (requestCount >= RATE_LIMIT_WARNING) return 'warning';
    return 'ok';
  };
  const [customPrompt, setCustomPrompt] = useState(`You are a professional chatter managing multiple models across FanVue and OnlyFans platforms. Your primary function is to generate emotionally intelligent, retention-focused replies that maintain appropriate tone for each model's persona.

IDENTITY & FORMAT RULES:
- Adopt the persona specified in the MODEL CONTEXT
- Output Format: All replies lowercase only, one complete sentence, emojis only at the very end
- Sound natural and human—avoid robotic phrasing

TONE BY MODEL TYPE:
- Female models (straight): Flirty, suggestive, emotionally available
- Gay male models: Can be more direct, campy, or masculine depending on persona notes
- All models: Maintain sexual energy appropriate to their persona

MESSAGE PROCESSING:
- Reply ONLY to the target message (or the last fan message if no specific target)
- IGNORE: Green bubbles, checkmarks (✓), and any messages quoting the model's previous text
- Multiple fan messages in sequence = consolidate sentiment, reply to last one

DYNAMIC TONE ADAPTATION:
- Use FAN NOTES to personalize: Reference their preferences, acknowledge past interactions
- Use MODEL CONTEXT to tailor language and energy
- Universal techniques: Future faking, personalized praise, vulnerability mirroring, validation phrases`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousModelName = useRef<string>("");

  // Handle model name changes - save/restore instructions per model
  useEffect(() => {
    const prevModel = previousModelName.current.toLowerCase().trim();
    const currentModel = modelName.toLowerCase().trim();
    
    // If model name was cleared, clear instructions
    if (!currentModel && prevModel) {
      // Save current instructions to previous model before clearing
      if (instructionMessages.length > 0) {
        setModelInstructionMemory(prev => ({
          ...prev,
          [prevModel]: instructionMessages
        }));
      }
      setInstructionMessages([]);
    }
    // If switching to a different model
    else if (currentModel && currentModel !== prevModel) {
      // Save current instructions to previous model (if any)
      if (prevModel && instructionMessages.length > 0) {
        setModelInstructionMemory(prev => ({
          ...prev,
          [prevModel]: instructionMessages
        }));
      }
      // Restore instructions for new model if they exist
      const savedInstructions = modelInstructionMemory[currentModel];
      if (savedInstructions && savedInstructions.length > 0) {
        setInstructionMessages(savedInstructions);
      } else if (prevModel) {
        // Only clear if we're switching models, not on initial load
        setInstructionMessages([]);
      }
    }
    
    previousModelName.current = modelName;
  }, [modelName]);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setScreenshotImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
          const blob = await item.getType(item.types.find(t => t.startsWith("image/"))!);
          const reader = new FileReader();
          reader.onload = event => {
            setScreenshotImage(event.target?.result as string);
            toast.success("Image pasted from clipboard");
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      toast.error("No image found in clipboard");
    } catch (err) {
      toast.error("Failed to read clipboard");
    }
  };

  // Build session context from history - only match when BOTH fan AND model names match exactly
  const getSessionContext = () => {
    // Only show history when specific names are provided (not generic terms)
    const genericNames = ['fan', 'model', 'unknown', ''];
    const isFanGeneric = genericNames.includes(fanName.toLowerCase().trim());
    const isModelGeneric = genericNames.includes(modelName.toLowerCase().trim());

    // If either name is generic, don't include history (treat as new conversation)
    if (isFanGeneric || isModelGeneric) return "";

    // Only match when BOTH fan AND model names match exactly
    const relevantHistory = sessionHistory.filter(h => h.fanName.toLowerCase().trim() === fanName.toLowerCase().trim() && h.modelName.toLowerCase().trim() === modelName.toLowerCase().trim());
    if (relevantHistory.length === 0) return "";
    return "PREVIOUS CONVERSATION HISTORY:\n" + relevantHistory.map(h => `[${h.fanName} to ${h.modelName}] Fan: "${h.fanMessage}" → Reply: "${h.reply}"`).join("\n");
  };
  const handleGenerateReply = async (isRegenerate = false) => {
    if (!isRegenerate && !fanMessage && !screenshotImage) {
      toast.error("Please enter a fan message or upload a screenshot");
      return;
    }
    setIsLoading(true);
    try {
      // Always build fresh request with current values - only reuse message/image if regenerating
      // IMPORTANT: Always use current isUncensored state, not cached value
      const requestBody = {
        modelContext: {
          name: modelName || "model",
          gender: "",
          orientation: "",
          specialNotes: ""
        },
        fanNotes: instructionMessages.map(m => `${m.role === 'user' ? 'INSTRUCTION' : 'AI'}: ${m.content}`).join('\n') + "\n\n" + getSessionContext() + (previousReply ? `\n\nPREVIOUS REPLY (DO NOT REPEAT THIS - generate something completely different): "${previousReply}"` : ""),
        fanName: fanName || "fan",
        screenshotText: isRegenerate && lastRequestBody ? lastRequestBody.screenshotText : fanMessage,
        targetMessage: "",
        screenshotImage: isRegenerate && lastRequestBody ? lastRequestBody.screenshotImage : screenshotImage,
        customPrompt: customPrompt,
        tone: selectedTone,
        isUncensored: isUncensored,
        // Always use current state, never cached
        // Add random seed to force different responses
        seed: Math.random().toString(36).substring(7)
      };
      if (!isRegenerate) {
        setLastRequestBody(requestBody);
      }
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-reply", {
        body: requestBody
      });
      if (error) throw error;
      const reply = data.merged_reply || "";
      setPreviousReply(mergedReply); // Store current reply before updating
      setMergedReply(reply);
      setFanMessages(data.fan_messages || []);
      setConversationSummary(data.conversation_summary || "");

      // Add AI response to instruction chat
      if (isRegenerate && currentInstruction) {
        setInstructionMessages(prev => [...prev, {
          role: "ai",
          content: `Generated new reply based on your instruction.`
        }]);
      }

      // Save to session history
      if (reply && fanName && modelName) {
        setSessionHistory(prev => [...prev, {
          fanName,
          modelName,
          fanMessage: fanMessage || data.conversation_summary || "screenshot",
          reply
        }]);
      }

      // Track request count
      const newCount = requestCount + 1;
      setRequestCount(newCount);
      sessionStorage.setItem('aiRequestCount', newCount.toString());

      // Warn if approaching limit
      if (newCount === RATE_LIMIT_WARNING) {
        toast.warning('AI usage getting high - you may hit rate limits soon');
      } else if (newCount === RATE_LIMIT_DANGER) {
        toast.error('AI usage very high - slow down to avoid rate limits');
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to generate reply";
      if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        toast.error('Rate limit hit! Wait a moment before trying again.');
      } else if (errorMsg.includes('402')) {
        toast.error('AI credits exhausted. Please add more credits.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleQuickReply = (reply: string) => {
    setMergedReply(reply);
    setFanMessages([]);
    setConversationSummary("");
    toast.success("Quick reply selected");
  };
  const handleCopy = async () => {
    await navigator.clipboard.writeText(mergedReply);
    setCopied(true);
    toast.success("Reply copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
                mpgoy chattergoy 💦😘
              </h1>
              <p className="text-xs text-muted-foreground">your fanvue chatter assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${isUncensored ? 'bg-red-500/20 border border-red-500/50' : 'bg-muted/50 border border-border'}`} onClick={() => {
            if (!isUncensored) {
              // Only show dialog if not confirmed this session
              if (hasConfirmedUncensored) {
                setIsUncensored(true);
                sessionStorage.setItem('uncensoredMode', 'true');
                toast.success('Uncensored mode enabled');
              } else {
                setShowUncensoredDialog(true);
              }
            } else {
              setIsUncensored(false);
              sessionStorage.setItem('uncensoredMode', 'false');
              toast.success('Censored mode enabled');
            }
          }}>
              {isUncensored ? <ShieldOff className="w-4 h-4 text-red-500" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
              <span className={`text-xs font-medium ${isUncensored ? 'text-red-500' : 'text-muted-foreground'}`}>
                {isUncensored ? 'uncensored' : 'censored'}
              </span>
              <Switch checked={isUncensored} onCheckedChange={checked => {
              if (checked) {
                // Only show dialog if not confirmed this session
                if (hasConfirmedUncensored) {
                  setIsUncensored(true);
                  sessionStorage.setItem('uncensoredMode', 'true');
                  toast.success('Uncensored mode enabled');
                } else {
                  setShowUncensoredDialog(true);
                }
              } else {
                setIsUncensored(false);
                sessionStorage.setItem('uncensoredMode', 'false');
                toast.success('Censored mode enabled');
              }
            }} className="scale-75" />
            </div>
            
            {/* AI Usage Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-help transition-all ${getUsageStatus() === 'danger' ? 'bg-destructive/20 border border-destructive/50 text-destructive animate-pulse' : getUsageStatus() === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400' : 'bg-muted/50 border border-border text-muted-foreground'}`}>
                    {getUsageStatus() === 'danger' ? <AlertTriangle className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    <span>{requestCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-xs">
                    <strong>AI Requests:</strong> {requestCount} this session
                    <br />
                    {getUsageStatus() === 'danger' ? '⚠️ Very high usage - slow down!' : getUsageStatus() === 'warning' ? '⚠️ Approaching rate limits' : '✓ Usage normal'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <ThemeToggle />
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Fan Message Input */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>fan message</span>
              </div>
              
              <Textarea placeholder="paste the fan's message here..." value={fanMessage} onChange={e => setFanMessage(e.target.value)} className="min-h-[100px] bg-muted/30 border-border resize-none" />

              {/* Fan to Model Context */}
              <div className="p-3 bg-muted/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3 text-primary" />
                  <span>conversation context</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">from</span>
                  <Input placeholder="fan name (e.g., Scott)" value={fanName} onChange={e => setFanName(e.target.value)} className="h-8 text-xs bg-background/50 flex-1" />
                  <span className="text-muted-foreground">to</span>
                  <Input placeholder="model name (e.g., Ruby)" value={modelName} onChange={e => setModelName(e.target.value)} className="h-8 text-xs bg-background/50 flex-1" />
                </div>
                {/* AI Instruction Chat */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bot className="w-3 h-3 text-primary" />
                    <span>ai instructions</span>
                  </div>
                  
                  {instructionMessages.length > 0 && <ScrollArea className="h-24 rounded border border-border bg-background/30 p-2">
                      <div className="space-y-2">
                        {instructionMessages.map((msg, i) => <div key={i} className={`flex items-start gap-2 text-xs ${msg.role === 'user' ? '' : 'opacity-70'}`}>
                            {msg.role === 'user' ? <User className="w-3 h-3 text-primary shrink-0 mt-0.5" /> : <Bot className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />}
                            <span>{msg.content}</span>
                          </div>)}
                      </div>
                    </ScrollArea>}
                  
                  <div className="flex gap-2">
                    <Input placeholder="give instructions (e.g., 'ask his name', 'make it more flirty', 'mention how wet you are')..." value={currentInstruction} onChange={e => setCurrentInstruction(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && currentInstruction.trim()) {
                      const newInstruction: InstructionMessage = { role: "user", content: currentInstruction };
                      setInstructionMessages(prev => {
                        const updated = [...prev, newInstruction];
                        // Also save to model memory
                        const currentModel = modelName.toLowerCase().trim();
                        if (currentModel) {
                          setModelInstructionMemory(mem => ({ ...mem, [currentModel]: updated }));
                        }
                        return updated;
                      });
                      setCurrentInstruction("");
                    }
                  }} className="h-8 text-xs bg-background/50 flex-1" />
                    <Button size="sm" variant="outline" onClick={() => {
                    if (currentInstruction.trim()) {
                      const newInstruction: InstructionMessage = { role: "user", content: currentInstruction };
                      setInstructionMessages(prev => {
                        const updated = [...prev, newInstruction];
                        // Also save to model memory
                        const currentModel = modelName.toLowerCase().trim();
                        if (currentModel) {
                          setModelInstructionMemory(mem => ({ ...mem, [currentModel]: updated }));
                        }
                        return updated;
                      });
                      setCurrentInstruction("");
                    }
                  }} className="h-8 px-2">
                      <Send className="w-3 h-3" />
                    </Button>
                    {instructionMessages.length > 0 && <Button size="sm" variant="ghost" onClick={() => {
                      setInstructionMessages([]);
                      // Also clear from model memory
                      const currentModel = modelName.toLowerCase().trim();
                      if (currentModel) {
                        setModelInstructionMemory(mem => {
                          const updated = { ...mem };
                          delete updated[currentModel];
                          return updated;
                        });
                      }
                    }} className="h-8 px-2 text-xs">
                        clear
                      </Button>}
                  </div>
                </div>
              </div>

              {screenshotImage && <div className="relative">
                  <img src={screenshotImage} alt="Screenshot" className="max-h-40 rounded-lg" />
                  <button onClick={() => setScreenshotImage(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">
                    ×
                  </button>
                </div>}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="w-4 h-4" />
                    upload screenshot
                  </button>
                  <button onClick={handlePaste} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    or paste from clipboard
                  </button>
                </div>
                <Button onClick={() => handleGenerateReply(false)} disabled={isLoading} className="gap-2">
                  <Send className="w-4 h-4" />
                  generate reply
                </Button>
              </div>
            </Card>

            {/* Generated Replies or Empty State */}
            <Card className="p-6 min-h-[200px]">
              {isLoading ? <div className="flex items-center justify-center min-h-[150px]">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-foreground">analyzing conversation...</h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                        reading messages and generating personalized replies for each fan message
                      </p>
                    </div>
                  </div>
                </div> : mergedReply ? <div className="w-full space-y-4">
                  {/* Tone Label + Uncensored Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {selectedTone}
                      </span>
                      {isUncensored && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-[10px] font-medium">
                          <ShieldOff className="w-3 h-3" />
                          uncensored
                        </span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleGenerateReply(true)} disabled={isLoading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        regenerate
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "copied" : "copy"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Reply Bubble - styled like reference */}
                  <div className="space-y-3">
                    <div className={`flex items-start gap-3 p-4 rounded-xl ${isUncensored ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted/40'}`}>
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isUncensored ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-orange-500 to-red-500'}`}>
                        <Flame className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">
                        {mergedReply}
                      </p>
                    </div>
                  </div>
                  
                  {/* Context info collapsed */}
                  {(fanMessages.length > 0 || conversationSummary) && <Collapsible>
                      <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" />
                        show context
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {fanMessages.length > 0 && <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded space-y-1">
                            <strong>Fan messages detected:</strong>
                            <ul className="list-disc list-inside">
                              {fanMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                          </div>}
                        {conversationSummary && <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                            <strong>Summary:</strong> {conversationSummary}
                          </p>}
                      </CollapsibleContent>
                    </Collapsible>}

                  {/* Session memory indicator */}
                  {sessionHistory.length > 0 && <p className="text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {sessionHistory.length} conversation(s) remembered this session
                    </p>}
                </div> : <div className="flex items-center justify-center min-h-[150px]">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-foreground">ready to craft the perfect reply</h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                        paste a fan message or upload a screenshot and get one consolidated reply
                      </p>
                    </div>
                  </div>
                </div>}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="p-4">
              <ReplyToneSelector selected={selectedTone} onSelect={setSelectedTone} />
            </Card>
            
            {/* AI Prompt Settings */}
            <Card className="p-4">
              <Collapsible open={showPrompt} onOpenChange={setShowPrompt}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Settings2 className="w-4 h-4 text-primary" />
                      <span>ai prompt settings</span>
                    </div>
                    {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Enter your custom AI prompt..." className="min-h-[200px] text-xs bg-muted/30 border-border resize-none" />
                  <p className="text-xs text-muted-foreground mt-2">
                    customize how the ai responds to fan messages
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            
            <Card className="p-4">
              <QuickReplies onSelect={handleQuickReply} />
            </Card>

            <Card className="p-4">
              <ReplyHistory history={sessionHistory} onSelect={reply => {
              setMergedReply(reply);
              toast.success("Reply loaded from history");
            }} onClear={() => {
              setSessionHistory([]);
              toast.success("History cleared");
            }} />
            </Card>
          </div>
        </div>

        {/* Site Settings AI */}
        <SiteSettingsAI customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} selectedTone={selectedTone} setSelectedTone={setSelectedTone} fanName={fanName} setFanName={setFanName} modelName={modelName} setModelName={setModelName} isUncensored={isUncensored} setIsUncensored={setIsUncensored} />

        {/* Uncensored Mode Confirmation Dialog */}
        <AlertDialog open={showUncensoredDialog} onOpenChange={setShowUncensoredDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldOff className="w-5 h-5 text-red-500" />
                Enable Uncensored Mode?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This mode will generate explicit, adult content without restrictions. 
                By enabling this, you confirm that you are of legal age and accept 
                responsibility for the content generated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
              setIsUncensored(true);
              setHasConfirmedUncensored(true);
              sessionStorage.setItem('uncensoredMode', 'true');
              sessionStorage.setItem('uncensoredConfirmed', 'true');
              toast.success('Uncensored mode enabled');
            }} className="bg-red-500 hover:bg-red-600">
                Enable Uncensored
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <RandomMessageGenerator />
      </main>
    </div>;
}