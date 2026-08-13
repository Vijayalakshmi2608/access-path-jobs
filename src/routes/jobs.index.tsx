import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/components/job-card";
import { JobSearchBar } from "@/components/job-search-bar";
import {
  ACCESS_FEATURES, CITIES, INCLUSION_FEATURES,
} from "@/lib/jobs-data";
import { EMPTY_FILTERS, filterJobs, type Filters } from "@/lib/search";

export const Route = createFileRoute("/jobs/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Job Search — AccessPath" },
      {
        name: "description",
        content:
          "Search and filter Indian jobs by work mode, experience, accessibility support and inclusive workplace policies.",
      },
      { property: "og:title", content: "Job Search — AccessPath" },
      {
        property: "og:description",
        content: "Filter jobs by accessibility support and inclusive workplace information.",
      },
    ],
  }),
  component: JobsPage,
});

type Group = { key: keyof Filters; legend: string; options: { value: string; label: string }[] };

const GROUPS: Group[] = [
  {
    key: "workModes",
    legend: "Location & work mode",
    options: [
      { value: "Remote", label: "Remote" },
      { value: "Hybrid", label: "Hybrid" },
      { value: "On-site", label: "On-site" },
    ],
  },
  {
    key: "employment",
    legend: "Employment type",
    options: ["Full-time", "Part-time", "Internship", "Contract"].map((v) => ({ value: v, label: v })),
  },
  {
    key: "experience",
    legend: "Experience",
    options: ["Fresher", "0-2 years", "2-5 years", "5+ years"].map((v) => ({ value: v, label: v })),
  },
  {
    key: "cities",
    legend: "City",
    options: CITIES.map((c) => ({ value: c, label: c })),
  },
  {
    key: "access",
    legend: "Accessibility support",
    options: Object.entries(ACCESS_FEATURES).map(([value, label]) => ({ value, label })),
  },
  {
    key: "inclusion",
    legend: "Inclusive workplace information",
    options: Object.entries(INCLUSION_FEATURES).map(([value, label]) => ({ value, label })),
  },
];

function JobsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, q });
  const query = q || filters.q;

  const results = useMemo(() => filterJobs({ ...filters, q: query }), [filters, query]);
  const activeCount = GROUPS.reduce((n, g) => n + (filters[g.key] as string[]).length, 0);

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const setQuery = (value: string) => {
    setFilters((prev) => ({ ...prev, q: value }));
    navigate({ to: "/jobs", search: { q: value }, replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Find your next opportunity</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Accessibility and inclusion details below are provided by the employer or verified by
        AccessPath.
      </p>

      <div className="mt-6">
        <JobSearchBar value={query} onChange={setQuery} onSubmit={setQuery} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside aria-label="Job filters">
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...EMPTY_FILTERS, q: query })}
                >
                  Clear all ({activeCount})
                </Button>
              ) : null}
            </div>
            <div className="mt-2 divide-y divide-border">
              {GROUPS.map((group) => (
                <fieldset key={group.key} className="py-4">
                  <legend className="mb-2 text-sm font-semibold">{group.legend}</legend>
                  <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {group.options.map((opt) => {
                      const id = `${group.key}-${opt.value}`;
                      const checked = (filters[group.key] as string[]).includes(opt.value);
                      return (
                        <li key={id} className="flex items-center gap-2">
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={() => toggle(group.key, opt.value)}
                          />
                          <label htmlFor={id} className="text-sm">
                            {opt.label}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              ))}
            </div>
          </div>
        </aside>

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-lg font-semibold" aria-live="polite">
            {results.length} {results.length === 1 ? "job" : "jobs"} found
            {query ? ` for “${query}”` : ""}
          </h2>
          {results.length === 0 ? (
            <p className="surface-card mt-4 p-6 text-sm text-muted-foreground">
              No jobs match these filters yet. Try removing a filter or searching a broader term
              such as “developer” or “support”.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4">
              {results.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
