import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle } from "lucide-react";
import { useState } from "react";

interface GeneratedReplyProps {
  reply: string;
  personaNote: string;
  translation: string | null;
  repliedTo: string;
}

export function GeneratedReply({ reply, personaNote, translation, repliedTo }: GeneratedReplyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-primary" />
            Generated Reply
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-lg leading-relaxed">{reply}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Persona Applied:</span>
            <p className="text-foreground">{personaNote}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Replied to:</span>
            <p className="text-foreground font-mono">{repliedTo}</p>
          </div>
        </div>
        
        {translation && (
          <div className="pt-2 border-t border-border">
            <span className="text-muted-foreground font-medium text-sm">Translation:</span>
            <p className="text-foreground mt-1">{translation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
