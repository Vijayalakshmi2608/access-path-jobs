import { ACCESS_FEATURES, type Job } from "./jobs-data";
import type { Profile } from "./app-state";
import { accessibilityFit, accessTransparency } from "./accessibility";
import { scoreJob } from "./matching";

/** Everything the "Before you apply" panel needs, computed from real data only. */
export type Briefing = {
  jobTitle: string;
  company: string;
  matched: string[];
  mayNeed: string[];
  workArrangement: string;
  accessibilityProvided: string[];
  interview: string;
  missingInformation: string[];
  matchScore: number;
  accessibilityFitScore: number;
  accessibilityFitSummary: string;
  suggestedQuestion: string;
};

export function buildBriefing(profile: Profile, job: Job): Briefing {
  const match = scoreJob(profile, job);
  const fit = accessibilityFit(profile.accessibilityPreferences, job);
  const rows = accessTransparency(job);
  const unspecified = rows.filter((r) => r.level === "unspecified");

  const missingInformation = unspecified.map((r) => `${r.label}: not provided by the employer.`);

  const interviewKnown = job.access.includes("accessible_interview");
  const interview = interviewKnown
    ? `Accessible interview process offered (${job.accessSource.toLowerCase()}).`
    : "The employer has not described the interview format or its accessibility.";

  const gap = unspecified[0];
  const suggestedQuestion = gap
    ? `Could you confirm whether ${gap.label.toLowerCase()} is available for this role and during the interview process?`
    : "Could you confirm which interview platform you use and that it works with screen readers?";

  return {
    jobTitle: job.title,
    company: job.company,
    matched: match.matchedRequired.concat(match.matchedPreferred),
    mayNeed: match.missingRequired,
    workArrangement: `${job.workMode} • ${job.city} • ${job.employment}`,
    accessibilityProvided: job.access.map((a) => ACCESS_FEATURES[a]),
    interview,
    missingInformation,
    matchScore: match.total,
    accessibilityFitScore: fit.score,
    accessibilityFitSummary: fit.summary,
    suggestedQuestion,
  };
}

/** Compact, privacy-safe prompt payload. No identity, disability or legal name. */
export function briefingPrompt(b: Briefing) {
  return [
    `Role: ${b.jobTitle} at ${b.company}`,
    `Work arrangement: ${b.workArrangement}`,
    `Skills the candidate already matches: ${b.matched.join(", ") || "none recorded"}`,
    `Skills the candidate may need: ${b.mayNeed.join(", ") || "none"}`,
    `Accessibility features the employer states: ${b.accessibilityProvided.join(", ") || "none"}`,
    `Interview information: ${b.interview}`,
    `Accessibility information the employer did NOT provide: ${
      b.missingInformation.join("; ") || "none"
    }`,
    `Professional match score: ${b.matchScore}%. Accessibility Fit: ${b.accessibilityFitScore}%.`,
  ].join("\n");
}

/** Used when AI is unavailable, so the feature never fails. */
export function fallbackAdvice(b: Briefing) {
  const lines = [
    b.matched.length
      ? `You already match ${b.matched.slice(0, 4).join(", ")}, so lead with those in your application.`
      : "Add your skills to your profile so this summary can highlight your strengths.",
  ];
  if (b.mayNeed.length)
    lines.push(`Be ready to talk about ${b.mayNeed.slice(0, 3).join(", ")} — the employer lists these as requirements.`);
  if (b.missingInformation.length)
    lines.push(
      `${b.missingInformation.length} accessibility detail${b.missingInformation.length === 1 ? " is" : "s are"} missing from this listing, so ask before the interview stage.`,
    );
  return { advice: lines, question: b.suggestedQuestion, source: "offline" as const };
}
