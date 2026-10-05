// La versione per un uso (E.D., 5 ott 2026): la STESSA tabella di casi di
// s3Dgraphy (`version_for_cases.json`) passa qui, sulla copia JS della regola
// presa dal sorgente vero di `src/Heriverse.js` (come `check-resource-choice`).
//
//   node tests/check-version-for.mjs
//   VERSION_FOR_CASES=…/s3Dgraphy/src/s3dgraphy/JSON_config/version_for_cases.json node …
//
// Senza variabile si usa la copia in `src/3dgraphy_config_files/`; se il
// checkout di s3Dgraphy è accanto, si controlla anche che la copia sia uguale.
import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import MultidimensionalGraph from "../src/Multigraph/MultidimensionalGraph.js";

const RADICE = process.env.HERI || new URL("..", import.meta.url).pathname;
const SRC = readFileSync(RADICE + "/src/Heriverse.js", "utf8");
const Heriverse = {};
const HeriverseNode = { RELATIONS: { HAS_LINKED_RESOURCE: "has_linked_resource" },
                        DIRECTIONS: { TO: "to" } };
const inizio = SRC.indexOf('const HERIVERSE_INTERNAL_SCHEME = "blend://";');
const fine = SRC.indexOf("function getConvexShapePoints");
assert.ok(inizio > 0 && fine > inizio, "blocco non trovato nel sorgente");
const righe = [];
new Function("Heriverse", "HeriverseNode", "console", SRC.slice(inizio, fine))(
  Heriverse, HeriverseNode, { log: (r) => righe.push(r) });

let n = 0;
const eq = (g, e, w) => { assert.deepEqual(g, e, `${w} — ho ${JSON.stringify(g)}`); n++; };

// ── la tabella condivisa ──────────────────────────────────────────────────
const VENDOR = RADICE + "/src/3dgraphy_config_files/version_for_cases.json";
const FONTE = process.env.VERSION_FOR_CASES || VENDOR;
const tabella = JSON.parse(readFileSync(FONTE, "utf8"));
const S3D = (process.env.S3D || new URL("../../s3Dgraphy", import.meta.url).pathname)
  + "/src/s3dgraphy/JSON_config/version_for_cases.json";
if (existsSync(S3D))
  eq(readFileSync(VENDOR, "utf8"), readFileSync(S3D, "utf8"),
     "la copia in Heriverse è quella di s3Dgraphy");

for (const c of tabella.cases) {
  const got = Heriverse.chooseVersion(c.entries, c.use, c.prefer_level ?? null);
  if (c.expect === null) { eq(got, null, c.name); continue; }
  eq({ id: got.entry ? got.entry.id : null, reason: got.reason, use: got.use,
       note: Boolean(got.note) }, c.expect, c.name);
}

// ── la regola sul grafo: le versioni lette dalla catena DTC ───────────────
//
// Un RM col master e tre versioni (analysis lod0 → web lod1 → web+preview
// lod2), un RM col solo master, un RM col master `blend://` e una versione
// realtime, e una revisione della lod1 che ne prende il posto.
const g = new MultidimensionalGraph("x", {});
const res = (id, data) => g.addNode(id, "resource", id, "", { url_type: "3d_model", ...data });
const sum = (c) => "sha256:" + c.repeat(64);
res("podio", { url: "https://n/asset/" + sum("0"), media_type: "model/gltf-binary",
               tier: "master", checksum: sum("0") });
res("v0", { url: "podio_lod0.glb", use: ["analysis"], checksum: sum("1") });
res("v1", { url: "podio_lod1.glb", use: ["web"], checksum: sum("2"), lod_level: "lod1" });
res("v1b", { url: "podio_lod1b.glb", use: ["web"], checksum: sum("5") });
res("v2", { url: "podio_lod2.glb", use: ["web", "preview"], checksum: sum("3"), size_bytes: 10 });
res("muro", { url: "https://n/asset/" + sum("4"), media_type: "model/gltf-binary",
              checksum: sum("4") });
