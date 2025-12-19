import { useState, useRef } from "react";
import { Camera, Copy, Check, Loader2, X, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface CaptionVariation {
  category: string;
  caption: string;
}

interface SelfieCaptionGeneratorProps {
  isUncensored: boolean;
  model?: string;
}

export function SelfieCaptionGenerator({ isUncensored, model = "google/gemini-2.5-flash" }: SelfieCaptionGeneratorProps) {
  const { secretKey } = useAuth();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState("");
  const [captions, setCaptions] = useState<CaptionVariation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelfieImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setSelfieImage(event.target?.result as string);
              toast.success("Image pasted");
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelfieImage(event.target?.result as string);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!selfieImage) {
      toast.error("Please upload a selfie first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaptions([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-caption`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "x-secret-key": secretKey || "",
          },
          body: JSON.stringify({
            selfieImage,
            additionalContext,
            isUncensored,
            model,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null as null | { error?: string });

        const msg =
          errorData?.error ||
          (response.status === 402
            ? "AI credits exhausted. Please add credits and try again."
            : response.status === 429
              ? "Rate limited. Please wait ~60 seconds and try again."
              : "Failed to generate captions");

        setError(msg);
        toast.error(msg);
        return;
      }

      const data = await response.json();
      setCaptions(data.captions || []);
      toast.success("Captions generated!");
    } catch (err: any) {
      const msg = err?.message || "Failed to generate captions";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (caption: string, index: number) => {
    await navigator.clipboard.writeText(caption);
    setCopiedIndex(index);
    toast.success("Caption copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const categoryColors: Record<string, string> = {
    "ppv tease": "bg-pink-500/20 text-pink-500 border-pink-500/30",
    "casual": "bg-blue-500/20 text-blue-500 border-blue-500/30",
    "flirty": "bg-purple-500/20 text-purple-500 border-purple-500/30",
    "seductive": "bg-red-500/20 text-red-500 border-red-500/30",
    "sweet": "bg-orange-500/20 text-orange-500 border-orange-500/30",
  };

  if (isMinimized) {
    return (
      <Card 
        className="fixed bottom-4 right-4 p-3 shadow-lg border-border bg-card z-50 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">selfie captions</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg border-border bg-card z-50 max-h-[85vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">selfie captions</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsMinimized(true)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="p-3">
        {/* Image Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-2 mb-3 transition-colors ${
            selfieImage ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
        >
          {selfieImage ? (
            <div className="relative">
              <img
                src={selfieImage}
                alt="Selfie preview"
                className="w-full h-24 object-cover rounded"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 bg-background/80 hover:bg-background"
                onClick={() => {
                  setSelfieImage(null);
                  setCaptions([]);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
              <p className="text-[10px] text-muted-foreground text-center">
                drop, paste, or click to upload
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Additional Context */}
        <Textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="optional: mood, what you want to say..."
          className="min-h-[50px] text-xs mb-3 resize-none"
          onPaste={handlePaste}
        />

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertTitle className="text-xs">can’t generate right now</AlertTitle>
            <AlertDescription>
              <p className="text-xs">{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerateCaptions}
          disabled={!selfieImage || isLoading}
          className="w-full mb-3"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              generate captions
            </>
          )}
        </Button>

        {/* Generated Captions - Larger display for detailed captions */}
        {captions.length > 0 && (
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-3">
              {captions.map((item, index) => (
                <div
                  key={index}
                  className="bg-muted/50 rounded-lg p-3 relative group cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleCopy(item.caption, index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${categoryColors[item.category] || "bg-muted"}`}
                    >
                      {item.category}
                    </Badge>
                    <div>
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.caption}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}
