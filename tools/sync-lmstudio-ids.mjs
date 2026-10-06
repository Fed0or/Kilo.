// Läser modell-id:n från LM Studio och skriver in dem i kilo.jsonc.
// Kör (LM Studio-servern måste vara startad):  node tools/sync-lmstudio-ids.mjs
// Valfritt:  --base http://localhost:1234   --models "C:\Users\rayam\.lmstudio\models"   --dry-run
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const base = opt("--base", "http://localhost:1234").replace(/\/+$/, "").replace(/\/v1$/, "");
const modelsDir = opt("--models", join(homedir(), ".lmstudio", "models"));
const dryRun = args.includes("--dry-run");
const configPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "kilo.jsonc");

// Vilken modell i kilo.jsonc som matchas av vilket mönster i LM Studios id-lista.
const targets = [
  { key: "gpt-oss-120b", pattern: /gpt-oss-120b/i },
  { key: "qwen2.5-vl-32b", pattern: /qwen2\.5-vl-32b/i },
];

let ids;
try {
  const res = await fetch(`${base}/v1/models`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  ids = (await res.json()).data.map((m) => m.id);
} catch (err) {
  console.error(`Kunde inte nå LM Studio på ${base}/v1/models (${err.message}).`);
  console.error("Starta Local Server i LM Studio och försök igen.");
  process.exit(1);
}
console.log("Modeller som LM Studio visar:\n  " + (ids.join("\n  ") || "(inga)"));

let config = readFileSync(configPath, "utf8");
let changed = false;
let missing = false;

for (const { key, pattern } of targets) {
  const found = ids.find((id) => pattern.test(id));
  // Hitta raden  "id": "...",  inom just den här modellens block.
  const block = new RegExp(`("${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:\\s*\\{[^}]*?"id"\\s*:\\s*")([^"]*)(")`);
  const m = config.match(block);
  if (!m) {
    console.error(`Hittade inte modellblocket "${key}" i kilo.jsonc.`);
    missing = true;
    continue;
  }
  if (!found) {
    console.warn(`Varning: ingen modell i LM Studio matchar ${pattern}. Behåller "${m[2]}".`);
    missing = true;
    continue;
  }
  if (m[2] === found) {
    console.log(`OK: ${key} -> ${found} (oförändrat)`);
    continue;
  }
  config = config.replace(block, `$1${found}$3`);
  changed = true;
  console.log(`Uppdaterar ${key}: "${m[2]}" -> "${found}"`);
}

if (changed && !dryRun) {
  writeFileSync(configPath, config);
  console.log("kilo.jsonc sparad.");
} else if (changed) {
  console.log("--dry-run: ingenting sparat.");
}

// Qwen2.5-VL ser bara bilder om en mmproj-fil ligger bredvid modellfilen.
function findFiles(dir, test, depth = 4) {
  if (depth < 0 || !existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return findFiles(p, test, depth - 1);
    return test(name) ? [p] : [];
  });
}
const qwenDirs = [...new Set(findFiles(modelsDir, (n) => /qwen2\.5-vl-32b.*\.gguf$/i.test(n) && !/mmproj/i.test(n)).map(dirname))];
if (qwenDirs.length === 0) {
  console.log(`Info: hittade ingen Qwen2.5-VL-32B-fil under ${modelsDir}.`);
} else {
  for (const dir of qwenDirs) {
    const hasMmproj = findFiles(dir, (n) => /mmproj/i.test(n), 0).length > 0;
    console.log(hasMmproj ? `OK: mmproj finns i ${dir}` : `Varning: ingen mmproj-fil i ${dir} - Qwen kan då inte läsa bilder.`);
  }
}

process.exit(missing ? 2 : 0);
