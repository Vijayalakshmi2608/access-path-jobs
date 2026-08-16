import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchPill } from "@/components/match-insights";
import { AccessibilityFeedbackDialog } from "@/components/accessibility-feedback";
import { APPLICATION_STATUSES, useAppState, type ApplicationStatus } from "@/lib/app-state";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "My Applications — AccessPath" },
      {
        name: "description",
        content:
          "Track every AccessPath application: company, role, date applied, current status and your next step.",
      },
      { property: "og:title", content: "My Applications — AccessPath" },
      { property: "og:description", content: "Follow your applications from applied to offer." },
    ],
  }),
  component: ApplicationsPage,
});

const TONE: Record<ApplicationStatus, string> = {
  Applied: "secondary",
  "Under Review": "secondary",
  Shortlisted: "default",
  Interview: "default",
  Offer: "default",
  Rejected: "outline",
};

function ApplicationsPage() {
  const { applications, findJob } = useAppState();
  const [filter, setFilter] = useState<"All" | ApplicationStatus>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = applications.filter((a) => filter === "All" || a.status === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">My applications</h1>
      <p className="mt-2 text-muted-foreground" aria-live="polite">
        {applications.length} {applications.length === 1 ? "application" : "applications"} tracked on
        this device.
      </p>

      <div role="group" aria-label="Filter applications by status" className="mt-6 flex flex-wrap gap-2">
        {(["All", ...APPLICATION_STATUSES] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="surface-card mt-6 p-6">
          <h2 className="font-semibold">Nothing here yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length
              ? "No applications with this status."
              : "Apply to a role and it will appear here with its status and next step."}
          </p>
          <Button asChild className="mt-4">
            <Link to="/jobs" search={{ q: "" }}>Find jobs</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {visible.map((a) => {
            const job = findJob(a.jobId);
            if (!job) return null;
            const open = openId === a.jobId;
            const panelId = `app-panel-${a.jobId}`;
            return (
              <li key={a.jobId} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:underline">
                        {job.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {job.company} • {job.city} • applied {a.date}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={TONE[a.status] as "default" | "secondary" | "outline"} className="font-normal">
                      {a.status}
                    </Badge>
                    {a.matchScore ? <MatchPill score={a.matchScore} /> : null}
                  </div>
                </div>

                <p className="mt-3 text-sm">
                  <span className="font-medium">Next step: </span>
                  {a.nextStep}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : a.jobId)}
                >
                  {open ? "Hide application details" : "View application details"}
                </Button>

                {["Interview", "Offer", "Rejected"].includes(a.status) ? (
                  <div className="mt-3 rounded-md border border-border bg-secondary/40 p-3">
                    <p className="text-sm">
                      Reached the {a.status === "Interview" ? "interview stage" : "end of this process"}?
                      Share how accessible it was — anonymous by default, and it only ever appears as
                      an aggregate on the employer profile.
                    </p>
                    <div className="mt-2">
                      <AccessibilityFeedbackDialog jobId={a.jobId} company={job.company} />
                    </div>
                  </div>
                ) : null}

                {open ? (
                  <dl id={panelId} className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Company</dt>
                      <dd>{job.company}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Role</dt>
                      <dd>{job.title} — {job.workMode}, {job.employment}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Date applied</dt>
                      <dd>{a.date}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Resume sent</dt>
                      <dd>{a.resumeName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Cover letter</dt>
                      <dd className="whitespace-pre-line">{a.coverLetter || "Not included"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Accommodation requests</dt>
                      <dd>
                        {a.accommodations.length ? a.accommodations.join(", ") : "None requested"}
                        {a.accommodationNote ? ` — ${a.accommodationNote}` : ""}
                        <span className="block text-muted-foreground">
                          {a.shareAccommodations
                            ? "Shared with this employer at your request."
                            : "Kept private — not sent to the employer."}
                        </span>
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
