/**
 * Tonic sol-fa (movable do), as used by choirs: d r m f s l t, octave marks ' and ,
 * beats separated by ":", half beats by ".", quarter beats by ",". Held notes "-".
 * Minor keys are written in the lah mode (the tonic is "l").
 */

const DIATONIC: Record<number, string> = { 0: "d", 2: "r", 4: "m", 5: "f", 7: "s", 9: "l", 11: "t" };
const CHROMATIC: Record<number, string> = { 1: "de", 3: "ma", 6: "fe", 8: "se", 10: "ta" };

const PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Pitch class (0–11) of "do" for a key given as fifths and mode. */
export function doPitchClass(fifths: number, mode: "major" | "minor" = "major"): number {
  const majorTonic = (((fifths * 7) % 12) + 12) % 12;
  // Minor (lah mode) shares the "do" of its relative major: same key signature, same do.
  void mode;
  return majorTonic;
}

/** Pitch class of "do" from a key name like "G", "Eb", "F# minor". */
export function doFromKeyName(key: string): number | null {
  const m = /^\s*([A-Ga-g])\s*([#b♯♭]?)(?:\s*(minor|min|m))?\s*$/i.exec(key);
  if (!m) return null;
  let pc = PITCH_CLASS[m[1].toUpperCase()] + (m[2] === "#" || m[2] === "♯" ? 1 : m[2] ? -1 : 0);
  if (m[3]) pc += 3; // relative major
  return ((pc % 12) + 12) % 12;
}

export function syllable(pitch: number, doPc: number): string {
  const deg = (((pitch - doPc) % 12) + 12) % 12;
  return DIATONIC[deg] ?? CHROMATIC[deg];
}

/** The "do" nearest to the voice's median pitch: unmarked notes then sit around the middle of its range. */
export function centralDo(pitches: number[], doPc: number): number {
  if (!pitches.length) return 60 + doPc;
  const sorted = [...pitches].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const below = median - ((((median - doPc) % 12) + 12) % 12);
  return median - below > 6 ? below + 12 : below;
}

/** Syllable with octave marks relative to the voice's central do, e.g. "s," or "d'". */
export function solfaNote(pitch: number, doPc: number, centre: number): string {
  const syl = syllable(pitch, doPc);
  const octave = Math.floor((pitch - centre) / 12);
  return syl + (octave > 0 ? "'".repeat(octave) : octave < 0 ? ",".repeat(-octave) : "");
}

export type SolfaNoteIn = { startQ: number; durQ: number; pitch: number };
export type SolfaMeasureIn = { startQ: number; lengthQ: number };

const EPS = 1e-6;

/**
 * One voice → one string per measure, e.g. "d :- .r |m :f".
 * `beatQ` is the beat length in quarter notes (1 for x/4, 0.5 for x/8, 2 for x/2).
 */
export function solfaMeasures(
  notes: SolfaNoteIn[],
  measures: SolfaMeasureIn[],
  doPc: number,
  beatQ: number,
): string[] {
  const centre = centralDo(notes.map((n) => n.pitch), doPc);
  const sorted = [...notes].sort((a, b) => a.startQ - b.startQ || b.pitch - a.pitch);
  // One note per onset (the highest, if the voice has chords).
  const melody = sorted.filter((n, i) => i === 0 || Math.abs(n.startQ - sorted[i - 1].startQ) > EPS);

  const at = (q: number) => melody.find((n) => n.startQ <= q + EPS && n.startQ + n.durQ > q + EPS);
  const onsetAt = (q: number) => melody.find((n) => Math.abs(n.startQ - q) < EPS);

  return measures.map((m) => {
    const beats = Math.max(1, Math.round(m.lengthQ / beatQ));
    const cells: string[] = [];
    for (let b = 0; b < beats; b++) {
      const q0 = m.startQ + b * beatQ;
      const inBeat = melody.filter((n) => n.startQ > q0 + EPS && n.startQ < q0 + beatQ - EPS);
      const slots = inBeat.length === 0 ? 1 : inBeat.every((n) => Math.abs(((n.startQ - q0) / beatQ) % 0.5) < EPS) ? 2 : 4;
      const parts: string[] = [];
      for (let s = 0; s < slots; s++) {
        const q = q0 + (s * beatQ) / slots;
        const on = onsetAt(q);
        if (on) parts.push(solfaNote(on.pitch, doPc, centre));
        else parts.push(at(q) ? "-" : "");
      }
      // Drop trailing holds inside a subdivided beat: "d .-" is just "d".
      if (slots === 2 && parts[1] === "-" && parts[0] !== "") parts.pop();
      const text =
        parts.length === 1
          ? parts[0]
          : parts.length === 2
            ? `${parts[0]} .${parts[1]}`
            : parts.reduce((acc, p, i) => acc + (i === 0 ? p : i === 2 ? ` .${p}` : `,${p}`), "");
      cells.push(text);
    }
    return cells.join(" :");
  });
}
