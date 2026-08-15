import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { JOBS, type Job } from "./jobs-data";

export type FontSize = "small" | "medium" | "large";

export type Profile = {
  name: string;
  /** Name the candidate wants employers to see. Falls back to name. */
  displayName: string;
  /** Optional. Never required, never used in matching. */
  pronouns: string;
  /** Optional, only for later stages of an employer's process. Never shown by default. */
  legalName: string;
  headline: string;
  skills: string[];
  education: string;
  experience: string;
  /** Self-declared experience band, used for match scoring. */
  experienceBand: "" | "Fresher" | "0-2 years" | "2-5 years" | "5+ years";
  careerInterests: string;
  certifications: string;
  preferredLocation: string;
  workPreference: "" | "Remote" | "Hybrid" | "On-site" | "No preference";
  resumeName: string;
  /** Pasted or extracted resume text, used for resume→job matching. */
  resumeText: string;
  /** Optional, private by default. Never shown publicly unless shared. */
  accessibilityPreferences: string[];
  shareAccessibilityWithEmployers: boolean;
  /** Privacy centre switches. Off means the field is never sent to employers. */
  sharePronouns: boolean;
  shareAccommodationsByDefault: boolean;
  shareOtherPersonal: boolean;
};

export const EMPTY_PROFILE: Profile = {
  name: "", displayName: "", pronouns: "", legalName: "",
  headline: "", skills: [], education: "", experience: "", experienceBand: "",
  careerInterests: "", certifications: "", preferredLocation: "", workPreference: "",
  resumeName: "", resumeText: "", accessibilityPreferences: [],
  shareAccessibilityWithEmployers: false, sharePronouns: false,
  shareAccommodationsByDefault: false, shareOtherPersonal: false,
};

export const APPLICATION_STATUSES = [
  "Applied", "Under Review", "Shortlisted", "Interview", "Offer", "Rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type Application = {
  jobId: string;
  status: ApplicationStatus;
  date: string;
  resumeName: string;
  coverLetter: string;
  /** Optional interview accommodation requests chosen by the candidate. */
  accommodations: string[];
  accommodationNote: string;
  /** Candidate decides whether accommodation requests are shared. */
  shareAccommodations: boolean;
  matchScore: number;
  nextStep: string;
};

export type FeedbackAnswer = "Yes" | "Partially" | "No";

/**
 * Private accessibility feedback. Stored for moderation review only — it is
 * never published against an employer automatically.
 */
export type Feedback = {
  id: string;
  jobId: string;
  date: string;
  accessible: FeedbackAnswer;
  respectful: FeedbackAnswer | "";
  note: string;
  status: "Awaiting moderation";
};

type State = {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  fontSize: FontSize;
  setFontSize: (v: FontSize) => void;
  savedJobs: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  profile: Profile;
  saveProfile: (p: Profile) => void;
  profileCompletion: number;
  applications: Application[];
  apply: (app: Omit<Application, "status" | "date" | "nextStep"> & { nextStep?: string }) => void;
  setApplicationStatus: (jobId: string, status: ApplicationStatus, nextStep?: string) => void;
  hasApplied: (jobId: string) => boolean;
  getApplication: (jobId: string) => Application | undefined;
  employerJobs: Job[];
  addEmployerJob: (job: Job) => void;
  feedback: Feedback[];
  addFeedback: (f: Omit<Feedback, "id" | "date" | "status">) => void;
  allJobs: Job[];
  findJob: (id: string) => Job | undefined;
};

const Ctx = createContext<State | null>(null);
const KEY = "accesspath:state:v3";

function read<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [applications, setApplications] = useState<Application[]>([]);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    const s = read({
      highContrast: false, fontSize: "medium" as FontSize, savedJobs: [] as string[],
      profile: EMPTY_PROFILE, applications: [] as Application[], employerJobs: [] as Job[],
      feedback: [] as Feedback[],
    });
    setHighContrast(s.highContrast);
    setFontSize(s.fontSize);
    setSavedJobs(s.savedJobs);
    setProfile({ ...EMPTY_PROFILE, ...s.profile });
    setApplications(s.applications);
    setEmployerJobs(s.employerJobs);
    setFeedback(s.feedback);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ highContrast, fontSize, savedJobs, profile, applications, employerJobs, feedback }),
    );
  }, [hydrated, highContrast, fontSize, savedJobs, profile, applications, employerJobs, feedback]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("hc", highContrast);
    document.documentElement.dataset["fontSize"] = fontSize;
  }, [highContrast, fontSize]);

  const toggleSaved = useCallback((id: string) => {
    setSavedJobs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }, []);

  const profileCompletion = useMemo(() => {
    const checks = [
      profile.name, profile.headline, profile.skills.length > 0, profile.education,
      profile.experience, profile.experienceBand, profile.careerInterests,
      profile.certifications, profile.preferredLocation, profile.workPreference,
      profile.resumeName || profile.resumeText,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  const allJobs = useMemo(() => [...employerJobs, ...JOBS], [employerJobs]);

  const value: State = {
    highContrast, setHighContrast, fontSize, setFontSize,
    savedJobs, toggleSaved,
    isSaved: (id) => savedJobs.includes(id),
    profile,
    saveProfile: setProfile,
    profileCompletion,
    applications,
    apply: (app) =>
      setApplications((prev) =>
        prev.some((a) => a.jobId === app.jobId)
          ? prev
          : [
              {
                ...app,
                status: "Applied" as ApplicationStatus,
                date: new Date().toISOString().slice(0, 10),
                nextStep: app.nextStep ?? "Employer review — you'll see status changes here.",
              },
              ...prev,
            ],
      ),
    setApplicationStatus: (jobId, status, nextStep) =>
      setApplications((prev) =>
        prev.map((a) =>
          a.jobId === jobId
            ? { ...a, status, nextStep: nextStep ?? NEXT_STEPS[status] }
            : a,
        ),
      ),
    hasApplied: (jobId) => applications.some((a) => a.jobId === jobId),
    getApplication: (jobId) => applications.find((a) => a.jobId === jobId),
    employerJobs,
    addEmployerJob: (job) => setEmployerJobs((prev) => [job, ...prev]),
    feedback,
    addFeedback: (f) =>
      setFeedback((prev) => [
        {
          ...f,
          id: `${f.jobId}-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          status: "Awaiting moderation" as const,
        },
        ...prev,
      ]),
    allJobs,
    findJob: (id) => allJobs.find((j) => j.id === id),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const NEXT_STEPS: Record<ApplicationStatus, string> = {
  Applied: "Employer review — you'll see status changes here.",
  "Under Review": "The hiring team is reviewing your profile and resume.",
  Shortlisted: "Expect an interview invitation with format and accessibility details.",
  Interview: "Confirm your interview slot and any accommodation you requested.",
  Offer: "Review the offer details and respond to the employer.",
  Rejected: "Not this time. Your match insights can guide the next application.",
};

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
