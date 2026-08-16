import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AccessibilityToolbar } from "./accessibility-toolbar";
import { useAppState } from "@/lib/app-state";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Jobs" },
  { to: "/saved", label: "Saved jobs" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/applications", label: "My applications" },
  { to: "/resume-match", label: "Resume match" },
  { to: "/privacy", label: "My privacy" },
  { to: "/employer", label: "For employers" },
  { to: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const { savedJobs } = useAppState();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <AccessibilityToolbar />
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="AccessPath home">
            <span className="flex size-9 items-center justify-center rounded-md bg-brand text-brand-foreground">
              <Compass aria-hidden="true" className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">AccessPath</span>
          </Link>
          <nav aria-label="Main navigation">
            <ul className="flex flex-wrap items-center gap-1 text-sm">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    activeOptions={{ exact: item.to === "/" }}
                    activeProps={{ className: "bg-accent text-accent-foreground" }}
                  >
                    {item.label}
                    {item.to === "/saved" && savedJobs.length > 0 ? (
                      <span className="ml-1 rounded-full bg-brand px-1.5 text-xs text-brand-foreground">
                        {savedJobs.length}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">AccessPath — find jobs without barriers.</p>
        <p className="mt-2 max-w-2xl">
          Accessibility and inclusion details on listings are provided by employers or verified by
          AccessPath. We never add accessibility claims on an employer's behalf. Sharing disability
          or gender identity information is always optional.
        </p>
      </div>
    </footer>
  );
}
