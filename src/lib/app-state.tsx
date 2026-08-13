import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";

export type FontSize = "small" | "medium" | "large";

export type Profile = {
  name: string;
  headline: string;
  skills: string[];
  education: string;
  experience: string;
  certifications: string;
  preferredLocation: string;
  workPreference: "" | "Remote" | "Hybrid" | "On-site" | "No preference";
  resumeName: string;
  /** Optional, private by default. Never shown publicly unless shared. */
  accessibilityPreferences: string[];
  shareAccessibilityWithEmployers: boolean;
};

export const EMPTY_PROFILE: Profile = {
  name: "", headline: "", skills: [], education: "", experience: "",
  certifications: "", preferredLocation: "", workPreference: "",
  resumeName: "", accessibilityPreferences: [], shareAccessibilityWithEmployers: false,
};

export type Application = { jobId: string; status: "Applied" | "In review" | "Interview"; date: string };

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
  apply: (jobId: string) => void;
  hasApplied: (jobId: string) => boolean;
};

const Ctx = createContext<State | null>(null);
const KEY = "accesspath:state:v1";

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

  useEffect(() => {
    const s = read({
      highContrast: false, fontSize: "medium" as FontSize, savedJobs: [] as string[],
      profile: EMPTY_PROFILE, applications: [] as Application[],
    });
    setHighContrast(s.highContrast);
    setFontSize(s.fontSize);
    setSavedJobs(s.savedJobs);
    setProfile({ ...EMPTY_PROFILE, ...s.profile });
    setApplications(s.applications);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ highContrast, fontSize, savedJobs, profile, applications }),
    );
  }, [hydrated, highContrast, fontSize, savedJobs, profile, applications]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("hc", highContrast);
    document.documentElement.dataset.fontSize = fontSize;
  }, [highContrast, fontSize]);

  const toggleSaved = useCallback((id: string) => {
    setSavedJobs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }, []);

  const profileCompletion = useMemo(() => {
    const checks = [
      profile.name, profile.headline, profile.skills.length > 0, profile.education,
      profile.experience, profile.certifications, profile.preferredLocation,
      profile.workPreference, profile.resumeName,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  const value: State = {
    highContrast, setHighContrast, fontSize, setFontSize,
    savedJobs, toggleSaved,
    isSaved: (id) => savedJobs.includes(id),
    profile,
    saveProfile: setProfile,
    profileCompletion,
    applications,
    apply: (jobId) =>
      setApplications((prev) =>
        prev.some((a) => a.jobId === jobId)
          ? prev
          : [{ jobId, status: "Applied", date: new Date().toISOString().slice(0, 10) }, ...prev],
      ),
    hasApplied: (jobId) => applications.some((a) => a.jobId === jobId),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
