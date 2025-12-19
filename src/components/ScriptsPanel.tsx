import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp, GripVertical, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface ScriptsPanelProps {
  onSelect?: (content: string) => void;
}

const STORAGE_KEY = 'savedScripts';
const PANEL_SIZE_KEY = 'scriptsPanelSize';

export function ScriptsPanel({ onSelect }: ScriptsPanelProps) {
  const [scripts, setScripts] = useState<Script[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isMinimized, setIsMinimized] = useState(false);
  const [panelHeight, setPanelHeight] = useState(() => {
    const stored = localStorage.getItem(PANEL_SIZE_KEY);
    return stored ? parseInt(stored, 10) : 400;
  });
  const [isResizing, setIsResizing] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Persist scripts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  }, [scripts]);

  // Persist panel size
  useEffect(() => {
    localStorage.setItem(PANEL_SIZE_KEY, panelHeight.toString());
  }, [panelHeight]);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = panelHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY;
      const newHeight = Math.max(200, Math.min(800, startHeight + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const addScript = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please enter both title and content");
      return;
    }

    const script: Script = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      createdAt: Date.now()
    };

    setScripts(prev => [script, ...prev]);
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
    toast.success("Script saved");
  };

  const deleteScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id));
    toast.success("Script deleted");
  };

  const copyScript = async (script: Script) => {
    await navigator.clipboard.writeText(script.content);
    setCopiedId(script.id);
    toast.success("Script copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const useScript = (script: Script) => {
    if (onSelect) {
      onSelect(script.content);
      toast.success("Script applied");
    } else {
      copyScript(script);
    }
  };

  return (
    <div 
      className={cn(
        "border border-border rounded-lg bg-card overflow-hidden transition-all",
        isResizing && "select-none"
      )}
    >
      {/* Resize Handle */}
      {!isMinimized && (
        <div
          onMouseDown={handleMouseDown}
          className="h-2 bg-muted/50 hover:bg-primary/20 cursor-ns-resize flex items-center justify-center"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground rotate-90" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">saved scripts</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
            {scripts.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              className="h-7 px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              <span className="text-xs">add</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div style={{ height: panelHeight }}>
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {/* Add New Script Form */}
              {isAdding && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                  <Input
                    placeholder="Script title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Textarea
                    placeholder="Script content..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-[100px] text-xs resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={addScript}
                      size="sm"
                      className="h-7 text-xs flex-1"
                    >
                      Save Script
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAdding(false);
                        setNewTitle("");
                        setNewContent("");
                      }}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Scripts List */}
              {scripts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">no scripts saved yet</p>
                  <p className="text-[10px] mt-1">click "add" to create your first script</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scripts.map((script) => (
                    <Collapsible
                      key={script.id}
                      open={expandedId === script.id}
                      onOpenChange={(open) => setExpandedId(open ? script.id : null)}
                    >
                      <div className="rounded-lg border border-border bg-background overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs font-medium">{script.title}</span>
                            </div>
                            {expandedId === script.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-2">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded">
                              {script.content}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => useScript(script)}
                                className="h-6 text-[10px] flex-1"
                              >
                                use script
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyScript(script)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedId === script.id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteScript(script.id)}
                                className="h-6 w-6 p-0 hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}