import { Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "bn", label: "বাংলা (Bengali)" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const LanguageSelector = ({ value, onChange }: Props) => (
  <div className="flex items-center gap-2">
    <Languages className="w-4 h-4 text-muted-foreground" />
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default LanguageSelector;
