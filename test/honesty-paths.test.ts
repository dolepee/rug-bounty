import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";

process.env.DGRID_API_KEY = "";

function getModuleExports<T>(module: Record<string, unknown>) {
  return (module.default ?? module) as T;
}

const mockParsedLaunch = {
  token: "0x1111111111111111111111111111111111111111",
  creator: "0x2222222222222222222222222222222222222222",
  requestId: 7n,
  name: "LaunchToken",
  symbol: "LCH",
  totalSupply: 1_000_000_000n,
  launchTime: 1_710_000_000n,
  launchFee: 0n,
  tokenDecimals: 18,
  blockNumber: 99n,
  txHash: `0x${"ab".repeat(32)}`,
  tokenManager: "0x3333333333333333333333333333333333333333",
  rawLogIndex: 4,
} as const;

test("parse launch skill request serializes the real Four.Meme launch proof", async () => {
  const route = getModuleExports<{
    parseLaunchSkillRequest: (txHash: string, parser: (txHash: `0x${string}`) => Promise<typeof mockParsedLaunch>) => Promise<{ parsed: Record<string, string> }>;
  }>(await import("../app/api/skill/parse-launch/route.ts"));

  const result = await route.parseLaunchSkillRequest(mockParsedLaunch.txHash, async () => mockParsedLaunch);
  assert.equal(result.parsed.token, mockParsedLaunch.token);
  assert.equal(result.parsed.creator, mockParsedLaunch.creator);
  assert.equal(result.parsed.launchTime, mockParsedLaunch.launchTime.toString());
  assert.equal(result.parsed.requestId, mockParsedLaunch.requestId.toString());
});

test("create bond payload rejects manual launch mismatches and uses parsed Four.Meme launch data", async () => {
  const route = getModuleExports<{
    buildCreateBondPayload: (
      body: {
        launchTxHash: string;
        token?: string;
        creator?: string;
        launchTimestamp?: number;
        declaredCreatorWallets: string[];
        oathText: string;
        declaredRetainedBalance: string;
        expiresInSeconds: number;
        bondAmountBnb: string;
      },
      parser: (txHash: `0x${string}`) => Promise<typeof mockParsedLaunch>,
    ) => Promise<{ contract: { args: string[] }; proof: { creator: string; launchProof: { launchTimestamp: string } } }>;
  }>(await import("../app/api/skill/create-bond-payload/route.ts"));

  await assert.rejects(
    route.buildCreateBondPayload(
      {
        launchTxHash: mockParsedLaunch.txHash,
        token: "0x4444444444444444444444444444444444444444",
        declaredCreatorWallets: [mockParsedLaunch.creator],
        oathText: "I will hold at least 1.05M tokens for 15 minutes.",
        declaredRetainedBalance: "1050000000000000000000000",
        expiresInSeconds: 900,
        bondAmountBnb: "0.003",
      },
      async () => mockParsedLaunch,
    ),
    /does not match the real Four\.Meme TokenCreate event/,
  );

  const result = await route.buildCreateBondPayload(
    {
      launchTxHash: mockParsedLaunch.txHash,
      declaredCreatorWallets: [mockParsedLaunch.creator],
      oathText: "I will hold at least 1.05M tokens for 15 minutes.",
      declaredRetainedBalance: "1050000000000000000000000",
      expiresInSeconds: 900,
      bondAmountBnb: "0.003",
    },
    async () => mockParsedLaunch,
  );

  assert.equal(result.contract.args[0], mockParsedLaunch.token);
  assert.equal(result.proof.creator, mockParsedLaunch.creator);
  assert.equal(result.proof.launchProof.launchTimestamp, mockParsedLaunch.launchTime.toString());
});

test("create bond payload rejects duplicate declared creator wallets", async () => {
  const route = getModuleExports<{
    buildCreateBondPayload: (
      body: {
        launchTxHash: string;
        declaredCreatorWallets: string[];
        oathText: string;
        declaredRetainedBalance: string;
        expiresInSeconds: number;
        bondAmountBnb: string;
      },
      parser: (txHash: `0x${string}`) => Promise<typeof mockParsedLaunch>,
    ) => Promise<unknown>;
  }>(await import("../app/api/skill/create-bond-payload/route.ts"));

  await assert.rejects(
    route.buildCreateBondPayload(
      {
        launchTxHash: mockParsedLaunch.txHash,
        declaredCreatorWallets: [mockParsedLaunch.creator, mockParsedLaunch.creator],
        oathText: "I will hold at least 1.05M tokens for 15 minutes.",
        declaredRetainedBalance: "1050000000000000000000000",
        expiresInSeconds: 900,
        bondAmountBnb: "0.003",
      },
      async () => mockParsedLaunch,
    ),
    /must be unique/,
  );
});

test("classify route keeps enforceable and non-enforceable promises separate", async () => {
  const route = getModuleExports<{ POST: (request: Request) => Promise<Response> }>(await import("../app/api/oath/classify/route.ts"));
  const response = await route.POST(
    new Request("http://local/api/oath/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "I will hold at least 1.05M tokens for 15 minutes.\nBinance listing soon.",
      }),
    }),
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    classified: Array<{ class: string }>;
  };
  assert.equal(json.classified[0]?.class, "enforceable");
  assert.equal(json.classified[1]?.class, "not_enforceable");
});

