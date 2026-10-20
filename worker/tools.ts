import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Heavy tools run in the "myenge-tools" Docker image (worker/tools.Dockerfile):
 * MuseScore (mounted from the host), FluidSynth + GM soundfont, ffmpeg.
 */
export const TOOLS_IMAGE = process.env.MYENGE_TOOLS_IMAGE ?? "myenge-tools";
export const MUSESCORE_DIR = process.env.MUSESCORE_DIR ?? "/home/debian/loba/tools/musescore/squashfs-root";

export function run(cmd: string, args: string[], timeoutMs = 180_000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(Object.assign(err, { stdout, stderr }));
      else resolve({ stdout, stderr });
    });
  });
}

/** Run a command in the tools container with `dir` mounted at /work (as the current user). */
export function inTools(dir: string, command: string[], timeoutMs = 180_000) {
  const uid = process.getuid?.() ?? 1000;
  const gid = process.getgid?.() ?? 1000;
  return run(
    "docker",
    [
      "run", "--rm", "--network", "none", "--memory", "2g", "--cpus", "2",
      "-u", `${uid}:${gid}`,
      "-v", `${MUSESCORE_DIR}:/opt/musescore:ro`,
      "-v", `${dir}:/work`,
      TOOLS_IMAGE,
      "sh", "-c", `ulimit -c 0; ${command.map(shellQuote).join(" ")}`,
    ],
    timeoutMs,
  );
}

/** MuseScore needs an X server even in converter mode: xvfb-run provides one. */
export const musescore = (args: string[]) => ["xvfb-run", "-a", "/opt/musescore/AppRun", ...args];

export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "myenge-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const shellQuote = (s: string) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);
