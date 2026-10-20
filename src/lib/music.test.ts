import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zipSync, strToU8 } from "fflate";
import { detectUploadKind, extractMxl, keyName, prepareScore, readScoreMeta } from "./music/score-format";
import { centralDo, doFromKeyName, doPitchClass, solfaMeasures, solfaNote, syllable } from "./music/solfa";
import { assignVoices } from "./music/voices";
import { cleanTuneField, sourceLinks, tuneKey } from "./music/tune-sources";

const fixture = readFileSync(new URL("../../scripts/fixtures/old-hundredth.musicxml", import.meta.url), "utf8");

test("detects score formats from content", () => {
  const u8 = (s: string) => new TextEncoder().encode(s);
  assert.equal(detectUploadKind("a.musicxml", u8(fixture)), "musicxml");
  assert.equal(detectUploadKind("a.xml", u8(fixture)), "musicxml");
  assert.equal(detectUploadKind("x.abc", u8("X:1\nT:Test\nM:4/4\nK:G\nGGFE|D2|")), "abc");
  assert.equal(detectUploadKind("x.mid", new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6])), "midi");
  const mxl = zipSync({
    "META-INF/container.xml": strToU8('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>'),
    "score.xml": strToU8(fixture),
  });
  assert.equal(detectUploadKind("a.mxl", mxl), "mxl");
  assert.equal(extractMxl(mxl), fixture);
  const mscz = zipSync({ "score.mscx": strToU8("<museScore/>") });
  assert.equal(detectUploadKind("a.mscz", mscz), "mscz");
  assert.equal(prepareScore("a.mscz", mscz).needsConversion, true);
  assert.equal(detectUploadKind("a.txt", u8("hello")), "unknown");
  assert.throws(() => prepareScore("a.txt", u8("hello")), /UNSUPPORTED_FORMAT/);
});

test("reads score metadata", () => {
  assert.deepEqual(readScoreMeta(fixture, "MUSICXML"), { title: "Old Hundredth (test fixture)", key: "G", timeSignature: "4/4", tempo: 96 });
  assert.deepEqual(readScoreMeta("X:1\nT:Tune\nC:Bourgeois\nM:C\nQ:1/4=90\nK:Dm\n", "ABC"), {
    title: "Tune",
    composer: "Bourgeois",
    timeSignature: "4/4",
    key: "D minor",
    tempo: 90,
  });
  assert.equal(keyName(-3), "Eb");
  assert.equal(keyName(0, "minor"), "A minor");
});

test("tonic sol-fa syllables and octaves", () => {
  assert.equal(doPitchClass(1), 7); // G major: do = G
  assert.equal(doPitchClass(-3), 3); // Eb
  assert.equal(doFromKeyName("A minor"), 0); // lah mode: do = C
  assert.equal(doFromKeyName("Eb"), 3);
  assert.equal(syllable(67, 7), "d");
  assert.equal(syllable(66, 7), "t");
  assert.equal(syllable(68, 0), "se"); // G# in A minor
  const centre = centralDo([67, 69, 71, 72, 74], 7);
  assert.equal(centre, 67);
  assert.equal(solfaNote(62, 7, centre), "s,");
  assert.equal(solfaNote(79, 7, centre), "d'");
});

test("tonic sol-fa measures with beats, halves and holds", () => {
  // G major, 4/4: G half, G quarter, F#+E eighths | D whole
  const notes = [
    { startQ: 0, durQ: 2, pitch: 67 },
    { startQ: 2, durQ: 1, pitch: 67 },
    { startQ: 3, durQ: 0.5, pitch: 66 },
    { startQ: 3.5, durQ: 0.5, pitch: 64 },
    { startQ: 4, durQ: 4, pitch: 62 },
  ];
  const out = solfaMeasures(notes, [{ startQ: 0, lengthQ: 4 }, { startQ: 4, lengthQ: 4 }], 7, 1);
  assert.deepEqual(out, ["d :- :d :t, .l,", "s, :- :- :-"]);
});