test("compile route uses the enforceable classified segment instead of the first number in the oath", async () => {
  const route = getModuleExports<{ POST: (request: Request) => Promise<Response> }>(await import("../app/api/oath/compile/route.ts"));
  const response = await route.POST(
    new Request("http://local/api/oath/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "100x guaranteed.\nI will hold at least 1.05M tokens for 15 minutes.",
        tokenDecimals: 18,
      }),
    }),
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    selectedPromiseText: string | null;
    rule: { declaredRetainedBalance: string; expiresInSeconds: number } | null;
  };
  assert.equal(json.selectedPromiseText, "I will hold at least 1.05M tokens for 15 minutes.");
  assert.equal(json.rule?.declaredRetainedBalance, (1_050_000n * 10n ** 18n).toString());
  assert.equal(json.rule?.expiresInSeconds, 900);
});

test("DGrid classification parser accepts fenced JSON with null suggested rewrites", async () => {
  const dgrid = getModuleExports<{
    parseDgridClassificationContent: (raw: string, expectedSegments: number) => Array<{
      text: string;
      class: string;
      reason: string;
      suggestedRewrite?: string;
    }>;
  }>(await import("../lib/ai/dgrid.ts"));

  const result = dgrid.parseDgridClassificationContent(
    [
      "```json",
      "{",
      '  "classified": [',
      '    {"text":"I will hold at least 1.05M tokens for 15 minutes.","class":"enforceable","reason":"wallet floor","suggestedRewrite":null},',
      '    {"text":"Binance listing soon.","class":"not_enforceable","reason":"not onchain","suggestedRewrite":null}',
      "  ]",
      "}",
      "```",
    ].join("\n"),
    2,
  );

  assert.equal(result.length, 2);
  assert.equal(result[0]?.class, "enforceable");
  assert.equal(result[0]?.suggestedRewrite, undefined);
  assert.equal(result[1]?.class, "not_enforceable");
  assert.equal(result[1]?.suggestedRewrite, undefined);
});

test("public hunter feed falls back to verified proof history when no runtime feed file exists", async () => {
  const tempDir = path.join(os.tmpdir(), `rug-bounty-feed-empty-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.env.RUG_HUNTER_FEED_PATH = path.join(tempDir, "feed.json");

  try {
    const feed = getModuleExports<{ readHunterFeed: () => Promise<Array<unknown>> }>(await import("../lib/data/hunter-feed.ts"));
    const entries = await feed.readHunterFeed();
    assert.ok(entries.length >= 3);
    assert.equal((entries[0] as { source?: string }).source, "verified-proof");
  } finally {
    delete process.env.RUG_HUNTER_FEED_PATH;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("hunter runtime status remains unknown without a configured runtime snapshot or runtime feed", async () => {
  const tempDir = path.join(os.tmpdir(), `rug-bounty-status-empty-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  process.env.RUG_HUNTER_FEED_PATH = path.join(tempDir, "feed.json");
  process.env.RUG_HUNTER_STATUS_PATH = path.join(tempDir, "status.runtime.json");
  process.env.RUG_HUNTER_STATUS_URL = "";
  delete process.env.NEXT_PUBLIC_RUG_BOUNTY_VAULT_ADDRESS;
  delete process.env.RUG_BOUNTY_VAULT_ADDRESS;

  try {
    const statusModule = getModuleExports<{ getHunterRuntimeStatus: () => Promise<{ status: string; lastResolvedTxHash: string | null }> }>(
      await import("../lib/data/hunter-status.ts"),
    );
    const status = await statusModule.getHunterRuntimeStatus();
    assert.equal(status.status, "unknown");
    assert.equal(status.lastResolvedTxHash, "0x6d039369733eaca6d8d9475603449f723c58471577af0efca69565e9e50fed59");
  } finally {
    delete process.env.RUG_HUNTER_FEED_PATH;
    delete process.env.RUG_HUNTER_STATUS_PATH;
    delete process.env.RUG_HUNTER_STATUS_URL;
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("hunter runtime status is shaped from the actual watcher feed, not showcase rows", async () => {
  const tempDir = path.join(os.tmpdir(), `rug-bounty-status-feed-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });
  const feedPath = path.join(tempDir, "feed.json");
  const nowIso = new Date().toISOString();
  process.env.RUG_HUNTER_FEED_PATH = feedPath;
  process.env.RUG_HUNTER_STATUS_PATH = path.join(tempDir, "status.runtime.json");
  process.env.RUG_HUNTER_STATUS_URL = "";

  try {
    await writeFile(
      feedPath,
      JSON.stringify(
        [
          {
            id: "slashed-7",
            label: "bond #7 slashed to Rug Hunter Agent",
            txHash: `0x${"cd".repeat(32)}`,
            createdAtIso: nowIso,
          },
        ],
        null,
        2,
      ),
    );

    const statusModule = getModuleExports<{
      getHunterRuntimeStatus: () => Promise<{ status: string; lastResolvedBondId: string | null; lastResolvedTxHash: string | null }>;
    }>(await import("../lib/data/hunter-status.ts"));
    const status = await statusModule.getHunterRuntimeStatus();
    assert.equal(status.status, "online");
    assert.equal(status.lastResolvedBondId, "7");
    assert.equal(status.lastResolvedTxHash, `0x${"cd".repeat(32)}`);
  } finally {
    delete process.env.RUG_HUNTER_FEED_PATH;
    delete process.env.RUG_HUNTER_STATUS_PATH;
    delete process.env.RUG_HUNTER_STATUS_URL;
    await rm(tempDir, { recursive: true, force: true });
  }
});
