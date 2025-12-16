import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Key, ShieldCheck } from "lucide-react";
import { Snowfall } from "@/components/Snowfall";

const secretKeySchema = z.object({
  secretKey: z.string().min(1, "Secret key is required"),
});

export default function Auth() {
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { validateSecretKey, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validation = secretKeySchema.safeParse({ secretKey });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const { error } = await validateSecretKey(secretKey);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("🎄 Access granted! Merry Christmas!");
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <Snowfall />
      
      {/* Christmas decorations */}
      <div className="absolute top-4 left-4 text-4xl animate-twinkle">🎄</div>
      <div className="absolute top-4 right-4 text-4xl animate-twinkle" style={{ animationDelay: '0.5s' }}>🎄</div>
      <div className="absolute bottom-4 left-4 text-3xl animate-twinkle" style={{ animationDelay: '1s' }}>🎁</div>
      <div className="absolute bottom-4 right-4 text-3xl animate-twinkle" style={{ animationDelay: '1.5s' }}>🎁</div>
      
      <Card className="w-full max-w-md relative z-10 border-2 border-primary/30 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 animate-glow">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-christmas">
            <span className="text-primary">🎅</span> mpgoy chattergoy <span className="text-secondary">🎄</span>
          </CardTitle>
          <CardDescription>
            Enter your secret key to access ❄️
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key 🔑</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              🎁 Enter
            </Button>
          </form>
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Contact the admin if you need access. 🎄 Merry Christmas!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
