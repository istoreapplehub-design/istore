// Build a compact Apple TAC (first 8 IMEI digits) -> model map for free offline IMEI lookup.
// Source dataset: https://github.com/MoazEb/tac-database (GSMA TAC registry dump, tac_full.csv)
// Usage: node build-apple-tacs.mjs /path/to/tac_full.csv
import { readFileSync, writeFileSync } from "node:fs";

const csv = process.argv[2];
if (!csv) {
  console.error("usage: node build-apple-tacs.mjs <tac_full.csv>");
  process.exit(1);
}

const AS_IS = new Set(["SE", "XS", "XR", "II", "III", "4G", "5G", "LTE", "TV"]);
const SPECIAL = { IPHONE: "iPhone", IPAD: "iPad", AIRPODS: "AirPods", WATCH: "Watch", MAX: "Max", PRO: "Pro", PLUS: "Plus", AIR: "Air", LITE: "Lite", MINI: "Mini", ULTRA: "Ultra" };

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => {
      const u = w.toUpperCase();
      if (SPECIAL[u]) return SPECIAL[u];
      if (AS_IS.has(u)) return u;
      if (/^[A-Z]{1,3}\d/.test(w)) return u;
      return w.charAt(0) + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function cleanModel(specs) {
  const parts = specs.split(",").map((p) => p.trim()).filter(Boolean);
  const pick = parts.find((p) => /^Apple\s+(iPhone|iPad|Watch|AirPods)/.test(p));
  if (pick) return pick.replace(/^Apple\s+/i, "");
  const modelSeg = parts.find((p) => !/^APPLE$/i.test(p) && !/^A\d{4,5}$/.test(p) && !/^(19|20)\d{2}$/.test(p));
  if (!modelSeg) return null;
  const stripped = modelSeg.replace(/^APPLE\s*/i, "").trim();
  return stripped ? titleCase(stripped) : null;
}

const map = {};
const lines = readFileSync(csv, "utf8").split(/\r?\n/);
for (const line of lines) {
  const m = line.match(/^APPLE,(\d{8}),"(.*)"$/i);
  if (!m) continue;
  const tac = m[1];
  const parts = m[2].split(",").map((p) => p.trim());
  const model = cleanModel(m[2]);
  if (!model) continue;
  const aNumber = parts.find((p) => /^A\d{4,5}$/.test(p)) || null;
  const year = parts.find((p) => /^(19|20)\d{2}$/.test(p)) || null;
  const stored = map[tac];
  const rich = (e) => (e[2] ? 2 : 0) + (e[1] ? 1 : 0);
  if (!stored || rich([model, aNumber, year]) > rich(stored)) map[tac] = [model, aNumber, year];
}

const out = process.argv[3] || decodeURI(new URL("../../backend/src/data/apple-tacs.json", import.meta.url).pathname);
writeFileSync(out, JSON.stringify(map));
console.log(`tac entries: ${Object.keys(map).length} -> ${out}`);
