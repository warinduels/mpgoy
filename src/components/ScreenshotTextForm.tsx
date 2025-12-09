import { useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Image as ImageIcon, FileText, Camera } from "lucide-react";

interface ScreenshotTextFormProps {
  screenshotText: string;
  targetMessage: string;
  screenshotImage: string | null;
  onScreenshotTextChange: (value: string) => void;
  onTargetMessageChange: (value: string) => void;
  onScreenshotImageChange: (value: string | null) => void;
}

export function ScreenshotTextForm({
  screenshotText,
  targetMessage,
  screenshotImage,
  onScreenshotTextChange,
  onTargetMessageChange,
  onScreenshotImageChange,
}: ScreenshotTextFormProps) {
  const [activeTab, setActiveTab] = useState<string>(screenshotImage ? "image" : "text");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onScreenshotImageChange(base64);
      setActiveTab("image");
    };
    reader.readAsDataURL(file);
  }, [onScreenshotImageChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [handleFileChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFileChange(file);
        }
        break;
      }
    }
  }, [handleFileChange]);

  const removeImage = () => {
    onScreenshotImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-chart-2" />
        Chat Screenshot
      </h3>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image" className="gap-2">
            <Camera className="w-4 h-4" />
            Upload Image
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2">
            <FileText className="w-4 h-4" />
            Paste Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-4 mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {screenshotImage ? (
            <div className="relative">
              <div className="relative rounded-lg overflow-hidden border border-border bg-card">
                <img
                  src={screenshotImage}
                  alt="Screenshot"
                  className="w-full max-h-[400px] object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI will analyze this screenshot to read the conversation
              </p>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onPaste={handlePaste}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-card/50"
                }
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Drop screenshot here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can also paste an image with Ctrl+V / Cmd+V
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  PNG, JPG, WEBP supported
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="targetMessageImage">Target Message Timestamp (optional)</Label>
            <Input
              id="targetMessageImage"
              placeholder="e.g., 22:17 (leave empty to reply to last message)"
              value={targetMessage}
              onChange={(e) => onTargetMessageChange(e.target.value)}
              className="bg-card border-border"
            />
            <p className="text-xs text-muted-foreground">
              If left empty, AI will analyze the image and reply to the most recent fan message
            </p>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="screenshotText">Paste chat content</Label>
            <Textarea
              id="screenshotText"
              placeholder={`Paste the chat screenshot text here...

Example:
Fan (22:15): hey babe miss you
Fan (22:16): had a rough day at work
Fan (22:17): got any new content for me?`}
              value={screenshotText}
              onChange={(e) => onScreenshotTextChange(e.target.value)}
              className="bg-card border-border min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetMessageText">Target Message Timestamp</Label>
            <Input
              id="targetMessageText"
              placeholder="e.g., 22:17"
              value={targetMessage}
              onChange={(e) => onTargetMessageChange(e.target.value)}
              className="bg-card border-border"
            />
            <p className="text-xs text-muted-foreground">
              Enter the timestamp of the specific message to reply to
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
