import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Bookmark, BookmarkCheck, CheckCircle2, Pause, Play, Square, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ACCESS_FEATURES, INCLUSION_FEATURES, getJob } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { useTextToSpeech } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/")({
  loader: ({ params }) => {
    const job = getJob(params.jobId);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Job unavailable — AccessPath" }, { name: "robots", content: "noindex" }] };
    }
    const { job } = loaderData;
    const title = `${job.title} at ${job.company} — AccessPath`;
    const description = `${job.workMode} • ${job.city} • ${job.experience}. Accessibility and inclusion details ${job.accessSource.toLowerCase()}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: JobDetails,
});

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function TickList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2 text-sm">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          {i}
        </li>
      ))}
    </ul>
  );
}

function JobDetails() {
  const { job } = Route.useLoaderData();
  const { isSaved, toggleSaved, apply, hasApplied } = useAppState();
  const tts = useTextToSpeech();
  const saved = isSaved(job.id);
  const applied = hasApplied(job.id);

  const spoken = [
    `${job.title} at ${job.company}.`,
    `${job.workMode} position in ${job.city}.`,
    job.salary ? `Salary ${job.salary.replace("₹", "")}.` : "",
    `Experience required: ${job.experience}. Employment type: ${job.employment}.`,
    `About the role. ${job.about}`,
    `Required skills: ${job.requiredSkills.join(", ")}.`,
    `Accessibility, ${job.accessSource.toLowerCase()}: ${job.access.map((a) => ACCESS_FEATURES[a]).join(", ")}.`,
    `Workplace inclusion: ${job.inclusion.map((i) => INCLUSION_FEATURES[i]).join(", ")}.`,
  ].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/jobs" className="text-sm font-medium text-brand hover:underline">
        ← Back to job search
      </Link>

      <header className="surface-card mt-4 p-5">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {job.company} • {job.city} • {job.workMode} • {job.employment} • {job.experience}
          {job.salary ? ` • ${job.salary}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => { apply(job.id); toast.success("Application recorded"); }} disabled={applied}>
            {applied ? "Applied" : "Apply with confidence"}
          </Button>
          <Button
            variant="outline"
            aria-pressed={saved}
            onClick={() => toggleSaved(job.id)}
          >
            {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
            {saved ? "Saved" : "Save job"}
          </Button>
        </div>

        <div className="mt-4 rounded-md border border-border bg-secondary/50 p-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Volume2 aria-hidden="true" className="size-4" />
            Listen to this job
          </h2>
          {tts.supported ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => tts.play(spoken)} disabled={tts.state === "speaking"}>
                <Play aria-hidden="true" />
                {tts.state === "paused" ? "Resume" : "Play"}
              </Button>
              <Button size="sm" variant="outline" onClick={tts.pause} disabled={tts.state !== "speaking"}>
                <Pause aria-hidden="true" />
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={tts.stop} disabled={tts.state === "idle"}>
                <Square aria-hidden="true" />
                Stop
              </Button>
              <p aria-live="polite" className="sr-only">
                Read aloud {tts.state}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Read-aloud isn't available in this browser. The full job text is below.
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section aria-labelledby="about-heading" className="surface-card p-5">
            <h2 id="about-heading" className="text-xl font-semibold">About the role</h2>
            <p className="mt-2 text-sm">{job.about}</p>
          </section>

          <section aria-labelledby="resp-heading" className="surface-card p-5">
            <h2 id="resp-heading" className="text-xl font-semibold">Responsibilities</h2>
            <List items={job.responsibilities} />
          </section>

          <section aria-labelledby="skills-heading" className="surface-card p-5">
            <h2 id="skills-heading" className="text-xl font-semibold">Skills</h2>
            <h3 className="mt-3 text-sm font-semibold">Required skills</h3>
            <List items={job.requiredSkills} />
            <h3 className="mt-4 text-sm font-semibold">Preferred skills</h3>
            <List items={job.preferredSkills} />
          </section>

          <section aria-labelledby="access-heading" className="surface-card p-5">
            <h2 id="access-heading" className="text-xl font-semibold">Accessibility &amp; Inclusion</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.accessSource}. AccessPath only shows accessibility information supplied by the
              employer or verified by our team.
            </p>
            <h3 className="mt-4 text-sm font-semibold">Accessibility</h3>
            <TickList items={job.access.map((a) => ACCESS_FEATURES[a])} />
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold">Workplace inclusion</h3>
            <TickList items={job.inclusion.map((i) => INCLUSION_FEATURES[i])} />
          </section>
        </div>

        <aside aria-label="Job summary" className="surface-card h-fit p-5">
          <h2 className="text-lg font-semibold">Job summary</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {[
              ["Salary", job.salary ?? "Not disclosed"],
              ["Location", job.city],
              ["Work mode", job.workMode],
              ["Experience", job.experience],
              ["Employment", job.employment],
              ["Category", job.category],
              ["Posted", job.posted],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            You never need to disclose disability or gender identity to apply.
          </p>
        </aside>
      </div>
    </div>
  );
}
