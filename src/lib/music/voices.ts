/**
 * Split the notes of a rendered score into singable voices (soprano, alto, tenor, bass...).
 * Works from what Verovio tells us about each note: its staff, its layer and its pitch.
 * - a staff with several layers: one voice per layer;
 * - a staff with one layer but chords (S+A on one stem): the highest note goes to the upper voice,
 *   the lowest to the lower one, a single note (unison) to every voice of that staff.
 */

export type RawNote = { id: string; staff: number; layer: number; pitch: number; onsetQ: number };
export type VoiceInfo = { key: string; label: "S" | "A" | "T" | "B" | null; index: number };

export function assignVoices(notes: RawNote[]): { voices: VoiceInfo[]; byNote: Map<string, string[]> } {
  const byNote = new Map<string, string[]>();
  const order: string[] = [];
  const add = (key: string) => {
    if (!order.includes(key)) order.push(key);
  };

  const staves = [...new Set(notes.map((n) => n.staff))].sort((a, b) => a - b);
  for (const staff of staves) {
    const inStaff = notes.filter((n) => n.staff === staff);
    const layers = [...new Set(inStaff.map((n) => n.layer))].sort((a, b) => a - b);
    if (layers.length > 1) {
      for (const layer of layers) add(`${staff}:${layer}`);
      for (const n of inStaff) byNote.set(n.id, [`${staff}:${n.layer}`]);
      continue;
    }
    const groups = new Map<number, RawNote[]>();
    for (const n of inStaff) {
      const k = Math.round(n.onsetQ * 1000);
      groups.set(k, [...(groups.get(k) ?? []), n]);
    }
    const width = Math.max(1, ...[...groups.values()].map((g) => g.length));
    const keys = Array.from({ length: Math.min(width, 4) }, (_, i) => `${staff}:r${i}`);
    keys.forEach(add);
    for (const g of groups.values()) {
      const sorted = [...g].sort((a, b) => b.pitch - a.pitch);
      if (sorted.length === 1) {
        byNote.set(sorted[0].id, keys);
        continue;
      }
      sorted.forEach((n, i) => {
        // Top note → first voice, bottom note → last voice, the others in between.
        const slot = i === sorted.length - 1 ? keys.length - 1 : Math.min(i, keys.length - 1);
        byNote.set(n.id, [keys[slot]]);
      });
    }
  }

  const satb = order.length === 4 ? (["S", "A", "T", "B"] as const) : null;
  const voices = order.map((key, index) => ({ key, index, label: satb ? satb[index] : null }));
  return { voices, byNote };
}
