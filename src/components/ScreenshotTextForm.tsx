import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ScreenshotTextFormProps {
  screenshotText: string;
  targetMessage: string;
  onScreenshotTextChange: (value: string) => void;
  onTargetMessageChange: (value: string) => void;
}

export function ScreenshotTextForm({
  screenshotText,
  targetMessage,
  onScreenshotTextChange,
  onTargetMessageChange,
}: ScreenshotTextFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-chart-2" />
        Chat Screenshot
      </h3>
      
      <div className="space-y-4">
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
          <Label htmlFor="targetMessage">Target Message Timestamp</Label>
          <Input
            id="targetMessage"
            placeholder="e.g., 22:17"
            value={targetMessage}
            onChange={(e) => onTargetMessageChange(e.target.value)}
            className="bg-card border-border"
          />
          <p className="text-xs text-muted-foreground">
            Enter the timestamp of the specific message to reply to
          </p>
        </div>
      </div>
    </div>
  );
}
