import { Smile, Heart, Flame, Diamond, Sparkles, Zap, RefreshCw } from "lucide-react";

export type ReplyTone = "friendly" | "flirty" | "spicy" | "explicit" | "sweet" | "horny" | "adaptive";

interface ReplyToneSelectorProps {
  selected: ReplyTone;
  onSelect: (tone: ReplyTone) => void;
}

const tones: { id: ReplyTone; label: string; description: string; icon: React.ElementType }[] = [
  { id: "friendly", label: "friendly", description: "warm & casual", icon: Smile },
  { id: "flirty", label: "flirty", description: "playful & teasing", icon: Heart },
  { id: "spicy", label: "spicy", description: "bold & suggestive", icon: Flame },
  { id: "explicit", label: "explicit", description: "adult & direct", icon: Diamond },
  { id: "sweet", label: "sweet", description: "cute & endearing", icon: Sparkles },
  { id: "horny", label: "horny", description: "intense & lustful", icon: Zap },
  { id: "adaptive", label: "adaptive", description: "matches fan's energy", icon: RefreshCw },
];

export function ReplyToneSelector({ selected, onSelect }: ReplyToneSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">reply tone</h3>
      <div className="grid grid-cols-2 gap-2">
        {tones.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selected === tone.id;
          return (
            <button
              key={tone.id}
              onClick={() => onSelect(tone.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                isSelected
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{tone.label}</span>
              <span className="text-[10px] text-muted-foreground">{tone.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
