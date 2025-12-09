import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FanNotesFormProps {
  value: string;
  onChange: (value: string) => void;
}

export function FanNotesForm({ value, onChange }: FanNotesFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-foreground" />
        Fan Notes
      </h3>
      
      <div className="space-y-2">
        <Label htmlFor="fanNotes">Known info about this fan</Label>
        <Textarea
          id="fanNotes"
          placeholder="e.g., Big spender, loves specific content, emotional yesterday, first-time buyer, always tips well, prefers certain topics..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-card border-border min-h-[100px]"
        />
      </div>
    </div>
  );
}
