import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const briefingInput = z.object({ brief: z.string().min(1).max(6000) });

/**
 * Generates the plain-language part of the "Before you apply" panel.
 * The payload is job + skills information only — never identity, disability or
 * gender data — and the client falls back to deterministic advice on failure.
 */
export const generateApplyBriefing = createServerFn({ method: "POST" })
  .inputValidator((data) => briefingInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "AI is not configured on this deployment." };

    const system = [
      "You advise job seekers in India on an accessibility-first job platform.",
      "Write in plain, respectful, empowering language. Never mention disability, gender identity or protected characteristics.",
      "Only use facts from the provided brief. Never invent accessibility information; if something is missing, say it is not provided.",
      'Reply with JSON only: {"advice":["2 to 4 short sentences"],"question":"one question the candidate can send to HR"}',
    ].join(" ");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: data.brief },
          ],
          max_tokens: 900,
        }),
      });

      if (!res.ok) {
        const status = res.status;
        return {
          ok: false as const,
          error:
            status === 429
              ? "AI is busy right now. Showing the standard summary instead."
              : "We couldn't reach the AI assistant. Showing the standard summary instead.",
        };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return { ok: false as const, error: "The AI reply could not be read." };
      const parsed = JSON.parse(match[0]) as { advice?: unknown; question?: unknown };
      const advice = Array.isArray(parsed.advice)
        ? parsed.advice.map((a) => String(a)).filter(Boolean).slice(0, 4)
        : [];
      if (!advice.length) return { ok: false as const, error: "The AI reply was empty." };
      return {
        ok: true as const,
        advice,
        question: typeof parsed.question === "string" ? parsed.question : "",
      };
    } catch {
      return { ok: false as const, error: "We couldn't load the AI summary." };
    }
  });
