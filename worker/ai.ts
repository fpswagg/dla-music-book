import type { Word } from "@/lib/audio/text-match";

/**
 * AI providers used by the audio analysis. Each one is optional: without its key the step is
 * skipped and the analysis report says which key is missing (feature flags = env keys).
 *   OPENAI_API_KEY      Whisper transcription with word timestamps (preferred)
 *   GEMINI_API_KEY      Gemini transcription (fallback, approximate timestamps)
 *   ANTHROPIC_API_KEY   Claude correction of the transcription (Duala spelling, glossary)
 */
export const flags = {
  whisper: () => !!process.env.OPENAI_API_KEY,
  gemini: () => !!process.env.GEMINI_API_KEY,
  claude: () => !!process.env.ANTHROPIC_API_KEY,
};

export type Transcript = { provider: string; text: string; words: Word[] };

export async function whisperTranscribe(audio: Uint8Array, prompt: string): Promise<Transcript> {
  const form = new FormData();
  form.append("file", new Blob([audio as BlobPart], { type: "audio/mpeg" }), "audio.mp3");
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  if (prompt) form.append("prompt", prompt.slice(0, 800));
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(10 * 60_000),
  });
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { text: string; words?: Array<{ word: string; start: number; end: number }> };
  return {
    provider: "openai:whisper",
    text: data.text.trim(),
    words: (data.words ?? []).map((w) => ({ w: w.word, start: w.start, end: w.end })),
  };
}

export async function geminiTranscribe(audio: Uint8Array, prompt: string): Promise<Transcript> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const instructions =
    "Transcribe this sung hymn (mostly in Duala, a Bantu language of Cameroon) exactly as heard. " +
    'Return JSON: {"text": string, "words": [{"w": string, "start": seconds, "end": seconds}]} with one entry per word in order. ' +
    "Do not translate. Do not add words that are not sung." +
    (prompt ? `\nVocabulary that may occur: ${prompt}` : "");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: "audio/mp3", data: Buffer.from(audio).toString("base64") } }, { text: instructions }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
    signal: AbortSignal.timeout(10 * 60_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const parsed = JSON.parse(raw) as { text?: string; words?: Word[] };
  const words = (parsed.words ?? []).filter((w) => typeof w.w === "string" && Number.isFinite(w.start) && Number.isFinite(w.end));
  return { provider: `gemini:${model}`, text: (parsed.text ?? words.map((w) => w.w).join(" ")).trim(), words };
}

/**
 * Claude fixes the transcription: Duala spelling (ɛ ɔ ŋ ɓ, tones), the glossary, earlier human
 * corrections and, when the hymn is known, its lyrics as the reference. The result is a draft a
 * human validates; it never replaces the hymn's lyrics.
 */
export async function claudeCorrect(input: {
  text: string;
  glossary: Array<{ term: string; note: string | null }>;
  samples: Array<{ rawText: string; correctedText: string }>;
  reference: string | null;
}): Promise<{ text: string; model: string }> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
  const system = [
    "You correct automatic transcriptions of hymns sung in Duala (Cameroon), from the hymnal Myenge ma Bonakristo.",
    "Duala orthography uses the letters ɛ, ɔ, ŋ, ɓ and tone marks (acute, grave, circumflex). Keep them; restore them where the transcription lost them.",
    "Only fix what was misheard or misspelled. Never translate, never add verses that are not in the transcription, never invent Duala words.",
    "When a reference text of the hymn is given, prefer its exact spelling for the words that were sung.",
    "Answer with the corrected text only, one sung line per line, no comments.",
  ].join("\n");
  const parts: string[] = [];
  if (input.glossary.length) parts.push(`Glossary:\n${input.glossary.map((g) => `- ${g.term}${g.note ? ` (${g.note})` : ""}`).join("\n")}`);
  if (input.samples.length)
    parts.push(
      `Earlier corrections made by people (raw → corrected):\n${input.samples
        .map((s) => `RAW: ${s.rawText.slice(0, 600)}\nCORRECTED: ${s.correctedText.slice(0, 600)}`)
        .join("\n---\n")}`,
    );
  if (input.reference) parts.push(`Reference text of the hymn (from the hymnal):\n${input.reference.slice(0, 6000)}`);
  parts.push(`Transcription to correct:\n${input.text.slice(0, 12000)}`);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 4000, temperature: 0, system, messages: [{ role: "user", content: parts.join("\n\n") }] }),
    signal: AbortSignal.timeout(5 * 60_000),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  if (!text) throw new Error("Claude returned no text");
  return { text, model };
}