test("splits SATB voices from layers and from chords", () => {
  const layered = assignVoices([
    { id: "s", staff: 1, layer: 1, pitch: 67, onsetQ: 0 },
    { id: "a", staff: 1, layer: 2, pitch: 62, onsetQ: 0 },
    { id: "t", staff: 2, layer: 3, pitch: 59, onsetQ: 0 },
    { id: "b", staff: 2, layer: 4, pitch: 43, onsetQ: 0 },
  ]);
  assert.deepEqual(layered.voices.map((v) => v.label), ["S", "A", "T", "B"]);
  assert.deepEqual(layered.byNote.get("t"), ["2:3"]);

  const chords = assignVoices([
    { id: "s1", staff: 1, layer: 1, pitch: 67, onsetQ: 0 },
    { id: "a1", staff: 1, layer: 1, pitch: 62, onsetQ: 0 },
    { id: "u2", staff: 1, layer: 1, pitch: 64, onsetQ: 1 },
    { id: "t1", staff: 2, layer: 1, pitch: 59, onsetQ: 0 },
    { id: "b1", staff: 2, layer: 1, pitch: 43, onsetQ: 0 },
  ]);
  assert.deepEqual(chords.voices.map((v) => v.label), ["S", "A", "T", "B"]);
  assert.deepEqual(chords.byNote.get("s1"), ["1:r0"]);
  assert.deepEqual(chords.byNote.get("a1"), ["1:r1"]);
  assert.deepEqual(chords.byNote.get("u2"), ["1:r0", "1:r1"]); // unison: both voices

  const melody = assignVoices([{ id: "m", staff: 1, layer: 1, pitch: 60, onsetQ: 0 }]);
  assert.deepEqual(melody.voices.map((v) => v.label), [null]);
});

test("cleans the tune field printed in the book", () => {
  assert.deepEqual(cleanTuneField("Nun danket alle Gott. W. 158"), { name: "Nun danket alle Gott", refs: [{ abbr: "W.", number: "158" }], ownMelody: false });
  assert.deepEqual(cleanTuneField("S. S. et S,. 391"), { name: null, refs: [{ abbr: "S. S. et S,.", number: "391" }], ownMelody: false });
  const mixed = cleanTuneField("K.M. 30. O du fröhliche, o du selige... Weihnachtszeit | Chr. Ch. 209:");
  assert.equal(mixed.name, "O du fröhliche, o du selige... Weihnachtszeit");
  assert.deepEqual(mixed.refs.map((r) => r.number), ["30", "209"]);
  assert.equal(cleanTuneField("Wer will ein Streiter Jesu se[...] (coupé en bord de page)").name, "Wer will ein Streiter Jesu se");
  assert.deepEqual(cleanTuneField("Eigene Melodie"), { name: null, refs: [], ownMelody: true });
  assert.equal(cleanTuneField("Dies Ist der Tag W. 102. S.90").name, "Dies Ist der Tag");
  assert.equal(cleanTuneField(null).name, null);
  assert.equal(tuneKey("Großer Gott, wir loben dich"), tuneKey("grosser gott wir loben dich"));
  assert.equal(sourceLinks("Old Hundredth").length, 5);
  assert.equal(sourceLinks("  ").length, 0);
});

import { pcName, tonicPc, transposeOption } from "./music/keys";

test("keys and transposition targets", () => {
  assert.equal(tonicPc(1, "major"), 7); // G
  assert.equal(tonicPc(0, "minor"), 9); // A minor
  assert.equal(transposeOption(1, "major", 3), "+Bb");
  assert.equal(transposeOption(1, "major", -2), "-F");
  assert.equal(transposeOption(1, "major", 0), "");
  assert.equal(transposeOption(1, "minor", 1), "+F"); // E minor → F minor
  assert.equal(pcName(7, ["Do", "Do♯", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si"]), "Sol");
});
