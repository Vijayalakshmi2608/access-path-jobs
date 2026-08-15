import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ClipboardCopy, Sparkles, ListChecks } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BlockSkeleton, ErrorState } from "@/components/states";
import { buildBriefing, briefingPrompt, fallbackAdvice } from "@/lib/before-you-apply";
import { generateApplyBriefing } from "@/lib/ai.functions";
import type { Job } from "@/lib/jobs-data";
import type { Profile } from "@/lib/app-state";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Chips({ items, tone = "default" }: { items: string[]; tone?: "default" | "warn" }) {
  if (!items.length) return <p className="mt-1 text-sm text-muted-foreground">None recorded.</p>;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((i) => (
        <li
          key={i}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            tone === "warn" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
          }`}
        >
          {i}
        </li>
      ))}
    </ul>
  );
}

export function BeforeYouApply({ job, profile }: { job: Job; profile: Profile }) {
  const brief = buildBriefing(profile, job);
  const generate = useServerFn(generateApplyBriefing);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string[] | null>(null);
  const [question, setQuestion] = useState(brief.suggestedQuestion);
  const [error, setError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generate({ data: { brief: briefingPrompt(brief) } });
      if (res.ok) {
        setAdvice(res.advice);
        if (res.question) setQuestion(res.question);
        setAiUsed(true);
      } else {
        const fb = fallbackAdvice(brief);
        setAdvice(fb.advice);
        setQuestion(fb.question);
        setAiUsed(false);
        setError(res.error);
      }
    } catch {
      const fb = fallbackAdvice(brief);
      setAdvice(fb.advice);
      setQuestion(fb.question);
      setError("We couldn't load the AI summary. Showing the standard summary instead.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(question);
      toast.success("Question copied to clipboard");
    } catch {
      toast.error("Copy failed — you can select the text and copy it manually.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && !advice && !loading) void run();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <ListChecks aria-hidden="true" />
          Before you apply
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Before you apply: {job.title}</DialogTitle>
          <DialogDescription>
            A preparation summary built from this listing and your profile, so you can decide with
            full information.
          </DialogDescription>
        </DialogHeader>

        <Section title="What you already match">
          <Chips items={brief.matched} />
        </Section>

        <Section title="What you may need">
          <Chips items={brief.mayNeed} tone="warn" />
        </Section>

        <Section title="Work arrangement">
          <p className="mt-1 text-sm">{brief.workArrangement}</p>
        </Section>

        <Section title="Accessibility information">
          {brief.accessibilityProvided.length ? (
            <ul className="mt-1 list-disc pl-5 text-sm">
              {brief.accessibilityProvided.map((a) => (
                <li key={a}>{a}: stated by the employer</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">The employer has not provided any.</p>
          )}
        </Section>

        <Section title="Interview">
          <p className="mt-1 text-sm">{brief.interview}</p>
        </Section>

        <Section title="Information missing">
          {brief.missingInformation.length ? (
            <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
              {brief.missingInformation.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              This employer has covered every accessibility field.
            </p>
          )}
        </Section>

        <Section title="AI preparation summary">
          {loading ? (
            <div className="mt-2">
              <BlockSkeleton lines={4} label="Generating your preparation summary" />
            </div>
          ) : error ? (
            <ErrorState title="AI summary unavailable" message={error} onRetry={() => void run()} />
          ) : null}
          {advice && !loading ? (
            <ul aria-live="polite" className="mt-2 space-y-2 text-sm">
              {advice.map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
                  {a}
                </li>
              ))}
            </ul>
          ) : null}
          {advice && aiUsed ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Generated by AI from this listing and your skills only. No identity, disability or
              accommodation information is sent.
            </p>
          ) : null}
        </Section>

        <Section title="Suggested question for HR">
          <p className="mt-1 rounded-md border border-border bg-secondary/50 p-3 text-sm">{question}</p>
          <Button variant="outline" size="sm" className="mt-2 min-h-11" onClick={() => void copy()}>
            <ClipboardCopy aria-hidden="true" />
            Copy question
          </Button>
        </Section>
      </DialogContent>
    </Dialog>
  );
}
