import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PatchNote {
  version: string;
  date: string;
  changes: string[];
}

const patchNotes: PatchNote[] = [
  {
    version: "2.6.0",
    date: "2025-12-13",
    changes: [
      "Added xAI (Grok) as independent AI fallback provider",
      "New fallback chain: Gemini (4 keys) → xAI → OpenAI → Lovable AI",
      "Reduced dependency on single Gmail account for API quotas"
    ]
  },
  {
    version: "2.5.0",
    date: "2025-12-13",
    changes: [
      "Added multi-provider AI fallback chain (Gemini → OpenAI → Lovable AI)",
      "Added OpenAI API key support as alternative AI provider",
      "Patch notes panel added to right sidebar"
    ]
  },
  {
    version: "2.4.0",
    date: "2025-12-12",
    changes: [
      "Added AI model selector dropdown in header",
      "Support for switching between Gemini and OpenAI models",
      "Model selection persists across session"
    ]
  },
  {
    version: "2.3.0",
    date: "2025-12-11",
    changes: [
      "Added selfie caption generator with multiple styles",
      "Caption variations: PPV tease, casual, flirty, seductive, sweet",
      "Minimizable generator panel"
    ]
  },
  {
    version: "2.2.0",
    date: "2025-12-10",
    changes: [
      "Added warm-up mode for progressive suggestiveness",
      "Auto-detect conversation progression through screenshots",
      "Per-fan warm-up level tracking"
    ]
  },
  {
    version: "2.1.0",
    date: "2025-12-09",
    changes: [
      "Added creativity/detail slider (0-100 scale)",
      "Independent control of response depth",
      "Slider persists within session"
    ]
  },
  {
    version: "2.0.0",
    date: "2025-12-08",
    changes: [
      "Added 'elaborate when asked' toggle",
      "New reply tones: horny, suggestive, adaptive",
      "Adaptive tone matches fan's messaging energy"
    ]
  },
  {
    version: "1.9.0",
    date: "2025-12-07",
    changes: [
      "Multilingual reply generation",
      "Auto-detect fan message language",
      "Toggle for reply in fan language vs English"
    ]
  },
  {
    version: "1.8.0",
    date: "2025-12-06",
    changes: [
      "Manual message curation for AI-detected messages",
      "Add/remove fan messages before generating reply",
      "Visual indicators for detected messages"
    ]
  },
  {
    version: "1.7.0",
    date: "2025-12-05",
    changes: [
      "Platform-specific message detection (Infloww, FanVue, OnlyFans)",
      "Blue/checkmarked model messages auto-ignored",
      "Regenerate uses edited messages list"
    ]
  },
  {
    version: "1.6.0",
    date: "2025-12-04",
    changes: [
      "AI-powered random message generator",
      "Categories: casual, morning, night, comeback, horny, seducing",
      "Messages feel personal, not broadcast-style"
    ]
  },
  {
    version: "1.5.0",
    date: "2025-12-03",
    changes: [
      "Dark/light theme toggle added",
      "Theme persists across page refreshes",
      "Night mode support"
    ]
  },
  {
    version: "1.4.0",
    date: "2025-12-02",
    changes: [
      "Per-model instruction memory",
      "Instructions auto-saved when switching models",
      "Instructions restored when returning to model"
    ]
  },
  {
    version: "1.3.0",
    date: "2025-12-01",
    changes: [
      "AI usage prediction and warnings",
      "Rate limit thresholds: warning at 40, danger at 55",
      "Visual indicator with color coding"
    ]
  },
  {
    version: "1.2.0",
    date: "2025-11-30",
    changes: [
      "Reply history panel added",
      "Copy and reuse previous replies",
      "History persists within session"
    ]
  },
  {
    version: "1.1.0",
    date: "2025-11-29",
    changes: [
      "Uncensored/censored mode toggle",
      "Confirmation dialog for explicit content",
      "Mode persists via session storage"
    ]
  },
  {
    version: "1.0.0",
    date: "2025-11-28",
    changes: [
      "Initial release of mpgoy chattergoy 💦😘",
      "Screenshot upload with AI analysis",
      "Reply tone selector (friendly, flirty, spicy, explicit, sweet)",
      "Quick replies for common responses",
      "Session conversation memory",
      "Multi-fan handling with named pairs",
      "AI instruction chatbox for refining replies",
      "Secret key authentication"
    ]
  }
];

export function PatchNotes() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4 text-primary" />
            <span>patch notes</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {patchNotes.map((note, index) => (
              <div key={note.version} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    v{note.version}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {note.date}
                  </span>
                </div>
                <ul className="space-y-1">
                  {note.changes.map((change, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
                {index < patchNotes.length - 1 && (
                  <div className="border-b border-border pt-2" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
