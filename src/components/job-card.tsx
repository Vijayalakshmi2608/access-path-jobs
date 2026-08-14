import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Building2, IndianRupee, MapPin } from "lucide-react";
import { ACCESS_FEATURES, type Job } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchPill } from "@/components/match-insights";
import { scoreJob } from "@/lib/matching";

export function JobCard({ job }: { job: Job }) {
  const { isSaved, toggleSaved, profile } = useAppState();
  const saved = isSaved(job.id);
  const match = scoreJob(profile, job);

  return (
    <article className="surface-card p-4 sm:p-5" aria-labelledby={`job-${job.id}-title`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`job-${job.id}-title`} className="text-lg font-semibold">
            <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 aria-hidden="true" className="size-4" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-4" />
              {job.city}
            </span>
            <span>{job.workMode}</span>
            <span>{job.employment}</span>
            <span>{job.experience}</span>
            {job.salary ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <IndianRupee aria-hidden="true" className="size-4" />
                {job.salary.replace("₹", "")}
              </span>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 min-w-11 shrink-0"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          onClick={() => toggleSaved(job.id)}
        >
          {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
        </Button>
      </div>

      <p className="mt-3">
        <MatchPill score={match.total} />
      </p>

      <p className="mt-3 text-sm">
        <span className="font-medium">Skills: </span>
        {job.requiredSkills.join(" • ")}
      </p>

      <div className="mt-3">
        <h4 className="text-sm font-medium">
          Accessibility{" "}
          <span className="font-normal text-muted-foreground">({job.accessSource})</span>
        </h4>
        <ul className="mt-2 flex flex-wrap gap-2">
          {job.access.slice(0, 4).map((a) => (
            <li key={a}>
              <Badge variant="secondary" className="font-normal">
                <span aria-hidden="true">✓</span> {ACCESS_FEATURES[a]}
              </Badge>
            </li>
          ))}
          {job.access.length > 4 ? (
            <li className="self-center text-xs text-muted-foreground">
              +{job.access.length - 4} more
            </li>
          ) : null}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Posted {job.posted}</span>
        <Button asChild size="sm">
          <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
            View job
            <span className="sr-only"> — {job.title} at {job.company}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
