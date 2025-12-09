import { useState } from "react";
import { Code, Play, Terminal, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PythonHandlerSectionProps {
  customPrompt: string;
  selectedTone: string;
  fanName: string;
  modelName: string;
}

export function PythonHandlerSection({ 
  customPrompt, 
  selectedTone, 
  fanName, 
  modelName 
}: PythonHandlerSectionProps) {
  const [handlerCode, setHandlerCode] = useState(`# Python-style handler for AI integration
# This code is sent to AI for execution/interpretation

def handle_message(fan_message, context):
    """
    Process fan message and return AI instructions
    
    Args:
        fan_message: The incoming fan message
        context: Dict with tone, fan_name, model_name
    
    Returns:
        Custom instructions for reply generation
    """
    # Add your custom logic here
    instructions = f"Reply as {context['model_name']} to {context['fan_name']}"
    
    if context['tone'] == 'explicit':
        instructions += " with explicit, uncensored content"
    elif context['tone'] == 'flirty':
        instructions += " with flirty, suggestive undertones"
    
    return instructions
`);
  const [aiResponse, setAiResponse] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunHandler = async () => {
    if (!handlerCode.trim()) {
      toast.error("Please enter handler code first");
      return;
    }

    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("execute-handler", {
        body: {
          handlerCode,
          context: {
            tone: selectedTone,
            fan_name: fanName || "fan",
            model_name: modelName || "model",
            custom_prompt: customPrompt
          }
        }
      });

      if (error) throw error;
      setAiResponse(data.result || data.response || JSON.stringify(data, null, 2));
      toast.success("Handler executed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to execute handler");
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    toast.success("Response copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Code className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">python handler</h2>
          <p className="text-xs text-muted-foreground">custom code integration with ai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="w-3 h-3" />
              <span>handler code</span>
            </div>
            <Button
              size="sm"
              onClick={handleRunHandler}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              run
            </Button>
          </div>
          <Textarea
            value={handlerCode}
            onChange={(e) => setHandlerCode(e.target.value)}
            placeholder="# Enter your Python-style handler code..."
            className="min-h-[300px] font-mono text-xs bg-muted/30 border-border resize-none"
          />
          <p className="text-xs text-muted-foreground">
            applies to: tone={selectedTone}, fan={fanName || "fan"}, model={modelName || "model"}
          </p>
        </div>

        {/* AI Response */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>ai response</span>
            </div>
            {aiResponse && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="gap-2 h-7"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "copied" : "copy"}
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px] rounded-lg border border-border bg-background/50 p-4">
            {isRunning ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">executing handler...</p>
                </div>
              </div>
            ) : aiResponse ? (
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                {aiResponse}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Terminal className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">run your handler to see ai response</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
