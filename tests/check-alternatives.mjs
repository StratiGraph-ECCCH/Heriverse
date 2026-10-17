// Le alternative di un oggetto 3D — il cappello comune (E.D., 17 ott 2026): i
// casi di s3Dgraphy (`alternative_cases.json`) passano per la copia JS della
// regola (`src/HeriverseAlternatives.js`), con la regola della versione presa dal
// sorgente vero di `src/Heriverse.js` (come `check-version-for`); `RULE` è il
// blocco `alternatives` di em_visual_rules quando il checkout di s3Dgraphy è
// accanto; poi la copia v3.2 di Templu Mare (e la fixture con i contenitori, se
// c'è): quante alternative, e cosa Heriverse accende per insieme.
//
//   node tests/check-alternatives.mjs [em.json …]
import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import * as A from "../src/HeriverseAlternatives.js";

const RADICE = process.env.HERI || new URL("..", import.meta.url).pathname;
const SRC = readFileSync(RADICE + "/src/Heriverse.js", "utf8");
const Heriverse = {};
const HeriverseNode = { RELATIONS: { HAS_LINKED_RESOURCE: "has_linked_resource" }, DIRECTIONS: { TO: "to" } };
const inizio = SRC.indexOf('const HERIVERSE_INTERNAL_SCHEME = "blend://";');
const fine = SRC.indexOf("function getConvexShapePoints");
new Function("Heriverse", "HeriverseNode", "console", SRC.slice(inizio, fine))(Heriverse, HeriverseNode, { log: () => {} });
let n = 0;
const eq = (g, e, w) => { assert.deepEqual(g, e, `${w} — ho ${JSON.stringify(g)}`); n++; };

const S3D = (process.env.S3D || new URL("../../s3Dgraphy", import.meta.url).pathname) + "/src/s3dgraphy/JSON_config/";
const VENDOR = RADICE + "/src/3dgraphy_config_files/alternative_cases.json";
if (existsSync(S3D + "alternative_cases.json")) {
  eq(readFileSync(VENDOR, "utf8"), readFileSync(S3D + "alternative_cases.json", "utf8"), "la copia dei casi è quella di s3Dgraphy");
  const { alternatives } = JSON.parse(readFileSync(S3D + "em_visual_rules.json", "utf8"));
  const { _comment, choice, ...rule } = alternatives;
  eq(A.RULE, rule, "RULE è il blocco alternatives di em_visual_rules");
}
const tabella = JSON.parse(readFileSync(VENDOR, "utf8"));
for (const c of tabella.cases) {
  const res = A.alternativeSets(c.graph);
  const sets = [...A.iterSets(res.sets)].map((s) => ({ hat: s.hat, hat_kind: s.hat_kind, parent: s.parent,
    alternatives: s.alternatives.map((x) => [x.id, x.reason]), reasons: s.reasons, covers: s.covers, coverage: s.coverage }));
  eq(sets, c.expect.sets, `${c.name}: gli insiemi`);
  eq(res.warnings.map((w) => w.code).sort(), c.expect.warnings, `${c.name}: le diagnosi`);
  eq(res.counts, c.expect.counts, `${c.name}: i conti`);
  for (const ch of c.choices) {
    const got = A.chooseAlternative(A.findSet(res, ch.hat), ch.use, Heriverse.chooseVersion, { force: ch.force ?? null });
    const want = { level: got.level, id: got.entry ? got.entry.id : null, use: got.use };
    if (got.members) want.members = Object.fromEntries(Object.entries(got.members).map(([h, m]) => [h, m && m.entry ? m.entry.id : null]));
    eq(want, ch.expect, `${c.name}: ${ch.hat} ${JSON.stringify(ch.use)}${ch.force ? ` (${ch.force})` : ""}`);
  }
}

// ── la copia di Templu Mare e cosa Heriverse accende ─────────────────────
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : ["/tmp/spazio3/templu-mare/EM/alt17_v3.2.em.json", "/tmp/alt17/heriverse/TempluMare_v2_alt.em.json"];
for (const F of files) {
  if (!existsSync(F)) { console.log(`  (manca ${F})`); continue; }
  const d = JSON.parse(readFileSync(F, "utf8"));
  const g = d.graph ?? Object.values(d.graphs).find((x) => Array.isArray(x.nodes) && x.nodes.length > 100);
  const t0 = performance.now();
  const res = A.alternativeSets(g);
  const ms = performance.now() - t0;
  const pick = (es) => es.filter((e) => Heriverse.canConsumeResource(e.data, { anyTier: true }).ok);
  const lit = { container: 0, rm: 0, members: 0, master: 0 };
  const lines = [];
  for (const s of res.sets) {
    const ch = A.chooseAlternative(s, Heriverse.VIEWER_USES, Heriverse.chooseVersion, { pick });
    if (!ch) continue;
    if (ch.level === "container") { lit.container++; lines.push(`  ${s.name}: il tileset del contenitore (${ch.entry.id}, ${ch.use}) — spenti ${s.covers.length} membri`); }
    else if (ch.level === "members") { lit.members++; lines.push(`  ${s.name}: i ${s.members.length} membri, ciascuno la sua versione`); }
    else { lit.rm++; if (ch.reason === "master") lit.master++; }
  }
  console.log(`${F.split("/").pop()}: ${res.counts.sets} insiemi (fidelity ${res.counts.by_reason.fidelity}, lod ${res.counts.by_reason.lod}, `
    + `packaging ${res.counts.by_reason.packaging}), ${res.counts.containers} contenitori, ${res.warnings.length} diagnosi, ${ms.toFixed(0)} ms; `
    + `accesi: ${JSON.stringify(lit)}`);
  for (const l of lines) console.log(l);
}
console.log(`heriverse alternatives: ${n} controlli passati`);
