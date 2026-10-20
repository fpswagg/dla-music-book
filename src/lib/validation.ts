import { z } from "zod";

/** Shared request schemas (zod 4). */

export const songReferenceInput = z.object({
  hymnalId: z.string().min(1),
  number: z.string().trim().min(1).max(12),
});

const songFields = {
  /** Empty = first line of the lyrics (how the book's index names hymns). */
  title: z.string().trim().max(200),
  index: z.coerce.number().int().min(1).max(99999),
  status: z.enum(["DRAFT", "FINISHED"]),
  page: z.coerce.number().int().min(1).max(9999).nullable(),
  tune: z.string().trim().max(200).nullable(),
  /** Lyrics in the text format of src/lib/lyrics.ts. */
  lyricsText: z.string().max(50_000),
  refrainAfterEachStanza: z.boolean(),
  authorIds: z.array(z.string()),
  tagIds: z.array(z.string()),
  languageIds: z.array(z.string()),
  references: z.array(songReferenceInput).max(20),
};

export const songInput = z.object({
  ...songFields,
  title: songFields.title.default(""),
  status: songFields.status.default("DRAFT"),
  page: songFields.page.optional(),
  tune: songFields.tune.optional(),
  lyricsText: songFields.lyricsText.default(""),
  refrainAfterEachStanza: songFields.refrainAfterEachStanza.optional(),
  authorIds: songFields.authorIds.optional(),
  tagIds: songFields.tagIds.optional(),
  languageIds: songFields.languageIds.optional(),
  references: songFields.references.optional(),
});

/** Partial update: absent fields are left untouched (no defaults here). */
export const songUpdateInput = z.object(songFields).partial();

export const hymnalInput = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  aliases: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const setlistInput = z.object({
  title: z.string().trim().min(1).max(160),
  date: z.iso.date().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  shared: z.boolean().optional(),
  items: z
    .array(
      z.object({
        songId: z.string().nullable().optional(),
        label: z.string().trim().max(80).nullable().optional(),
        stanzas: z.array(z.number().int().min(0).max(99)).max(30).default([]),
        note: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .max(60)
    .optional(),
});

export const importInput = z.object({
  hymns: z
    .array(
      z.object({
        index: z.number().int().min(1).max(99999),
        title: z.string().trim().min(1).max(200),
        page: z.number().int().min(1).max(9999).nullable().optional(),
        lyricsText: z.string().max(50_000),
        references: z.array(songReferenceInput).max(20).default([]),
      }),
    )
    .min(1)
    .max(500),
  onExisting: z.enum(["skip", "overwrite"]).default("skip"),
  status: z.enum(["DRAFT", "FINISHED"]).default("DRAFT"),
  languageCode: z.string().default("duala"),
});

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Parse and validate a JSON body; `error` is a readable message for a 400 response. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<ParseResult<z.infer<T>>> {
  const json = await request.json().catch(() => undefined);
  const result = schema.safeParse(json);
  if (!result.success) return { ok: false, error: z.prettifyError(result.error) };
  return { ok: true, data: result.data };
}

// ─── Music (tunes, scores) ──────────────────────────────────────────────────

const optText = (max: number) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export const tuneInput = z.object({
  name: z.string().trim().min(1).max(200),
  key: optText(40),
  timeSignature: optText(20),
  metre: optText(60),
  composer: optText(200),
  source: optText(500),
  license: optText(120),
  notes: optText(2000),
  songIds: z.array(z.string()).max(50).optional(),
});

export const tunePatch = tuneInput.partial().extend({
  linkSongIds: z.array(z.string()).max(50).optional(),
  unlinkSongIds: z.array(z.string()).max(50).optional(),
  linkSongIndexes: z.array(z.number().int().positive()).max(50).optional(),
});

export const scoreKinds = ["SATB", "MELODY", "PIANO", "OTHER"] as const;

export const scoreReview = z.object({
  action: z.enum(["publish", "reject", "unpublish", "default", "retry", "edit", "render", "sing"]),
  note: z.string().trim().max(1000).optional(),
  instrument: z.enum(["organ", "piano", "choir"]).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  kind: z.enum(scoreKinds).optional(),
  source: optText(500),
  license: optText(120),
});

export const tuneProposalInput = z.object({
  name: z.string().trim().min(1).max(200),
  songIds: z.array(z.string()).min(1).max(50),
  existingTuneId: z.string().optional(),
});

export const recordingStart = z.object({
  fileName: z.string().trim().min(1).max(200),
  size: z.number().int().positive(),
  contentType: z.string().max(100).optional(),
  songId: z.string().max(60).nullish(),
  songIndex: z.number().int().positive().nullish(),
  title: z.string().trim().max(200).optional(),
  performer: z.string().trim().max(200).optional(),
});

export const recordingComplete = z.object({ chunks: z.number().int().positive() });

const alignedLine = z.object({
  line: z.number().int().min(0).max(2000),
  text: z.string().max(500),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
});

export const recordingAdmin = z.object({
  action: z.enum(["edit", "publish", "reject", "unpublish", "reanalyze", "melodyToScore"]),
  note: z.string().trim().max(1000).optional(),
  songId: z.string().max(60).nullish(),
  songIndex: z.number().int().positive().nullish(),
  title: z.string().trim().max(200).nullish(),
  performer: z.string().trim().max(200).nullish(),
  notes: z.string().trim().max(5000).nullish(),
  correctedText: z.string().max(20000).nullish(),
  alignment: z.array(alignedLine).max(2000).optional(),
});

export const glossaryInput = z.object({
  term: z.string().trim().min(1).max(120),
  note: z.string().trim().max(300).nullish(),
});
