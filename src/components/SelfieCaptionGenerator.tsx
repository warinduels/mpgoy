import { useState, useRef } from "react";
import { Camera, Upload, Send, Copy, Check, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SelfieCaptionGeneratorProps {
  isUncensored: boolean;
}

export function SelfieCaptionGenerator({ isUncensored }: SelfieCaptionGeneratorProps) {
  const { secretKey } = useAuth();
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleGenerateCaption = async () => {
    if (!selfieImage) {
      toast.error("Please upload a selfie first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-caption`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "x-secret-key": secretKey || "",
          },
          body: JSON.stringify({
            selfieImage,
            additionalContext,
            isUncensored,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate caption");
      }

      const data = await response.json();
      setGeneratedCaption(data.caption || "");
      toast.success("Caption generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate caption");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCaption);
    setCopied(true);
    toast.success("Caption copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 shadow-lg border-border bg-card z-50">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">selfie caption generator</h3>
      </div>

      {/* Image Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-3 mb-3 transition-colors ${
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
              className="w-full h-32 object-cover rounded"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
              onClick={() => setSelfieImage(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-24 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              drop, paste, or click to upload selfie
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
        placeholder="optional: add context (mood, location, what you want to say...)"
        className="min-h-[60px] text-xs mb-3 resize-none"
        onPaste={handlePaste}
      />

      {/* Generate Button */}
      <Button
        onClick={handleGenerateCaption}
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
            <Send className="w-4 h-4 mr-2" />
            generate caption
          </>
        )}
      </Button>

      {/* Generated Caption */}
      {generatedCaption && (
        <div className="bg-muted/50 rounded-lg p-3 relative">
          <p className="text-sm text-foreground pr-8">{generatedCaption}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
