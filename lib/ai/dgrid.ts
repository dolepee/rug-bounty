import OpenAI from "openai";
import { z } from "zod";
import {
  classifyPromises as classifyPromisesDeterministic,
  splitPromiseText,
  type ClassifiedPromise,
} from "@/lib/ai/classifier";

const cleanEnv = (value?: string | null) => value?.trim() || undefined;

type BrokenOathInput = {
  ticker: string;
  floor: string;
  currentBalance: string;
  hunter: string;
  bondAmount: string;
  txHash: string;
};

const classifiedPromiseSchema = z.object({
  text: z.string().min(1),
  class: z.enum(["enforceable", "needs_social_proof", "not_enforceable"]),
  reason: z.string().min(1),
  suggestedRewrite: z.string().min(1).nullable().optional(),
});

const classificationResponseSchema = z.object({
  classified: z.array(classifiedPromiseSchema),
});

const dgridApiKey = cleanEnv(process.env.DGRID_API_KEY);
const dgridBaseUrl = cleanEnv(process.env.DGRID_BASE_URL) || "https://api.dgrid.ai/v1";
const dgridModel = cleanEnv(process.env.DGRID_MODEL) || "openai/gpt-5-mini";

function getDgridClient() {
  if (!dgridApiKey) {
    return null;
  }

  return new OpenAI({
    apiKey: dgridApiKey,
    baseURL: dgridBaseUrl,
    defaultHeaders: {
      "X-Title": "RugBounty",
      ...(cleanEnv(process.env.NEXT_PUBLIC_APP_URL) ? { "HTTP-Referer": cleanEnv(process.env.NEXT_PUBLIC_APP_URL) } : {}),
    },
  });
}

function extractFirstJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] || null;
}

export function parseDgridClassificationContent(raw: string, expectedSegments: number): ClassifiedPromise[] {
  const json = extractFirstJsonObject(raw);
  if (!json) {
    throw new Error("DGrid did not return parseable JSON.");
  }

  const parsed = classificationResponseSchema.parse(JSON.parse(json));
  if (parsed.classified.length !== expectedSegments) {
    throw new Error("DGrid classification length did not match the input segment count.");
  }

  return parsed.classified.map((item) => ({
    text: item.text,
    class: item.class,
    reason: item.reason,
    ...(item.suggestedRewrite ? { suggestedRewrite: item.suggestedRewrite } : {}),
  })) satisfies ClassifiedPromise[];
}

async function chatText(messages: Array<{ role: "system" | "user"; content: string }>) {
  const client = getDgridClient();
  if (!client) {
    throw new Error("DGrid is not configured.");
  }

  const response = await client.chat.completions.create({
    model: dgridModel,
    temperature: 0.1,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("DGrid returned an empty response.");
  }

  return content;
}

export function isDgridConfigured() {
  return Boolean(dgridApiKey);
}

export async function classifyPromisesWithFallback(input: string) {
  const segments = splitPromiseText(input);
  if (!isDgridConfigured()) {
    return {
      provider: "deterministic" as const,
      model: null,
      classified: classifyPromisesDeterministic(input),
    };
  }

  try {
    const content = await chatText([
      {
        role: "system",
        content:
          "You classify meme-launch promises for RugBounty. The only enforceable on-chain rule is CREATOR_WALLET_FLOOR. " +
          "Mark a promise as enforceable only if it clearly maps to creator-held token balance staying at or above a floor for a time window. " +
          "Mark social or posting promises as needs_social_proof. Mark listings, partnerships, guarantees, price predictions, or vague hype as not_enforceable. " +
          "Return strict JSON only with shape {\"classified\":[{\"text\":\"...\",\"class\":\"enforceable|needs_social_proof|not_enforceable\",\"reason\":\"...\",\"suggestedRewrite\":\"optional\"}]}",
      },
      {
        role: "user",
        content: JSON.stringify({
          segments,
          instruction:
            "Classify each segment independently. Preserve the original segment text exactly in the `text` field. Return one classified item per segment.",
        }),
      },
    ]);

    return {
      provider: "dgrid" as const,
      model: dgridModel,
      classified: parseDgridClassificationContent(content, segments.length),
    };
  } catch {
    return {
      provider: "deterministic" as const,
      model: null,
      classified: classifyPromisesDeterministic(input),
    };
  }
}

export async function generateBrokenOathPostWithFallback(input: BrokenOathInput) {
  if (!isDgridConfigured()) {
    return {
      provider: "deterministic" as const,
      model: null,
      post: `${input.ticker} broke its oath.\n\nFloor: ${input.floor}\nWallet at slash: ${input.currentBalance}\nBond: ${input.bondAmount} BNB slashed to ${input.hunter}\n\nProof: https://bscscan.com/tx/${input.txHash}`,
    };
  }

  try {
    const post = await chatText([
      {
        role: "system",
        content:
          "Write a short factual broken-oath post for RugBounty. " +
          "Avoid funeral, graveyard, autopsy, court, judge, or verdict language. " +
          "Keep it memetic but grounded, 4 to 6 short lines, with the proof link on the last line.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ]);

    return {
      provider: "dgrid" as const,
      model: dgridModel,
      post: post.trim(),
    };
  } catch {
    return {
      provider: "deterministic" as const,
      model: null,
      post: `${input.ticker} broke its oath.\n\nFloor: ${input.floor}\nWallet at slash: ${input.currentBalance}\nBond: ${input.bondAmount} BNB slashed to ${input.hunter}\n\nProof: https://bscscan.com/tx/${input.txHash}`,
    };
  }
}
