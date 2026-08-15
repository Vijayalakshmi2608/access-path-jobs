import { useState } from "react";
import { Contrast, Settings2, Type, Volume2, Waves, X } from "lucide-react";
import { useAppState, type FontSize, type MotionPref } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/lib/speech";

const SIZES: { value: FontSize; label: string }[] = [
  { value: "medium", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "Extra large" },
];

const MOTIONS: { value: MotionPref; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "reduced", label: "Reduced" },
];

function Group({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span id={id} className="text-sm font-medium">{label}</span>
      <div role="group" aria-labelledby={id} className="flex gap-1">
        {children}
      </div>
    </div>
  );
}

export function AccessibilityToolbar() {
  const { highContrast, setHighContrast, fontSize, setFontSize, motion, setMotion } = useAppState();
  const [open, setOpen] = useState(false);
  const tts = useTextToSpeech();

  const readPage = () => {
    const main = document.getElementById("main");
    const text = (main?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    if (text) tts.play(text);
  };

  return (
    <section
      aria-label="Display and accessibility settings"
      className="border-b border-border bg-secondary/60"
    >
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <p className="text-xs text-muted-foreground">Accessibility settings are saved on this device.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11"
            aria-expanded={open}
            aria-controls="a11y-controls"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" className="size-4" /> : <Settings2 aria-hidden="true" className="size-4" />}
            {open ? "Close" : "Display"}
          </Button>
        </div>

        <div
          id="a11y-controls"
          className={`${open ? "flex" : "hidden"} flex-col gap-3 pt-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:pt-0`}
        >
          <Group label="Text size" id="a11y-size">
            <Type aria-hidden="true" className="size-4 self-center text-muted-foreground" />
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
          </Group>

          <Group label="Contrast" id="a11y-contrast">
            <Button
              type="button"
              size="sm"
              variant={highContrast ? "default" : "outline"}
              aria-pressed={highContrast}
              onClick={() => setHighContrast(!highContrast)}
            >
              <Contrast aria-hidden="true" className="size-4" />
              {highContrast ? "High contrast on" : "High contrast"}
            </Button>
          </Group>

          <Group label="Motion" id="a11y-motion">
            <Waves aria-hidden="true" className="size-4 self-center text-muted-foreground" />
            {MOTIONS.map((m) => (
              <Button
                key={m.value}
                type="button"
                size="sm"
                variant={motion === m.value ? "default" : "outline"}
                aria-pressed={motion === m.value}
                onClick={() => setMotion(m.value)}
              >
                {m.label}
              </Button>
            ))}
          </Group>

          {tts.supported ? (
            <Group label="Reading" id="a11y-reading">
              <Button type="button" size="sm" variant="outline" onClick={readPage}>
                <Volume2 aria-hidden="true" className="size-4" />
                Read page aloud
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={tts.stop}
                disabled={tts.state === "idle"}
              >
                Stop
              </Button>
            </Group>
          ) : null}

          <p className="hidden text-xs text-muted-foreground lg:block">
            Saved on this device. Full keyboard navigation supported.
          </p>
        </div>
      </div>
    </section>
  );
}
