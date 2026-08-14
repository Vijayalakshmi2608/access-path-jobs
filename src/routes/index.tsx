import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Ear, Eye, Keyboard, ShieldCheck } from "lucide-react";
import { JobSearchBar } from "@/components/job-search-bar";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { JOBS } from "@/lib/jobs-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AccessPath — Find Jobs Without Barriers" },
      {
        name: "description",
        content:
          "Search Indian jobs with transparent accessibility and inclusive workplace information, voice search and read-aloud job descriptions.",
      },
      { property: "og:title", content: "AccessPath — Find Jobs Without Barriers" },
      {
        property: "og:description",
        content:
          "Search Indian jobs with transparent accessibility and inclusive workplace information, voice search and read-aloud job descriptions.",
      },
    ],
  }),
  component: Landing,
});

const QUICK = [
  "Software Developer",
  "Data Analyst",
  "Customer Support",
  "Content Writer",
  "HR Executive",
  "Digital Marketing",
];

const PILLARS = [
  { icon: Eye, title: "Screen-reader ready", body: "Semantic structure, labelled controls and read-aloud job descriptions." },
  { icon: Keyboard, title: "Fully keyboard operable", body: "Every search, filter and action works without a mouse." },
  { icon: Ear, title: "Voice job search", body: "Say what you're looking for and we search the listings." },
  { icon: ShieldCheck, title: "Privacy by default", body: "Identity and accessibility details stay optional and private." },
];

function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const featured = JOBS.slice(0, 3);

  const search = (value: string) =>
    navigate({ to: "/jobs", search: { q: value } });

  return (
    <>
      <section className="border-b border-border bg-brand-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium">
              <BadgeCheck aria-hidden="true" className="size-4 text-brand" />
              Employer-provided and platform-verified accessibility details
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              Find Jobs Without Barriers.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              AccessPath connects job seekers with opportunities and employers that provide
              transparent accessibility and inclusive workplace information.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/jobs" search={{ q: "" }}>Find Jobs</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/profile">Create Profile</Link>
              </Button>
            </div>
            <dl className="mt-8 flex flex-wrap gap-8 text-sm">
              <div>
                <dt className="text-muted-foreground">Open roles</dt>
                <dd className="text-2xl font-semibold">{JOBS.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Inclusive employers</dt>
                <dd className="text-2xl font-semibold">
                  {new Set(JOBS.map((j) => j.company)).size}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Remote-friendly roles</dt>
                <dd className="text-2xl font-semibold">
                  {JOBS.filter((j) => j.workMode === "Remote").length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="surface-card self-start bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Start your search</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search by job title, skill, company or city — by typing or by voice.
            </p>
            <div className="mt-4">
              <JobSearchBar value={q} onChange={setQ} onSubmit={search} id="hero-search" />
            </div>
            <h3 className="mt-6 text-sm font-medium">Popular searches</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {QUICK.map((item) => (
                <li key={item}>
                  <Button variant="secondary" size="sm" onClick={() => search(item)}>
                    {item}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="text-2xl font-bold">
          Built for how you actually search
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <li key={p.title} className="surface-card p-5">
              <p.icon aria-hidden="true" className="size-6 text-brand" />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="featured-heading" className="text-2xl font-bold">
            Latest opportunities
          </h2>
          <Button asChild variant="outline">
            <Link to="/jobs" search={{ q: "" }}>Browse all {JOBS.length} jobs</Link>
          </Button>
        </div>
        <ul className="mt-6 grid gap-4">
          {featured.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
