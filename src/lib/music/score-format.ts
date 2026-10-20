import { strFromU8, unzipSync } from "fflate";

/**
 * Score uploads: detect the format, unpack compressed MusicXML (.mxl) and read basic metadata.
 * Pure functions (browser + server). Formats the player cannot render (.mid, .mscz) are kept
 * as originals and converted by the worker (worker/convert-score.ts) with MuseScore.
 */

export type RenderFormat = "MUSICXML" | "ABC" | "MEI";
export type UploadKind = "musicxml" | "mxl" | "abc" | "mei" | "midi" | "mscz" | "unknown";

export const SCORE_EXTENSIONS = [".musicxml", ".xml", ".mxl", ".abc", ".mei", ".mid", ".midi", ".mscz"] as const;
export const MAX_SCORE_BYTES = 4 * 1024 * 1024;

const ext = (name: string) => (name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "");

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  return sig.every((b, i) => bytes[i] === b);
}

function headText(bytes: Uint8Array, n = 2048): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, n)).replace(/^\uFEFF/, "");
}

/** Format of an uploaded file, from its content first, then its extension. */
export function detectUploadKind(name: string, bytes: Uint8Array): UploadKind {
  const e = ext(name);
  if (startsWith(bytes, [0x4d, 0x54, 0x68, 0x64])) return "midi"; // "MThd"
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    if (e === ".mscz") return "mscz";
    // Zip: compressed MusicXML has META-INF/container.xml; MuseScore files hold a .mscx.
    try {
      const files = Object.keys(unzipSync(bytes, { filter: (f) => !f.name.endsWith("/") && f.originalSize < 64 * 1024 * 1024 }));
      if (files.some((f) => f.toLowerCase().endsWith(".mscx"))) return "mscz";
      if (files.some((f) => /\.(musicxml|xml)$/i.test(f) && !f.startsWith("META-INF/"))) return "mxl";
    } catch {
      return "unknown";
    }
    return "unknown";
  }
  const head = headText(bytes);
  if (/<score-(partwise|timewise)[\s>]/.test(head)) return "musicxml";
  if (/<mei[\s>]/.test(head)) return "mei";
  if (/^\s*X:\s*\d*/m.test(head) && /^\s*K:/m.test(headText(bytes, 64 * 1024))) return "abc";
  if (e === ".musicxml" || e === ".xml") return /<\?xml|<!DOCTYPE/.test(head) ? "musicxml" : "unknown";
  if (e === ".abc") return "abc";
  return "unknown";
}

/** MusicXML text inside a compressed .mxl file. */
export function extractMxl(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const container = files["META-INF/container.xml"];
  let path: string | undefined;
  if (container) path = /full-path="([^"]+)"/.exec(strFromU8(container))?.[1];
  if (!path || !files[path]) path = Object.keys(files).find((f) => /\.(musicxml|xml)$/i.test(f) && !f.startsWith("META-INF/"));
  if (!path) throw new Error("No MusicXML file inside this .mxl");
  return strFromU8(files[path]);
}

export type PreparedScore =
  | { kind: UploadKind; format: RenderFormat; content: string; needsConversion: false }
  | { kind: UploadKind; format: null; content: null; needsConversion: true };

/** Turn an upload into something the player renders, or flag it for server-side conversion. */
export function prepareScore(name: string, bytes: Uint8Array): PreparedScore {
  const kind = detectUploadKind(name, bytes);
  const text = () => new TextDecoder().decode(bytes).replace(/^\uFEFF/, "");
  switch (kind) {
    case "musicxml":
      return { kind, format: "MUSICXML", content: text(), needsConversion: false };
    case "mxl":
      return { kind, format: "MUSICXML", content: extractMxl(bytes), needsConversion: false };
    case "abc":
      return { kind, format: "ABC", content: text(), needsConversion: false };
    case "mei":
      return { kind, format: "MEI", content: text(), needsConversion: false };
    case "midi":
    case "mscz":
      return { kind, format: null, content: null, needsConversion: true };
    default:
      throw new Error("UNSUPPORTED_FORMAT");
  }
}

