import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface ModelContext {
  name: string;
  gender: string;
  orientation: string;
  specialNotes: string;
}

interface ModelContextFormProps {
  value: ModelContext;
  onChange: (value: ModelContext) => void;
}

export function ModelContextForm({ value, onChange }: ModelContextFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Model Context
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="modelName">Model Name</Label>
          <Input
            id="modelName"
            placeholder="e.g., Bella, Leo, Maya"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="bg-card border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={value.gender}
            onValueChange={(gender) => onChange({ ...value, gender })}
          >
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="trans">Trans</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="orientation">Orientation</Label>
          <Select
            value={value.orientation}
            onValueChange={(orientation) => onChange({ ...value, orientation })}
          >
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="straight">Straight</SelectItem>
              <SelectItem value="gay">Gay</SelectItem>
              <SelectItem value="bi">Bi</SelectItem>
              <SelectItem value="lesbian">Lesbian</SelectItem>
              <SelectItem value="pan">Pan</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="specialNotes">Special Notes / Persona</Label>
          <Textarea
            id="specialNotes"
            placeholder='e.g., "dominant," "girl-next-door," "twink," "bear," "playful and flirty"'
            value={value.specialNotes}
            onChange={(e) => onChange({ ...value, specialNotes: e.target.value })}
            className="bg-card border-border min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
