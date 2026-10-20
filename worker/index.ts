/**
 * Myenge worker (pm2 app "myenge-worker"). Polls the Job table of the shared database and runs the
 * heavy work the site cannot do on Vercel: score conversion (MuseScore), audio analysis and rendering.
 *
 *   node --env-file=.env --conditions=react-server --import tsx worker/index.ts
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { scoreConvert, scoreConvertFailed } from "./handlers/score-convert";

type Handler = {
  run: (payload: never) => Promise<unknown>;
  failed?: (payload: never, error: string) => Promise<void>;
  maxAttempts?: number;
};

const HANDLERS: Record<string, Handler> = {
  "score.convert": { run: scoreConvert, failed: scoreConvertFailed, maxAttempts: 2 },
};

const POLL_MS = 3000;
const STALE_MIN = 30;
let stopping = false;

type JobRow = { id: string; type: string; payload: unknown; attempts: number };

async function claim(): Promise<JobRow | null> {
  const types = Object.keys(HANDLERS);
  const rows = await prisma!.$queryRaw<JobRow[]>`
    UPDATE "Job" SET status = 'RUNNING', "startedAt" = now(), attempts = attempts + 1, "updatedAt" = now()
    WHERE id = (
      SELECT id FROM "Job"
      WHERE status = 'QUEUED' AND "runAfter" <= now() AND type = ANY(${types})
      ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload, attempts`;
  return rows[0] ?? null;
}

async function process1(job: JobRow) {
  const h = HANDLERS[job.type];
  const started = Date.now();
  try {
    const result = await h.run(job.payload as never);
    await prisma!.job.update({
      where: { id: job.id },
      data: { status: "DONE", finishedAt: new Date(), error: null, result: (result ?? {}) as Prisma.InputJsonValue },
    });
    console.log(`[job] ${job.type} ${job.id} done in ${Date.now() - started} ms`);
  } catch (err) {
    const e = err as Error & { stderr?: string };
    const message = (e.message || String(err)).split("\n")[0].slice(0, 300);
    const retry = job.attempts < (h.maxAttempts ?? 3);
    console.error(`[job] ${job.type} ${job.id} failed (attempt ${job.attempts}): ${message}`);
    if (e.stderr) console.error(e.stderr.slice(-2000));
    await prisma!.job.update({
      where: { id: job.id },
      data: retry
        ? { status: "QUEUED", error: message, runAfter: new Date(Date.now() + 60_000 * job.attempts) }
        : { status: "FAILED", error: message, finishedAt: new Date() },
    });
    if (!retry) await h.failed?.(job.payload as never, message).catch(() => {});
  }
}

/** Jobs left RUNNING by a crash go back to the queue. */
async function requeueStale() {
  await prisma!.job.updateMany({
    where: { status: "RUNNING", startedAt: { lt: new Date(Date.now() - STALE_MIN * 60_000) } },
    data: { status: "QUEUED" },
  });
}

async function main() {
  if (!prisma) throw new Error("DATABASE_URL missing");
  console.log(`[worker] started, handlers: ${Object.keys(HANDLERS).join(", ")}`);
  let lastStaleCheck = 0;
  while (!stopping) {
    try {
      if (Date.now() - lastStaleCheck > 60_000) {
        await requeueStale();
        lastStaleCheck = Date.now();
      }
      const job = await claim();
      if (job) {
        await process1(job);
        continue;
      }
    } catch (err) {
      console.error("[worker] loop error:", (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  await prisma.$disconnect();
}

for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => (stopping = true));
void main();
