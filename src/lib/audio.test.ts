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
