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
export function SelfieCaptionGenerator({
  isUncensored,
  model = "google/gemini-2.5-flash"
}: SelfieCaptionGeneratorProps) {
  const {
    secretKey
  } = useAuth();
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
      reader.onload = event => {
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
            reader.onload = event => {
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
      reader.onload = event => {
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-caption`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "x-secret-key": secretKey || ""
        },
        body: JSON.stringify({
          selfieImage,
          additionalContext,
          isUncensored,
          model
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null as null | {
          error?: string;
        });
        const msg = errorData?.error || (response.status === 402 ? "AI credits exhausted. Please add credits and try again." : response.status === 429 ? "Rate limited. Please wait ~60 seconds and try again." : "Failed to generate captions");
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
    "moment": "bg-amber-500/20 text-amber-500 border-amber-500/30",
    "ppv tease": "bg-pink-500/20 text-pink-500 border-pink-500/30",
    "casual": "bg-blue-500/20 text-blue-500 border-blue-500/30",
    "flirty": "bg-purple-500/20 text-purple-500 border-purple-500/30",
    "seductive": "bg-red-500/20 text-red-500 border-red-500/30",
    "sweet": "bg-orange-500/20 text-orange-500 border-orange-500/30"
  };
  if (isMinimized) {
    return <Card className="fixed bottom-4 right-4 p-3 shadow-lg border-border bg-card z-50 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setIsMinimized(false)}>
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">selfie captions</span>
        </div>
      </Card>;
  }
  return;
}