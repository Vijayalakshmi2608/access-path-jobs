import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppState, type Profile } from "@/lib/app-state";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — AccessPath" },
      {
        name: "description",
        content:
          "Create a professional job-seeker profile on AccessPath. Accessibility preferences are optional and private by default.",
      },
      { property: "og:title", content: "Your Profile — AccessPath" },
      { property: "og:description", content: "Build your career profile and get matched to inclusive roles." },
    ],
  }),
  component: ProfilePage,
});

const ACCESS_PREFS = [
  "Screen reader user",
  "Keyboard-only navigation",
  "Magnification / large text",
  "Captions for meetings",
  "Assistive technology at work",
  "Flexible or remote working",
  "Accessible interview format",
];

function Field({
  label, id, hint, children,
}: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ProfilePage() {
  const { profile, saveProfile, profileCompletion } = useAppState();
  const [form, setForm] = useState<Profile>(profile);
  const navigate = useNavigate();

  useEffect(() => setForm(profile), [profile]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Your profile</h1>
      <p className="mt-2 text-muted-foreground">
        Build your career profile to get better job matches. You never have to disclose disability
        or gender identity.
      </p>

      <div className="surface-card mt-6 p-4">
        <h2 className="text-sm font-semibold">Profile completion: {profileCompletion}%</h2>
        <Progress value={profileCompletion} className="mt-2" aria-label={`Profile ${profileCompletion} percent complete`} />
      </div>

      <form
        className="mt-6 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          saveProfile(form);
          toast.success("Profile saved");
          navigate({ to: "/dashboard" });
        }}
      >
        <section aria-labelledby="basics-heading" className="surface-card space-y-4 p-5">
          <h2 id="basics-heading" className="text-xl font-semibold">Basic details</h2>
          <Field label="Full name" id="name">
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Professional headline" id="headline" hint="For example: Frontend developer focused on accessible interfaces">
            <Input id="headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label="Skills" id="skills" hint="Separate skills with commas">
            <Input
              id="skills"
              value={form.skills.join(", ")}
              onChange={(e) =>
                set("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
              }
            />
          </Field>
        </section>

        <section aria-labelledby="career-heading" className="surface-card space-y-4 p-5">
          <h2 id="career-heading" className="text-xl font-semibold">Career history</h2>
          <Field label="Education" id="education">
            <Textarea id="education" rows={3} value={form.education} onChange={(e) => set("education", e.target.value)} />
          </Field>
          <Field label="Experience" id="experience">
            <Textarea id="experience" rows={4} value={form.experience} onChange={(e) => set("experience", e.target.value)} />
          </Field>
          <Field label="Certifications" id="certifications">
            <Textarea id="certifications" rows={2} value={form.certifications} onChange={(e) => set("certifications", e.target.value)} />
          </Field>
        </section>

        <section aria-labelledby="prefs-heading" className="surface-card space-y-4 p-5">
          <h2 id="prefs-heading" className="text-xl font-semibold">Job preferences</h2>
          <Field label="Preferred location" id="preferredLocation" hint="City name, or “Remote”">
            <Input id="preferredLocation" value={form.preferredLocation} onChange={(e) => set("preferredLocation", e.target.value)} />
          </Field>
          <Field label="Work preference" id="workPreference">
            <Select
              value={form.workPreference || undefined}
              onValueChange={(v) => set("workPreference", v as Profile["workPreference"])}
            >
              <SelectTrigger id="workPreference">
                <SelectValue placeholder="Select a work preference" />
              </SelectTrigger>
              <SelectContent>
                {["Remote", "Hybrid", "On-site", "No preference"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Resume" id="resume" hint="PDF or DOCX. Stored on this device only in this demo.">
            <Input
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => set("resumeName", e.target.files?.[0]?.name ?? "")}
            />
          </Field>
          {form.resumeName ? (
            <p className="text-sm text-muted-foreground">Attached: {form.resumeName}</p>
          ) : null}
        </section>

        <section aria-labelledby="access-heading" className="surface-card space-y-4 p-5">
          <h2 id="access-heading" className="text-xl font-semibold">
            Accessibility preferences <span className="text-sm font-normal text-muted-foreground">(optional)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            These help us surface roles that match how you work. They are private by default, are
            never shown publicly, and you are never asked to disclose a disability or gender
            identity.
          </p>
          <fieldset>
            <legend className="text-sm font-medium">What support matters to you?</legend>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {ACCESS_PREFS.map((pref) => {
                const id = `pref-${pref.replace(/\W+/g, "-")}`;
                const checked = form.accessibilityPreferences.includes(pref);
                return (
                  <li key={pref} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() =>
                        set(
                          "accessibilityPreferences",
                          checked
                            ? form.accessibilityPreferences.filter((p) => p !== pref)
                            : [...form.accessibilityPreferences, pref],
                        )
                      }
                    />
                    <label htmlFor={id} className="text-sm">{pref}</label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/50 p-3">
            <Switch
              id="share-access"
              checked={form.shareAccessibilityWithEmployers}
              onCheckedChange={(v) => set("shareAccessibilityWithEmployers", v)}
            />
            <label htmlFor="share-access" className="text-sm">
              Share my accessibility preferences with employers when I apply
              <span className="block text-muted-foreground">
                Off by default. You stay in control of what employers can see.
              </span>
            </label>
          </div>
        </section>

        <div className="flex gap-3">
          <Button type="submit" size="lg">Save profile</Button>
          <Button type="button" size="lg" variant="outline" onClick={() => setForm(profile)}>
            Reset changes
          </Button>
        </div>
      </form>
    </div>
  );
}