res("arco", { url: "blend://studio.blend#Object/arco", tier: "master" });
res("arco_rt", { url: "arco_rt.glb", use: ["realtime"], checksum: sum("6") });
const passo = (id, input, output, level) => {
  g.addNode(id, "dtc_process", id, "", { dtc_kind: "lod_generation", parameters: { level } });
  g.addEdgeByIds(`${id}_in`, "dtc_had_input", id, input);
  g.addEdgeByIds(`${id}_out`, "dtc_had_output", id, output);
};
passo("p0", "podio", "v0", "LOD0");
passo("p1", "v0", "v1", "LOD1");
passo("p2", "v1", "v2", "LOD2");
passo("p3", "arco", "arco_rt", "LOD0");
// H4 · il pacchetto su disco: una versione fatta per Heriverse, percorso
// relativo all'em.json, accanto a una web più leggera
res("tempio", { url: "blend://studio.blend#Object/tempio", tier: "master" });
res("tempio_web", { url: "tempio_lod1.glb", use: ["web"], checksum: sum("7") });
res("tempio_heri", { url: "versions/tempio.glb", use: ["aton", "heriverse"], checksum: sum("8") });
passo("p4", "tempio", "tempio_heri", "heriverse");
passo("p5", "tempio_heri", "tempio_web", "LOD1");
g.addEdgeByIds("rev", "was_revision_of", "v1b", "v1");
for (const [rm, r] of [["rm_podio", "podio"], ["rm_muro", "muro"], ["rm_arco", "arco"],
                       ["rm_tempio", "tempio"]]) {
  g.addNode(rm, "representation_model", rm, "", {});
  g.addEdgeByIds(`${rm}_r`, "has_linked_resource", rm, r);
}

const versioni = Heriverse.versionsOf(g.getNode("podio"));
eq(versioni.map((e) => [e.id, e.lod_level]),
   [["podio", null], ["v0", "lod0"], ["v1b", "lod1"], ["v2", "lod2"]],
   "master e versioni, ciascuna alla revisione corrente, livelli dalla catena");
eq(Heriverse.assetOf(g.getNode("v2")).id, "podio", "da una versione si risale al master");

righe.length = 0;
let scelta = Heriverse.chooseResourceForRepresentationModel(g.getNode("rm_podio"));
eq([scelta.choice.entry.id, scelta.choice.reason, scelta.choice.use], ["v2", "use", "web"],
   "RM col master e versioni web: la web più leggera");
eq(righe, ["[Heriverse] RM rm_podio → web version LOD2, sha256 333333333333…"],
   "…e la riga nel log dice cosa e con che impronta");

Heriverse.preferredLodLevel = "lod1";
scelta = Heriverse.chooseResourceForRepresentationModel(g.getNode("rm_podio"));
eq([scelta.choice.entry.id, scelta.choice.reason], ["v1b", "level"],
   "col livello preferito, quello (alla sua revisione corrente)");
Heriverse.preferredLodLevel = null;

righe.length = 0;
scelta = Heriverse.chooseResourceForRepresentationModel(g.getNode("rm_muro"));
eq([scelta.choice.entry.id, scelta.choice.reason], ["muro", "master"],
   "RM col solo master: il master");
eq(righe, ["[Heriverse] RM rm_muro: no version for heriverse, aton, web or realtime, loading the master "
           + "(sha256 444444444444…)"], "…e lo dice");

righe.length = 0;
scelta = Heriverse.chooseResourceForRepresentationModel(g.getNode("rm_arco"));
eq([scelta.choice.entry.id, scelta.choice.use], ["arco_rt", "realtime"],
   "niente web: la realtime; il master blend:// non entra nemmeno fra le voci");
eq(Heriverse.getLinkFromRepresentationModel(g.getNode("rm_arco")), "arco_rt.glb",
   "getLinkFromRepresentationModel dà l'url della scelta");

righe.length = 0;
scelta = Heriverse.chooseResourceForRepresentationModel(g.getNode("rm_tempio"));
eq([scelta.choice.entry.id, scelta.choice.use], ["tempio_heri", "heriverse"],
   "la versione fatta per Heriverse viene prima della web, anche se questa è più leggera");
eq(Heriverse.getLinkFromRepresentationModel(g.getNode("rm_tempio")), "versions/tempio.glb",
   "…col suo percorso relativo all'em.json del pacchetto");
eq(righe[0], "[Heriverse] RM rm_tempio → heriverse version LOD0, sha256 888888888888…",
   "…e la riga lo dice");

console.log(`heriverse version_for: ${n} controlli passati (${tabella.cases.length} casi da ${FONTE})`);
