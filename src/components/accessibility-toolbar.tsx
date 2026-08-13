import { Contrast, Type } from "lucide-react";
import { useAppState, type FontSize } from "@/lib/app-state";
import { Button } from "@/components/ui/button";

const SIZES: { value: FontSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function AccessibilityToolbar() {
  const { highContrast, setHighContrast, fontSize, setFontSize } = useAppState();

  return (
    <section
      aria-label="Display and accessibility settings"
      className="border-b border-border bg-secondary/60"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Type aria-hidden="true" className="size-4 text-muted-foreground" />
          <span id="font-size-label" className="font-medium">Text size</span>
          <div role="group" aria-labelledby="font-size-label" className="flex gap-1">
            {SIZES.map((s) => (
              <Button
                key={s.value}
                type="button"
                size="sm"
                variant={fontSize === s.value ? "default" : "outline"}
                aria-pressed={fontSize === s.value}
                onClick={() => setFontSize(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={highContrast ? "default" : "outline"}
          aria-pressed={highContrast}
          onClick={() => setHighContrast(!highContrast)}
        >
          <Contrast aria-hidden="true" className="size-4" />
          High contrast mode
        </Button>
        <p className="text-muted-foreground">
          Settings are saved on this device. Keyboard navigation is supported throughout.
        </p>
      </div>
    </section>
  );
}
