import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Bookmark, FileCheck2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/job-card";
import { useAppState } from "@/lib/app-state";
import { MatchPill } from "@/components/match-insights";
import { averageMatch, rankJobs } from "@/lib/matching";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AccessPath" },
      {
        name: "description",
        content: "Recommended jobs, saved roles, application status and your career snapshot on AccessPath.",
      },
      { property: "og:title", content: "Dashboard — AccessPath" },
      { property: "og:description", content: "Track your inclusive job search in one place." },
    ],
  }),
  component: Dashboard,
});

function Stat({
  icon: Icon, label, value, to, cta,
}: { icon: typeof Briefcase; label: string; value: string; to: string; cta: string }) {
  return (
    <div className="surface-card p-5">
      <Icon aria-hidden="true" className="size-5 text-brand" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <Link to={to} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
        {cta}
      </Link>
    </div>
  );
}

function Dashboard() {
  const { savedJobs, applications, profile, profileCompletion, allJobs, findJob } = useAppState();
  const recommended = rankJobs(profile, allJobs, 3);
  const avg = averageMatch(profile, allJobs);
  const hasSignal = recommended.some((r) => r.hasProfileSignal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">
        {profile.name ? `Welcome back, ${profile.name.split(" ")[0]}` : "Your dashboard"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {profile.headline || "Complete your profile to improve your job matches."}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Your match score" value={`${avg}%`} to="/jobs" cta="Browse recommended jobs" />
        <Stat icon={Bookmark} label="Saved jobs" value={String(savedJobs.length)} to="/saved" cta="View saved jobs" />
        <Stat icon={FileCheck2} label="Applications" value={String(applications.length)} to="/applications" cta="Track applications" />
        <div className="surface-card p-5">
          <UserCheck aria-hidden="true" className="size-5 text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">Profile completion</p>
          <p className="text-2xl font-semibold">{profileCompletion}%</p>
          <Progress
            value={profileCompletion}
            className="mt-2"
            aria-label={`Profile ${profileCompletion} percent complete`}
          />
          <Link to="/profile" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
            Update profile
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="rec-heading">
          <h2 id="rec-heading" className="text-2xl font-bold">Recommended for you</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSignal
              ? "Matched to your skills, preferred location and work preference."
              : "Add skills and preferences to your profile for personalised matches. Showing latest roles for now."}
          </p>
          <ul className="mt-4 grid gap-4">
            {recommended.map(({ job }) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="apps-heading" className="surface-card p-5">
            <h2 id="apps-heading" className="text-lg font-semibold">Applications</h2>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No applications yet. Open a job and apply when the accessibility details work for
                you.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {applications.map((a) => {
                  const job = findJob(a.jobId);
                  if (!job) return null;
                  return (
                    <li key={a.jobId} className="text-sm">
                      <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                      <p className="text-muted-foreground">{job.company} • applied {a.date}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-normal">{a.status}</Badge>
                        {a.matchScore ? <MatchPill score={a.matchScore} /> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="snapshot-heading" className="surface-card p-5">
            <h2 id="snapshot-heading" className="text-lg font-semibold">Career snapshot</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Skills</dt>
                <dd>{profile.skills.length ? profile.skills.join(" • ") : "Not added yet"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Experience</dt>
                <dd className="whitespace-pre-line">{profile.experience || "Not added yet"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred work mode</dt>
                <dd>{profile.workPreference || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred location</dt>
                <dd>{profile.preferredLocation || "Not set"}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/profile">Edit profile</Link>
            </Button>
          </section>

          <section aria-labelledby="prefs-heading" className="surface-card p-5">
            <h2 id="prefs-heading" className="text-lg font-semibold">Accessibility preferences</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.accessibilityPreferences.length
                ? profile.accessibilityPreferences.join(" • ")
                : "None set. These are optional and private by default."}
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to="/profile">Edit accessibility preferences</Link>
            </Button>
          </section>

          <p className="text-xs text-muted-foreground">
            {allJobs.length} active listings across software, data, design, support, HR, marketing,
            content, finance and operations.
          </p>
        </aside>
      </div>
    </div>
  );
}
