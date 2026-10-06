// C1 (Templu Mare v2, 6 ott 2026) · il lettore `.3tz` di Heriverse
// (`src/HeriverseTiles3tz.js`, il lettore di EMStudio compilato) letto in node:
//   · l'archivio canonico di 3DSC tra le fixture di s3Dgraphy (repo accanto):
//     tre membri, la porta e una tessera, un percorso scritto male, uno assente;
//   · se c'è, il `.3tz` di Templu Mare v2: 7.302 membri, la porta con la sha256
//     che la versione registra (813eda97…).
//   node tests/check-tiles3tz.mjs
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { Archive3tz, Tiles3tzPlugin, blobSource, archiveBase } from "../src/HeriverseTiles3tz.js";

const RADICE = process.env.HERI || new URL("..", import.meta.url).pathname;
const S3D = process.env.S3D || `${RADICE}/../s3Dgraphy`;
let n = 0;
const eq = (g, e, w) => { assert.deepEqual(g, e, `${w} — ho ${JSON.stringify(g)}`); n++; };
const sha = (b) => createHash("sha256").update(b).digest("hex");

const fix = `${S3D}/tests/fixtures/tiles3tz/small_3dsc.3tz`;
if (existsSync(fix)) {
  const a = await Archive3tz.open(blobSource(new Blob([readFileSync(fix)])));
  eq(a.stats.entries, 3, "l'archivio di 3DSC: tre membri nell'indice");
  const door = JSON.parse(new TextDecoder().decode(await a.readEntry("tileset.json")));
  eq(door.root.content.uri, "Data/c01/e0001.b3dm", "la porta si legge, e nomina la sua tessera");
  const tile = await a.readEntry("\\Data\\c02\\e0002.b3dm");
  eq([tile.length, new TextDecoder().decode(tile.subarray(0, 4))], [204, "b3dm"],
     "una tessera per MD5, anche col percorso scritto male");
  eq(await a.readEntry("Data/c09/nope.b3dm"), null, "un membro che non c'è: null, non un errore");
  // il plugin risponde sotto la sua base, e solo lì
  const base = archiveBase();
  const plugin = new Tiles3tzPlugin(Promise.resolve(a), base);
  eq(plugin.fetchData("https://altrove/tileset.json"), null, "fuori dalla base non è affar suo");
  const r = await plugin.fetchData(`${base}tileset.json`);
  eq(r.status, 200, "sotto la base risponde dall'archivio");
} else console.log(`  (fixture di s3Dgraphy non trovata in ${fix}: saltata)`);

const v2 = `${process.env.HOME}/Library/CloudStorage/OneDrive-CNR/Extended Matrix/EM_CaseStudies/01_EM_Tempio Grande v2/RB/cesium/TempluMare.3tz`;
if (existsSync(v2)) {
  const a = await Archive3tz.open(blobSource(new Blob([readFileSync(v2)])));
  eq(a.stats.entries, 7302, "Templu Mare v2: 7.302 membri");
  eq(sha(await a.readEntry("tileset.json")), "813eda9773c9ebf2826996ad2f711ae2c96f06268203a8057629f79d7d23a76b",
     "…e la porta ha la sha256 che la versione cartella registra");
} else console.log("  (Templu Mare v2 non trovato: saltato)");

console.log(`heriverse tiles3tz: ${n} controlli passati`);
