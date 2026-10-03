import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeForSearch, searchTokens } from "./duala";
import { displayBlocks, getLyricsContent, numberedLines, parseLyrics, serializeLyrics, stanzaNumbers } from "./lyrics";
import { parseReferences } from "./references";
import { parseBookText } from "./book-import";

const HYMNALS = [
  { id: "mb", code: "M.B.", aliases: ["M. B."] },
  { id: "sss", code: "S. S. et S.", aliases: ["SS&S"] },
  { id: "evs", code: "Evang. S." },
];

test("search normalisation folds Duala orthography", () => {
  assert.equal(normalizeForSearch("Bo̱lisa Mun’a mo̱ńo̱"), "bolisa muna mono");
  assert.equal(normalizeForSearch("ŋgɛ́ pɔ́"), "nge po");
  assert.equal(normalizeForSearch("Sesa Sango!"), "sesa sango");
  assert.deepEqual(searchTokens("  Mun'a  MUDONGI "), ["muna", "mudongi"]);
});

test("numbered stanzas, inline numbering without blank lines", () => {
  const c = parseLyrics("1. Sesa Sango na doi lasu.\nna mulema di sese mo̱:\n2. A weki ngengeti ńa mo̱ń\na langi na muso̱ngi mao\n\n3. Mo̱nd'a longi Yerusalem.");
  assert.deepEqual(stanzaNumbers(c), [1, 2, 3]);
  assert.equal(c.blocks[1].lines[1], "a langi na muso̱ngi mao");
  assert.equal(c.refrainAfterEachStanza, false);
});

test("plain paragraphs become stanzas", () => {
  const c = parseLyrics("Nya Loba, Nya Loba\nO mudi na bwam\n\nO ma pula mba na nyo\nNa tombédi wé");
  assert.deepEqual(stanzaNumbers(c), [1, 2]);
});

test("explicit refrain is repeated after each stanza", () => {
  const c = parseLyrics("1. Un\ndeux\n\nR. Refrain un\nrefrain deux\n\n2. Trois\nquatre\n\n3. Cinq");
  assert.equal(c.refrainAfterEachStanza, true);
  const d = displayBlocks(c);
  assert.deepEqual(d.map((b) => `${b.kind}${b.repeat ? "*" : ""}`), ["stanza", "refrain", "stanza", "refrain*", "stanza", "refrain*"]);
  assert.equal(d[3].lines[0].number, null);
  assert.equal(d[4].lines[0].number, 7);
});

test("abbreviated refrain ('Ba longo…') is cut out of stanza 1", () => {
  const text = "1. Ba bo̱ti mbo̱t'a bosangi,\nmbo̱ti i masange.\nBa longo, ba longo,\nba longo na Loba.\n\n2. Ba jai o ekombö a mwaye,\nba pańa o mwenen.\nBa lo̱ngo̱...\n\n3. Nj'e wan babo̱\nmu mpete ma mundi?\nBa longo…";
  const c = parseLyrics(text);
  assert.deepEqual(c.blocks.map((b) => b.kind), ["stanza", "refrain", "stanza", "stanza"]);
  assert.deepEqual(c.blocks[1].lines, ["Ba longo, ba longo,", "ba longo na Loba."]);
  assert.equal(c.blocks[2].lines.length, 2);
  assert.equal(c.refrainAfterEachStanza, true);
});

test("serialize / parse round trip", () => {
  const c = parseLyrics("1. Un\ndeux\n\nR. Refrain\n\n2. Trois");
  const again = parseLyrics(serializeLyrics(c));
  assert.deepEqual(again, c);
  assert.deepEqual(getLyricsContent({ content: c, lyrics: "" }), c);
});

test("programme with selected stanzas keeps the refrain", () => {
  const c = parseLyrics("1. Un\n\nR. Ref\n\n2. Deux\n\n3. Trois");
  assert.deepEqual(displayBlocks(c, { stanzas: [1, 3] }).map((b) => b.kind + (b.number ?? "")), ["stanza1", "refrain", "stanza3", "refrain"]);
  assert.deepEqual(displayBlocks(c, { stanzas: [3] }).map((b) => b.kind + (b.number ?? "")), ["stanza3", "refrain"]);
});

test("numbered lines for annotations", () => {
  const lines = numberedLines(parseLyrics("1. A\nB\n\nR. C"));
  assert.deepEqual(lines.map((l) => `${l.block}${l.number}${l.text}`), ["1.1A", "1.2B", "R.3C"]);
});

test("references from the book", () => {
  assert.deepEqual(parseReferences("M. B. 11. - S. S. et S. 621.", HYMNALS), [
    { code: "M.B.", number: "11", hymnalId: "mb" },
    { code: "S. S. et S.", number: "621", hymnalId: "sss" },
  ]);
  assert.deepEqual(parseReferences("M.B.8. - Evang. S. 189", HYMNALS).map((r) => r.hymnalId), ["mb", "evs"]);
  assert.deepEqual(parseReferences("M. B. 11. - S, S. et S, 621", HYMNALS).map((r) => r.hymnalId), ["mb", "sss"]);
  assert.equal(parseReferences("W. 12", HYMNALS)[0].hymnalId, undefined);
});

test("book page import", () => {
  const page = [
    "2. Di masesa ponda ye̱se̱",
    "Haleluya! Amen.",
    "5",
    "M.B.8. - Evang. S. 189.",
    "1. Edube na Loba!",
    "Mo̱ń na wase, kasa!",
    "2. Dinge̱le̱ bejedi,",
    "basangi ba lati",
    "6",
    "M. B. 11. - S. S. et S. 621.",
    "1. Loba le bwam! mo̱ń na wase.",
    "minja, midongo na mindi,",
    "",
    "10",
    "7",
    "1. Sesa Sango na doi lasu.",
  ].join("\n");
  const hymns = parseBookText(page, HYMNALS);
  assert.deepEqual(hymns.map((h) => h.index), [5, 6, 7]);
  assert.deepEqual(hymns.map((h) => h.page), [10, 10, null]);
  assert.equal(hymns[0].title, "Edube na Loba");
  assert.deepEqual(stanzaNumbers(hymns[0].content), [1, 2]);
  assert.deepEqual(hymns[1].references.map((r) => r.number), ["11", "621"]);
  assert.deepEqual(hymns[0].warnings, []);
});
