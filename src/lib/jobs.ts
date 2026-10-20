import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Background jobs, run by the worker on the server (worker/index.ts, pm2 app "myenge-worker").
 * The site only queues them; heavy tools (MuseScore, ffmpeg, FluidSynth, Basic Pitch) live there.
 */
export type JobType = "score.convert" | "recording.analyze" | "recording.render" | "recording.sing";

export async function enqueueJob(type: JobType, payload: Prisma.InputJsonValue) {
  if (!prisma) throw new Error("Database unavailable");
  return prisma.job.create({ data: { type, payload } });
}

/** Last job of a type for an object (payload.id), e.g. the conversion of one score. */
export async function latestJobFor(type: JobType, id: string) {
  if (!prisma) return null;
  return prisma.job.findFirst({
    where: { type, payload: { path: ["id"], equals: id } },
    orderBy: { createdAt: "desc" },
  });
}
