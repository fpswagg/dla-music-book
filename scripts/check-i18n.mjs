// Lists translation keys used in src/ that are missing from a locale file.
// Usage: node scripts/check-i18n.mjs   (exit code 1 when something is missing)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["fr", "en", "duala"];
const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(readFileSync(`src/i18n/messages/${l}.json`, "utf8"))]));
const has = (obj, path) => path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj) !== undefined;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "generated") yield* files(p);
    } else if (/\.(tsx?|mts)$/.test(name)) yield p;
  }
}

const used = new Map(); // "ns.key" -> file
const dynamic = new Set();
for (const file of files("src")) {
  const src = readFileSync(file, "utf8");
  const vars = new Map();
  for (const m of src.matchAll(/(\w+)\s*=\s*(?:await\s+)?(?:use|get)Translations\(\s*"([\w.]+)"\s*\)/g)) vars.set(m[1], m[2]);
  for (const m of src.matchAll(/const\s*\[([^\]]+)\]\s*=\s*await\s+Promise\.all\(\[([\s\S]*?)\]\)/g)) {
    const names = m[1].split(",").map((s) => s.trim());
    const items = m[2].split(/,(?![^(]*\))/).map((s) => s.trim());
    names.forEach((n, i) => {
      const ns = /getTranslations\(\s*"([\w.]+)"\s*\)/.exec(items[i] ?? "");
      if (ns && n) vars.set(n, ns[1]);
    });
  }
  for (const [v, ns] of vars) {
    const re = new RegExp(`(?<![\\w.])${v}\\(\\s*(["'\`])([^"'\`]+)\\1`, "g");
    for (const m of src.matchAll(re)) {
      if (m[2].includes("${")) dynamic.add(`${ns}.${m[2]}  (${file})`);
      else used.set(`${ns}.${m[2]}`, file);
    }
  }
}

let missing = 0;
for (const [key, file] of [...used].sort()) {
  const absent = LOCALES.filter((l) => !has(messages[l], key));
  if (absent.length) {
    missing++;
    console.log(`${key}  missing in ${absent.join(",")}  (${file})`);
  }
}
// Keys present in one locale but not the others.
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
for (const l of LOCALES) for (const k of flat(messages[l])) for (const o of LOCALES) if (!has(messages[o], k)) { missing++; console.log(`${k}  in ${l} but missing in ${o}`); }

if (dynamic.size) console.log(`\nDynamic keys to check by hand:\n  ${[...dynamic].join("\n  ")}`);
console.log(`\n${used.size} keys used, ${missing} problem(s).`);
process.exit(missing ? 1 : 0);
