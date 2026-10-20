/** Keys and transposition for the score player. */

const MAJOR_SPELLING = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const MINOR_SPELLING = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];

/** Pitch class of the tonic (major: do, minor: la). */
export function tonicPc(fifths: number, mode: "major" | "minor"): number {
  const major = (((fifths * 7) % 12) + 12) % 12;
  return mode === "minor" ? (major + 9) % 12 : major;
}

/**
 * Verovio "transpose" option for moving the score by `semitones` (-6..+6): the target tonic with
 * a direction, e.g. "+Bb" or "-E". Empty string = as written.
 */
export function transposeOption(fifths: number, mode: "major" | "minor", semitones: number): string {
  if (!semitones) return "";
  const pc = (((tonicPc(fifths, mode) + semitones) % 12) + 12) % 12;
  const name = (mode === "minor" ? MINOR_SPELLING : MAJOR_SPELLING)[pc];
  return `${semitones > 0 ? "+" : "-"}${name}`;
}

/** Display name of a pitch class with the locale's note names (12 names, from C). */
export function pcName(pc: number, names: string[]): string {
  return names[((pc % 12) + 12) % 12] ?? "";
}