export type ScoreMeta = { title?: string; key?: string; timeSignature?: string; composer?: string; tempo?: number };

const MAJOR_BY_FIFTHS = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"];
const MINOR_BY_FIFTHS = ["Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#"];

/** Key name from a number of fifths (-7..7) and a mode, e.g. (1, "major") → "G", (0, "minor") → "A minor". */
export function keyName(fifths: number, mode = "major"): string | undefined {
  const i = fifths + 7;
  if (i < 0 || i > 14) return undefined;
  return mode === "minor" ? `${MINOR_BY_FIFTHS[i]} minor` : MAJOR_BY_FIFTHS[i];
}

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();

/** Title, key, time signature, composer and tempo read from the score, to prefill the tune form. */
export function readScoreMeta(content: string, format: RenderFormat): ScoreMeta {
  const meta: ScoreMeta = {};
  if (format === "MUSICXML") {
    const title = /<work-title>([^<]+)<\/work-title>/.exec(content)?.[1] ?? /<movement-title>([^<]+)<\/movement-title>/.exec(content)?.[1];
    if (title) meta.title = decodeXml(title);
    const composer = /<creator[^>]*type="composer"[^>]*>([^<]+)<\/creator>/.exec(content)?.[1];
    if (composer) meta.composer = decodeXml(composer);
    const fifths = /<fifths>(-?\d+)<\/fifths>/.exec(content)?.[1];
    const mode = /<mode>(\w+)<\/mode>/.exec(content)?.[1];
    if (fifths !== undefined) meta.key = keyName(Number(fifths), mode);
    const beats = /<beats>(\d+)<\/beats>\s*<beat-type>(\d+)<\/beat-type>/.exec(content);
    if (beats) meta.timeSignature = `${beats[1]}/${beats[2]}`;
    const tempo = /<sound[^>]*tempo="([\d.]+)"/.exec(content)?.[1];
    if (tempo) meta.tempo = Math.round(Number(tempo));
  } else if (format === "ABC") {
    const field = (f: string) => new RegExp(`^${f}:\\s*(.+)$`, "m").exec(content)?.[1]?.trim();
    meta.title = field("T");
    meta.composer = field("C");
    meta.timeSignature = field("M")?.replace(/^C\|$/, "2/2").replace(/^C$/, "4/4");
    const k = field("K");
    if (k) meta.key = k.replace(/\s*m(in)?$/i, " minor").replace(/\s*maj(or)?$/i, "");
    const q = /=\s*(\d+)/.exec(field("Q") ?? "")?.[1];
    if (q) meta.tempo = Number(q);
  } else if (format === "MEI") {
    const title = /<title[^>]*>([^<]+)<\/title>/.exec(content)?.[1];
    if (title) meta.title = decodeXml(title);
    const count = /meter\.count="(\d+)"/.exec(content)?.[1] ?? /<meterSig[^>]*count="(\d+)"/.exec(content)?.[1];
    const unit = /meter\.unit="(\d+)"/.exec(content)?.[1] ?? /<meterSig[^>]*unit="(\d+)"/.exec(content)?.[1];
    if (count && unit) meta.timeSignature = `${count}/${unit}`;
  }
  for (const k of Object.keys(meta) as (keyof ScoreMeta)[]) if (meta[k] === undefined || meta[k] === "") delete meta[k];
  return meta;
}

export function contentTypeFor(format: RenderFormat): string {
  return format === "MUSICXML" ? "application/vnd.recordare.musicxml+xml" : format === "ABC" ? "text/vnd.abc" : "application/mei+xml";
}

export function extensionFor(format: RenderFormat): string {
  return format === "MUSICXML" ? "musicxml" : format === "ABC" ? "abc" : "mei";
}
