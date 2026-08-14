import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/lib/app-state";
import { analyseResume } from "@/lib/matching";

export const Route = createFileRoute("/resume-match")({
  head: () => ({
    meta: [
      { title: "Resume to Job Match — AccessPath" },
      {
        name: "description",
        content:
          "Paste or upload your resume, pick a role and see matched skills, missing skills and suggested resume improvements.",
      },
      { property: "og:title", content: "Resume to Job Match — AccessPath" },
      { property: "og:description", content: "See exactly which skills your resume is missing for a role." },
    ],
  }),
  component: ResumeMatchPage,
});

function ResumeMatchPage() {
  const { profile, saveProfile, allJobs } = useAppState();
  const [text, setText] = useState(profile.resumeText);
  const [jobId, setJobId] = useState(allJobs[0]?.id ?? "");
  const [showImprove, setShowImprove] = useState(false);

  const job = allJobs.find((j) => j.id === jobId);
  const result = useMemo(
    () => (job && text.trim() ? analyseResume(text, job, profile) : null),
    [job, text, profile],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Resume to job match</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Paste your resume text, choose a role, and AccessPath will show which requirements your
        resume already evidences and which ones it does not mention yet.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="resume-heading" className="surface-card space-y-4 p-5">
          <h2 id="resume-heading" className="flex items-center gap-2 text-xl font-semibold">
            <FileText aria-hidden="true" className="size-5 text-brand" />
            Your resume
          </h2>
          <div>
            <label htmlFor="resume-upload" className="block text-sm font-medium">
              Upload a plain-text resume (optional)
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              .txt files are read automatically. For PDF or DOCX, paste the text below.
            </p>
            <Input
              id="resume-upload"
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              className="mt-1.5"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (/\.(txt|md)$/i.test(file.name)) {
                  setText(await file.text());
                  toast.success(`${file.name} loaded`);
                } else {
                  toast.info(`${file.name} attached. Please paste the resume text below.`);
                }
              }}
            />
          </div>
          <div>
            <label htmlFor="resume-text" className="block text-sm font-medium">
              Resume text
            </label>
            <Textarea
              id="resume-text"
              rows={12}
              className="mt-1.5"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume here…"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              saveProfile({ ...profile, resumeText: text });
              toast.success("Resume text saved to your profile");
            }}
          >
            Save resume text to profile
          </Button>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="job-heading" className="surface-card p-5">
            <h2 id="job-heading" className="text-xl font-semibold">Choose a job</h2>
            <div className="mt-3">
              <label htmlFor="job-select" className="block text-sm font-medium">Role</label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger id="job-select" className="mt-1.5">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {allJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} — {j.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section aria-labelledby="analysis-heading" className="surface-card p-5">
            <h2 id="analysis-heading" className="flex items-center gap-2 text-xl font-semibold">
              <Sparkles aria-hidden="true" className="size-5 text-brand" />
              Analysis
            </h2>
            {!result || !job ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Add your resume text and select a role to see the analysis.
              </p>
            ) : (
              <div aria-live="polite">
                <p className="mt-3 text-3xl font-bold">
                  {result.coverage}%{" "}
                  <span className="text-base font-medium text-muted-foreground">
                    requirement coverage
                  </span>
                </p>
                <Progress value={result.coverage} className="mt-2" aria-label={`Coverage ${result.coverage} percent`} />

                <h3 className="mt-4 text-sm font-semibold">Matched skills</h3>
                {result.matched.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {result.matched.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <Check aria-hidden="true" className="size-4 text-success" />
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    None of the listed skills were found in your resume text.
                  </p>
                )}

                <h3 className="mt-4 text-sm font-semibold">Missing skills</h3>
                {result.missingRequired.length || result.missingPreferred.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {[...result.missingRequired, ...result.missingPreferred].map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <AlertTriangle aria-hidden="true" className="size-4 text-warning" />
                        {s}
                        {result.missingRequired.includes(s) ? " (required)" : " (preferred)"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Nothing obvious is missing.</p>
                )}

                <h3 className="mt-4 text-sm font-semibold">Experience match</h3>
                <p className="mt-1 text-sm">
                  {result.experience}% — role asks for {job.experience}
                  {profile.experienceBand ? `, your profile says ${profile.experienceBand}` : ". Add your experience level to your profile for accuracy"}.
                </p>

                {result.notes.length ? (
                  <>
                    <h3 className="mt-4 text-sm font-semibold">Recommended improvements</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {result.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <Button className="mt-4" onClick={() => setShowImprove((v) => !v)} aria-expanded={showImprove} aria-controls="improve-panel">
                  {showImprove ? "Hide resume suggestions" : "Improve resume"}
                </Button>
                {showImprove ? (
                  <div id="improve-panel" className="mt-3 rounded-md border border-border bg-secondary/50 p-3">
                    <h3 className="text-sm font-semibold">Suggested bullet improvements</h3>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                      {result.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p className="mt-4 text-sm">
                  <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="font-medium text-brand hover:underline">
                    Open the full job details and accessibility information
                  </Link>
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
