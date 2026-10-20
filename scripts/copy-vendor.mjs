// Copies browser builds of npm packages into public/vendor (served as static files, cached by the browser).
// Run by `pnpm build` and `pnpm vendor`. public/vendor is generated, not committed.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const out = "public/vendor";
mkdirSync(out, { recursive: true });

// "." resolves to dist/verovio-toolkit-wasm.js (package.json itself is not exported).
const verovioDir = dirname(dirname(require.resolve("verovio")));
const { version } = JSON.parse(readFileSync(join(verovioDir, "package.json"), "utf8"));
// Versioned name so a new Verovio is never served from an old cache.
copyFileSync(join(verovioDir, "dist/verovio-toolkit-wasm.js"), join(out, `verovio-${version}.js`));
console.log(`vendor: verovio ${version}`);
