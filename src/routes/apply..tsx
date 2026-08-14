import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MatchPill } from "@/components/match-insights";
import { useAppState } from "@/lib/app-state";
import { scoreJob } from "@/lib/matching";

export const Route = createFileRoute("/apply/$jobId")({
  head: () => ({
    meta: [
      { title: "Apply to a role — AccessPath" },
      {
        name: "description",
        content:
          "Apply in one click with your AccessPath profile, choose a resume and optionally request an interview accommodation.",
      },
      { property: "og:title", content: "Apply to a role — AccessPath" },
      { property: "og:description", content: "One-click application with optional accommodation requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplyPage,
});

export const ACCOMMODATIONS = [
  "Accessible video interview",
  "Captioning",
  "Additional interview time",
  "Alternative communication method",
  "No accommodation required",
  "Other",
];

function ApplyPage() {
  const { jobId } = Route.useParams();
  const { findJob, profile, apply, hasApplied } = useAppState();
  const navigate = useNavigate();
  const job = findJob(jobId);

  const [coverLetter, setCoverLetter] = useState("");
  const [resumeName, setResumeName] = useState(profile.resumeName);
  const [chosen, setChosen] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [share, setShare] = useState(false);

  const match = useMemo(() => (job ? scoreJob(profile, job) : null), [job, profile]);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">This job is no longer available</h1>
        <Button asChild className="mt-4">
          <Link to="/jobs" search={{ q: "" }}>Back to job search</Link>
        </Button>
      </div>
    );
  }

  const applied = hasApplied(job.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="text-sm font-medium text-brand hover:underline">
        ← Back to job details
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Apply: {job.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {job.company} • {job.city} • {job.workMode}
      </p>
      {match ? <p className="mt-3"><MatchPill score={match.total} /></p> : null}

      {applied ? (
        <div className="surface-card mt-6 p-5">
          <h2 className="font-semibold">You have already applied to this role</h2>
          <Button asChild className="mt-3">
            <Link to="/applications">View my applications</Link>
          </Button>
        </div>
      ) : (
        <form
          className="mt-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            apply({
              jobId: job.id,
              resumeName: resumeName || "No resume attached",
              coverLetter,
              accommodations: chosen,
              accommodationNote: note,
              shareAccommodations: share,
              matchScore: match?.total ?? 0,
            });
            toast.success("Application submitted");
            navigate({ to: "/applications" });
          }}
        >
          <section aria-labelledby="you-heading" className="surface-card p-5">
            <h2 id="you-heading" className="text-xl font-semibold">Your details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sent from your profile. <Link to="/profile" className="text-brand hover:underline">Edit profile</Link>
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Name", profile.name || "Not added yet"],
                ["Headline", profile.headline || "Not added yet"],
                ["Skills", profile.skills.length ? profile.skills.join(" • ") : "Not added yet"],
                ["Experience level", profile.experienceBand || "Not set"],
                ["Education", profile.education || "Not added yet"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="resume-heading" className="surface-card space-y-4 p-5">
            <h2 id="resume-heading" className="text-xl font-semibold">Resume</h2>
            <div>
              <label htmlFor="resume-select" className="block text-sm font-medium">
                Resume file name
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {profile.resumeName ? `From your profile: ${profile.resumeName}` : "No resume in your profile yet."}
              </p>
              <Input
                id="resume-select"
                className="mt-1.5"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="my-resume.pdf"
              />
            </div>
            <div>
              <label htmlFor="cover" className="block text-sm font-medium">Cover letter (optional)</label>
              <Textarea
                id="cover"
                rows={5}
                className="mt-1.5"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={`Why you are a strong fit for ${job.title}…`}
              />
            </div>
          </section>

          <section aria-labelledby="acc-heading" className="surface-card space-y-4 p-5">
            <h2 id="acc-heading" className="text-xl font-semibold">
              Interview accommodation{" "}
              <span className="text-sm font-normal text-muted-foreground">(optional)</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Would you like to request any interview accommodation? This is entirely your choice.
              We never assume what you need, and nothing here affects your match score.
            </p>
            <fieldset>
              <legend className="text-sm font-medium">Requests</legend>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {ACCOMMODATIONS.map((a) => {
                  const id = `acc-${a.replace(/\W+/g, "-")}`;
                  const checked = chosen.includes(a);
                  return (
                    <li key={a} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() =>
                          setChosen((prev) => (checked ? prev.filter((x) => x !== a) : [...prev, a]))
                        }
                      />
                      <label htmlFor={id} className="text-sm">{a}</label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <div>
              <label htmlFor="acc-note" className="block text-sm font-medium">
                Anything else you want the employer to know (optional)
              </label>
              <Textarea id="acc-note" rows={3} className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/50 p-3">
              <Switch id="share-acc" checked={share} onCheckedChange={setShare} />
              <label htmlFor="share-acc" className="text-sm">
                Share these requests with this employer
                <span className="block text-muted-foreground">
                  Off by default. If off, your requests stay on AccessPath and are not sent.
                </span>
              </label>
            </div>
          </section>

          <Button type="submit" size="lg">Submit application</Button>
        </form>
      )}
    </div>
  );
}
