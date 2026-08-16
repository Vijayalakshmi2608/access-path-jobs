import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { JOBS, type Job } from "./jobs-data";

export type FontSize = "small" | "medium" | "large" | "x-large";
export type MotionPref = "normal" | "reduced";

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
  /** Preferred (display) name visibility. On by default so employers can address you. */
  shareDisplayName: boolean;
  /** Legal name visibility. Off by default — only for later payroll/background stages. */
  shareLegalName: boolean;
};

export const EMPTY_PROFILE: Profile = {
  name: "", displayName: "", pronouns: "", legalName: "",
  headline: "", skills: [], education: "", experience: "", experienceBand: "",
  careerInterests: "", certifications: "", preferredLocation: "", workPreference: "",
  resumeName: "", resumeText: "", accessibilityPreferences: [],
  shareAccessibilityWithEmployers: false, sharePronouns: false,
  shareAccommodationsByDefault: false, shareOtherPersonal: false,
  shareDisplayName: true, shareLegalName: false,
};

/** Privacy defaults applied by "Reset privacy settings". Private-first. */
export const DEFAULT_PRIVACY = {
  shareDisplayName: true,
  shareLegalName: false,
  sharePronouns: false,
  shareAccessibilityWithEmployers: false,
  shareAccommodationsByDefault: false,
  shareOtherPersonal: false,
} as const;

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

export const FEEDBACK_CATEGORIES = [
  { key: "application", label: "Application" },
  { key: "interview", label: "Interview" },
  { key: "communication", label: "Communication" },
  { key: "assessment", label: "Assessment" },
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["key"];

export const FEEDBACK_BARRIERS = [
  "Screen-reader issue",
  "Keyboard accessibility issue",
  "Captioning issue",
  "Inaccessible assessment",
  "Communication barrier",
  "Missing accessibility information",
  "Other",
] as const;

/**
 * Accessibility feedback about a hiring process. Only aggregated ratings are
 * ever shown on an employer profile — never an individual submission.
 */
export type Feedback = {
  id: string;
  jobId: string;
  company: string;
  date: string;
  ratings: Partial<Record<FeedbackCategory, number>>;
  barriers: string[];
  note: string;
  /** Anonymous by default: no candidate name is stored with the submission. */
  anonymous: boolean;
  status: "Recorded";
};

type State = {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  fontSize: FontSize;
  setFontSize: (v: FontSize) => void;
  motion: MotionPref;
  setMotion: (v: MotionPref) => void;
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
  hasFeedback: (jobId: string) => boolean;
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
  const [motion, setMotion] = useState<MotionPref>("normal");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [applications, setApplications] = useState<Application[]>([]);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    const s = read({
      highContrast: false, fontSize: "medium" as FontSize, savedJobs: [] as string[],
      profile: EMPTY_PROFILE, applications: [] as Application[], employerJobs: [] as Job[],
      feedback: [] as Feedback[], motion: "normal" as MotionPref,
    });
    setHighContrast(s.highContrast);
    setFontSize(s.fontSize);
    setMotion(s.motion);
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
      JSON.stringify({ highContrast, fontSize, motion, savedJobs, profile, applications, employerJobs, feedback }),
    );
  }, [hydrated, highContrast, fontSize, motion, savedJobs, profile, applications, employerJobs, feedback]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("hc", highContrast);
    document.documentElement.dataset["fontSize"] = fontSize;
    document.documentElement.dataset["motion"] = motion;
  }, [highContrast, fontSize, motion]);

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
    highContrast, setHighContrast, fontSize, setFontSize, motion, setMotion,
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
          status: "Recorded" as const,
        },
        ...prev,
      ]),
    hasFeedback: (jobId) => feedback.some((f) => f.jobId === jobId),
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
