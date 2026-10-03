import "server-only";

/**
 * SA Storage client (https://sastorage.fpswagg.site), used for song previews and backups.
 *
 * The API token is server-only. Its key prefix (e.g. "myenge-ma-bonakristo/") is applied by
 * SA Storage on upload, so callers pass keys relative to it; returned keys are full keys.
 * Files are publicly readable at `${SASTORAGE_URL}/files/<full key>`.
 */

export type StoredFile = {
  key: string;
  size: number;
  lastModified: string | null;
  contentType: string | null;
};

const baseUrl = () => (process.env.SASTORAGE_URL ?? "").replace(/\/$/, "");
const token = () => process.env.SASTORAGE_TOKEN ?? "";

export function hasSaStorage(): boolean {
  return !!baseUrl() && !!token();
}

function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  if (!hasSaStorage()) throw new Error("SA Storage is not configured (SASTORAGE_URL / SASTORAGE_TOKEN)");
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(`SA Storage ${init.method ?? "GET"} ${path.split("?")[0]} failed (${res.status}): ${body?.error ?? res.statusText}`);
  }
  return res;
}

/** Public URL of a stored object (full key, prefix included). */
export function publicFileUrl(fullKey: string): string {
  return `${baseUrl()}/files/${encodeKey(fullKey)}`;
}

/** Upload a file. `key` is relative to the token prefix. Returns the stored object. */
export async function uploadFile(
  key: string,
  body: Blob | string,
  contentType = "application/octet-stream",
): Promise<StoredFile> {
  const form = new FormData();
  const blob = typeof body === "string" ? new Blob([body], { type: contentType }) : body;
  form.append("file", blob, key.split("/").pop() || "file");
  form.append("key", key);
  const res = await api("/api/files", { method: "POST", body: form });
  const { object } = (await res.json()) as { object: StoredFile };
  return object;
}

/** List objects under a prefix (relative to the token prefix), following pagination. */
export async function listFiles(prefix = ""): Promise<StoredFile[]> {
  const me = (await (await api("/api/me")).json()) as { keyPrefix?: string | null };
  const full = `${me.keyPrefix ?? ""}${prefix}`;
  const out: StoredFile[] = [];
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({ prefix: full });
    if (cursor) qs.set("cursor", cursor);
    const data = (await (await api(`/api/files?${qs}`)).json()) as {
      objects: StoredFile[];
      truncated?: boolean;
      cursor?: string;
    };
    out.push(...data.objects);
    cursor = data.truncated ? data.cursor : undefined;
  } while (cursor);
  return out;
}

/** Download an object's text content (full key) through the public route. */
export async function downloadText(fullKey: string): Promise<string | null> {
  const res = await fetch(publicFileUrl(fullKey), { cache: "no-store" });
  return res.ok ? await res.text() : null;
}

export async function deleteFile(fullKey: string): Promise<void> {
  await api(`/api/files/${encodeKey(fullKey)}`, { method: "DELETE" });
}
