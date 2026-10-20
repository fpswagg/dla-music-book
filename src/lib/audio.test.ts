import { test } from "node:test";
import assert from "node:assert/strict";
import { alignLines, rankSongs, wordSimilarity } from "./audio/text-match";

test("word similarity", () => {
  assert.equal(wordSimilarity("loba", "loba"), 1);
  assert.ok(wordSimilarity("masesa", "masesu") > 0.8);
  assert.ok(wordSimilarity("loba", "bato") < 0.5);
});

test("rank songs by what was heard", () => {
  const songs = [
    { id: "a", index: 4, title: "A", searchText: "di masesa ponda yese sango asu na munene" },
    { id: "b", index: 5, title: "B", searchText: "loba lasu e mulema mwam" },
  ];
  const r = rankSongs("di masesa ponda yese sango", songs);
  assert.equal(r[0].songId, "a");
  assert.ok(r[0].score > r[1].score);
  assert.deepEqual(rankSongs("ok", songs), []);
});

test("align lyric lines on transcribed words, skipping unsung lines", () => {
  const lines = ["di masesa ponda yese", "sango asu na munene", "haleluya amen", "angel yese sesa loba"];
  const words = [
    ["di", 1], ["masesa", 1.5], ["ponda", 2], ["yese", 2.5],
    ["sango", 4], ["asu", 4.5], ["na", 5], ["munene", 5.5],
    ["angel", 9], ["yese", 9.5], ["sesa", 10], ["loba", 10.6],
  ].map(([w, t]) => ({ w: w as string, start: t as number, end: (t as number) + 0.4 }));
  const a = alignLines(lines, words);
  assert.deepEqual(a.map((x) => x.line), [0, 1, 3]);
  assert.equal(a[0].startMs, 1000);
  assert.equal(a[1].startMs, 4000);
  assert.equal(a[2].startMs, 9000);
  assert.ok(a[0].endMs <= a[1].startMs);
});

test("MIDI instrument patch keeps events and running status", async () => {
  const { setMidiProgram, midiPrograms } = await import("./audio/midi-program");
  // Header (format 0, 1 track, 480 tpq) + track: program 0, note on C4, running-status note on E4, note offs, end.
  const track = [0x00, 0xc0, 0x00, 0x00, 0x90, 60, 100, 0x00, 64, 100, 0x83, 0x60, 0x80, 60, 0, 0x00, 0x80, 64, 0, 0x00, 0xff, 0x2f, 0x00];
  const midi = Uint8Array.from([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0,
    0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, track.length, ...track,
  ]);
  assert.deepEqual(midiPrograms(midi), [0]);
  const organ = setMidiProgram(midi, "organ");
  assert.deepEqual(midiPrograms(organ), [19]);
  const notes = [...organ].filter((b, i, a) => (b & 0xf0) === 0x90 && a[i + 1] >= 60 && a[i + 1] <= 64).length;
  assert.equal(notes, 2);
});
