import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModelContextForm, ModelContext } from "@/components/ModelContextForm";
import { FanNotesForm } from "@/components/FanNotesForm";
import { ScreenshotTextForm } from "@/components/ScreenshotTextForm";
import { GeneratedReply } from "@/components/GeneratedReply";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, MessageSquare, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [modelContext, setModelContext] = useState<ModelContext>({
    name: "",
    gender: "",
    orientation: "",
    specialNotes: "",
  });
  
  const [fanNotes, setFanNotes] = useState("");
  const [screenshotText, setScreenshotText] = useState("");
  const [targetMessage, setTargetMessage] = useState("");
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  
  const [generatedReply, setGeneratedReply] = useState<{
    reply: string;
    persona_note: string;
    translation: string | null;
    replied_to: string;
    detected_messages?: string | null;
  } | null>(null);

  const handleGenerate = async () => {
    if (!modelContext.name || !modelContext.gender || !modelContext.orientation) {
      toast({
        title: "Missing Model Context",
        description: "Please fill in the model name, gender, and orientation.",
        variant: "destructive",
      });
      return;
    }

    // Need either screenshot image or text
    if (!screenshotImage && !screenshotText.trim()) {
      toast({
        title: "Missing Chat Content",
        description: "Please upload a screenshot or paste the chat text.",
        variant: "destructive",
      });
      return;
    }

    // For text mode, require target message
    if (!screenshotImage && !targetMessage.trim()) {
      toast({
        title: "Missing Target Message",
        description: "Please specify the timestamp of the message to reply to.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedReply(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reply", {
        body: {
          modelContext,
          fanNotes,
          screenshotText: screenshotImage ? null : screenshotText,
          targetMessage,
          screenshotImage,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedReply(data);
      
      toast({
        title: "Reply Generated!",
        description: screenshotImage 
          ? "AI analyzed your screenshot and generated a personalized reply."
          : "Your personalized reply is ready to copy.",
      });
    } catch (error) {
      console.error("Error generating reply:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setModelContext({
      name: "",
      gender: "",
      orientation: "",
      specialNotes: "",
    });
    setFanNotes("");
    setScreenshotText("");
    setTargetMessage("");
    setScreenshotImage(null);
    setGeneratedReply(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Chatter</h1>
                <p className="text-xs text-muted-foreground">FanVue & OnlyFans Reply Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                Universal System
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Intro */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Generate Emotionally Intelligent Replies
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional chatter system that adapts to any model persona. 
              Upload a screenshot or paste chat text, and get personalized replies instantly.
            </p>
          </div>

          {/* Form Cards */}
          <div className="grid gap-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6">
                <ModelContextForm value={modelContext} onChange={setModelContext} />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6">
                <FanNotesForm value={fanNotes} onChange={setFanNotes} />
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6">
                <ScreenshotTextForm
                  screenshotText={screenshotText}
                  targetMessage={targetMessage}
                  screenshotImage={screenshotImage}
                  onScreenshotTextChange={setScreenshotText}
                  onTargetMessageChange={setTargetMessage}
                  onScreenshotImageChange={setScreenshotImage}
                />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              size="lg"
              className="gap-2 min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {screenshotImage ? "Analyzing..." : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Reply
                </>
              )}
            </Button>
            
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              disabled={isLoading}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Clear All
            </Button>
          </div>

          {/* Generated Reply */}
          {generatedReply && (
            <div className="pt-6">
              <GeneratedReply
                reply={generatedReply.reply}
                personaNote={generatedReply.persona_note}
                translation={generatedReply.translation}
                repliedTo={generatedReply.replied_to}
                detectedMessages={generatedReply.detected_messages}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            AI Chatter System • Designed for professional content creators
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
