import { useState, useRef } from "react";
import { MessageSquare, Upload, Send, Sparkles, Copy, Check, Settings2, ChevronDown, ChevronUp, Users, Loader2, RefreshCw, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ReplyToneSelector, ReplyTone } from "@/components/ReplyToneSelector";
import { QuickReplies } from "@/components/QuickReplies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [contextDetails, setContextDetails] = useState("");
  // Session memory for fan/model conversations
  const [sessionHistory, setSessionHistory] = useState<Array<{fanName: string; modelName: string; fanMessage: string; reply: string}>>([]);
  const [lastRequestBody, setLastRequestBody] = useState<any>(null);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
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
          reader.onload = (event) => {
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
    const relevantHistory = sessionHistory.filter(
      h => h.fanName.toLowerCase().trim() === fanName.toLowerCase().trim() && 
           h.modelName.toLowerCase().trim() === modelName.toLowerCase().trim()
    );
    if (relevantHistory.length === 0) return "";
    return "PREVIOUS CONVERSATION HISTORY:\n" + relevantHistory.map(h => 
      `[${h.fanName} to ${h.modelName}] Fan: "${h.fanMessage}" → Reply: "${h.reply}"`
    ).join("\n");
  };

  const handleGenerateReply = async (isRegenerate = false) => {
    if (!isRegenerate && !fanMessage && !screenshotImage) {
      toast.error("Please enter a fan message or upload a screenshot");
      return;
    }

    setIsLoading(true);
    try {
      // Always use current tone, but reuse other fields if regenerating
      const baseBody = isRegenerate && lastRequestBody ? lastRequestBody : {
        modelContext: { name: modelName, gender: "", orientation: "", specialNotes: "" },
        fanNotes: contextDetails + "\n\n" + getSessionContext(),
        fanName: fanName,
        screenshotText: fanMessage,
        targetMessage: "",
        screenshotImage: screenshotImage,
        customPrompt: customPrompt,
      };
      
      // Always use the currently selected tone
      const requestBody = { ...baseBody, tone: selectedTone };

      if (!isRegenerate) {
        setLastRequestBody(baseBody);
      }

      const { data, error } = await supabase.functions.invoke("generate-reply", {
        body: requestBody,
      });

      if (error) throw error;
      const reply = data.merged_reply || "";
      setMergedReply(reply);
      setFanMessages(data.fan_messages || []);
      setConversationSummary(data.conversation_summary || "");

      // Save to session history
      if (reply && fanName && modelName) {
        setSessionHistory(prev => [...prev, {
          fanName,
          modelName,
          fanMessage: fanMessage || data.conversation_summary || "screenshot",
          reply
        }]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate reply");
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

  return (
    <div className="min-h-screen bg-background">
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
          <Button variant="outline" size="sm" className="text-xs">
            pro mode
          </Button>
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
              
              <Textarea
                placeholder="paste the fan's message here..."
                value={fanMessage}
                onChange={(e) => setFanMessage(e.target.value)}
                className="min-h-[100px] bg-muted/30 border-border resize-none"
              />

              {/* Fan to Model Context */}
              <div className="p-3 bg-muted/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3 text-primary" />
                  <span>conversation context</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">from</span>
                  <Input
                    placeholder="fan name (e.g., Scott)"
                    value={fanName}
                    onChange={(e) => setFanName(e.target.value)}
                    className="h-8 text-xs bg-background/50 flex-1"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    placeholder="model name (e.g., Ruby)"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="h-8 text-xs bg-background/50 flex-1"
                  />
                </div>
                <Textarea
                  placeholder="additional context about this fan or model (e.g., 'he's a big spender', 'she likes being called babe', 'he mentioned his birthday last week')..."
                  value={contextDetails}
                  onChange={(e) => setContextDetails(e.target.value)}
                  className="min-h-[60px] text-xs bg-background/50 border-border resize-none"
                />
              </div>

              {screenshotImage && (
                <div className="relative">
                  <img src={screenshotImage} alt="Screenshot" className="max-h-40 rounded-lg" />
                  <button
                    onClick={() => setScreenshotImage(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    upload screenshot
                  </button>
                  <button
                    onClick={handlePaste}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    or paste from clipboard
                  </button>
                </div>
                <Button
                  onClick={() => handleGenerateReply(false)}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  generate reply
                </Button>
              </div>
            </Card>

            {/* Generated Replies or Empty State */}
            <Card className="p-6 min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[150px]">
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
                </div>
              ) : mergedReply ? (
                <div className="w-full space-y-4">
                  {/* Tone Label */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {selectedTone}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleGenerateReply(true)}
                        disabled={isLoading}
                        className="gap-2"
                      >
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
                    <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">
                        {mergedReply}
                      </p>
                    </div>
                  </div>
                  
                  {/* Context info collapsed */}
                  {(fanMessages.length > 0 || conversationSummary) && (
                    <Collapsible>
                      <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" />
                        show context
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {fanMessages.length > 0 && (
                          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded space-y-1">
                            <strong>Fan messages detected:</strong>
                            <ul className="list-disc list-inside">
                              {fanMessages.map((msg, i) => (
                                <li key={i}>{msg}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {conversationSummary && (
                          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                            <strong>Summary:</strong> {conversationSummary}
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Session memory indicator */}
                  {sessionHistory.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {sessionHistory.length} conversation(s) remembered this session
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[150px]">
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
                </div>
              )}
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
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom AI prompt..."
                    className="min-h-[200px] text-xs bg-muted/30 border-border resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    customize how the ai responds to fan messages
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            
            <Card className="p-4">
              <QuickReplies onSelect={handleQuickReply} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
