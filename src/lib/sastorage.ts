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

/** Same as isStorageConfigured() in src/lib/config.ts. */
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

/**
 * Upload a file. `key` is relative to the token prefix. Returns the stored object.
 * Media for the public site are uploaded "public" (readable at /files/<key>); backups pass "private".
 */
export async function uploadFile(
  key: string,
  body: Blob | string | Uint8Array,
  contentType = "application/octet-stream",
  visibility: "public" | "private" = "public",
): Promise<StoredFile> {
  const form = new FormData();
  const blob =
    typeof body === "string" ? new Blob([body], { type: contentType }) : body instanceof Uint8Array ? new Blob([body as BlobPart], { type: contentType }) : body;
  form.append("file", blob, key.split("/").pop() || "file");
  form.append("key", key);
  form.append("visibility", visibility);
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

/** A time-limited link to a file, public or private (default 10 minutes). */
export async function signedFileUrl(fullKey: string, expiresIn = 600): Promise<string> {
  const res = await api("/api/files/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: fullKey, expiresIn }),
  });
  return ((await res.json()) as { url: string }).url;
}

/** Download an object's text content (full key). Works for private files (signed link). */
export async function downloadText(fullKey: string): Promise<string | null> {
  const res = await fetch(await signedFileUrl(fullKey), { cache: "no-store" });
  return res.ok ? await res.text() : null;
}

/** Download an object's bytes (full key), public or private. */
export async function downloadBytes(fullKey: string): Promise<Uint8Array | null> {
  const res = await fetch(await signedFileUrl(fullKey), { cache: "no-store" });
  return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

/** Change the visibility of every file under a prefix (relative to the token prefix). */
export async function setVisibility(prefix: string, visibility: "public" | "private"): Promise<void> {
  const me = (await (await api("/api/me")).json()) as { keyPrefix?: string | null };
  await api("/api/files/visibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: `${me.keyPrefix ?? ""}${prefix}`, visibility }),
  });
}

/**
 * Upload big files (past the ~4.5 MB serverless body limit): the server asks SA Storage for a
 * presigned URL, PUTs the bytes to the bucket itself, then registers the file.
 */
export async function uploadLargeFile(
  key: string,
  bytes: Uint8Array,
  contentType: string,
  visibility: "public" | "private" = "public",
): Promise<StoredFile> {
  const fileName = key.split("/").pop() || "file";
  const pre = (await (
    await api("/api/files/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, key, contentType, visibility }),
    })
  ).json()) as { url: string };
  const put = await fetch(pre.url, { method: "PUT", body: bytes as BodyInit, headers: { "Content-Type": contentType } });
  if (!put.ok) throw new Error(`SA Storage upload failed (${put.status})`);
  const res = await api("/api/files/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, key, visibility }),
  });
  return ((await res.json()) as { object: StoredFile }).object;
}

export async function deleteFile(fullKey: string): Promise<void> {
  await api(`/api/files/${encodeKey(fullKey)}`, { method: "DELETE" });
}
