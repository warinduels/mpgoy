import { History, Copy, Check, Trash2, User, Bot } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface HistoryItem {
  fanName: string;
  modelName: string;
  fanMessage: string;
  reply: string;
}

interface ReplyHistoryProps {
  history: HistoryItem[];
  onSelect: (reply: string) => void;
  onClear: () => void;
}

export function ReplyHistory({ history, onSelect, onClear }: ReplyHistoryProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (reply: string, index: number) => {
    await navigator.clipboard.writeText(reply);
    setCopiedIndex(index);
    toast.success("Reply copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (history.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="w-4 h-4 text-primary" />
          <span>reply history</span>
        </div>
        <div className="text-center py-8 text-muted-foreground text-xs">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>no replies generated yet</p>
          <p className="text-[10px] mt-1">your generated replies will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="w-4 h-4 text-primary" />
          <span>reply history</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
            {history.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          clear
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-2">
          {[...history].reverse().map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => onSelect(item.reply)}
            >
              {/* Context */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{item.fanName || "fan"}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>{item.modelName || "model"}</span>
                </div>
              </div>

              {/* Fan Message Preview */}
              <p className="text-[10px] text-muted-foreground mb-1 line-clamp-1">
                "{item.fanMessage}"
              </p>

              {/* Reply */}
              <p className="text-xs text-foreground line-clamp-2">{item.reply}</p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(item.reply, index);
                  }}
                  className="h-6 px-2 text-[10px]"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.reply);
                    toast.success("Reply selected");
                  }}
                  className="h-6 px-2 text-[10px]"
                >
                  use this
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}