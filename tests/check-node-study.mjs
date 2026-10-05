// Lo studio dal nodo (E.D., 5 ott 2026): Heriverse legge l'em.json com'è nel
// nodo, e i byte della versione scelta li prende dall'indirizzo per impronta,
// misurandoli. Il codice è quello vero di `src/Heriverse.js` e di
// `src/HeriverseGraph/emjson.js`.
//
//   node tests/check-node-study.mjs
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import MultidimensionalGraph from "../src/Multigraph/MultidimensionalGraph.js";
import { isEmJson, emJsonToMultigraph } from "../src/HeriverseGraph/emjson.js";

const RADICE = process.env.HERI || new URL("..", import.meta.url).pathname;
const SRC = readFileSync(RADICE + "/src/Heriverse.js", "utf8");
const Heriverse = {};
const HeriverseNode = { RELATIONS: { HAS_LINKED_RESOURCE: "has_linked_resource" },
                        DIRECTIONS: { TO: "to" } };
const inizio = SRC.indexOf('const HERIVERSE_INTERNAL_SCHEME = "blend://";');
const fine = SRC.indexOf("function getConvexShapePoints");
const righe = [];
new Function("Heriverse", "HeriverseNode", "console", SRC.slice(inizio, fine))(
  Heriverse, HeriverseNode, { log: (r) => righe.push(r) });

let n = 0;
const eq = (g, e, w) => { assert.deepEqual(g, e, `${w} — ho ${JSON.stringify(g)}`); n++; };
const ok = (c, w) => { assert.ok(c, w); n++; };

// ── l'em.json com'è nel nodo ──────────────────────────────────────────────
const doc = {
  header: { format: "em.json", version: "1.0" },
  graphs: { g1: { graph_id: "g1", name: "Templu", nodes: [
    { id: "us1", node_type: "US", name: "SU001", description: "muro", data: {} },
    { id: "ep1", node_type: "EpochNode", name: "XX sec", data: { start_time: 1801, end_time: 2013 } },
    { id: "rm1", node_type: "representation_model", name: "RM1", data: {} },
    { id: "r1", node_type: "resource", name: "RM1 (glTF)",
      data: { url_type: "3d_model", url: "x", checksum: "sha256:" + "a".repeat(64) } },
  ], edges: [
    { id: "e1", edge_type: "has_linked_resource", source: "rm1", target: "r1" },
    { id: "e2", edge_type: "has_representation_model", source: "ep1", target: "rm1" },
  ] } },
  active_graph_id: "g1",
};
ok(isEmJson(doc), "un em.json si riconosce dall'header");
ok(isEmJson({ graphs: { g: { nodes: [], edges: [] } } }), "…e dalle liste, anche senza header");
ok(!isEmJson({ graphs: { g: { nodes: { US: {} }, edges: {} } } }),
   "il multigrafo raggruppato non è un em.json");
{
  // H4 · il pacchetto su disco caricato: il server gli aggiunge lo shelf nella
  // forma raggruppata, e il documento resta un em.json
  const shelf = { name: { default: "Resource Shelf" }, data: { shelf_type: "global" },
                  nodes: {}, edges: {} };
  const caricato = { graphs: { ...doc.graphs, shelf } };
  ok(isEmJson(caricato), "un em.json con lo shelf raggruppato è ancora un em.json");
  const conv = emJsonToMultigraph(caricato, ["US"]);
  eq(conv.graphs.shelf, shelf, "…e lo shelf passa com'era");
  eq(Object.keys(conv.graphs.g1.nodes.resource), ["r1"], "…mentre il grafo dello studio si converte");
}
const mg = emJsonToMultigraph(doc, ["US"]);
eq(Object.keys(mg.graphs), ["g1"], "la chiave del grafo resta quella dello studio");
eq(mg.graphs.g1.nodes.stratigraphic.US.us1.description, "muro",
   "le unità stratigrafiche nel loro gruppo, col tipo come sottogruppo");
eq(mg.graphs.g1.nodes.resource.r1.type, "resource", "gli altri nodi per tipo");
eq(mg.graphs.g1.edges.has_linked_resource, [{ id: "e1", from: "rm1", to: "r1" }],
   "gli archi per tipo, source/target → from/to");
{
  // il lettore di Heriverse (la stessa forma di `HeriverseGraph.parseJson`)
  const g = new MultidimensionalGraph("x", {});
  for (const [grp, nodes] of Object.entries(mg.graphs.g1.nodes))
    for (const [id, nd] of Object.entries(grp === "stratigraphic"
      ? Object.assign({}, ...Object.values(nodes)) : nodes))
      g.addNode(id, nd.type, nd.name, nd.description, nd.data);
  for (const [type, list] of Object.entries(mg.graphs.g1.edges))
    for (const e of list) g.addEdge(e.id, type, g.getNode(e.from), g.getNode(e.to));
  eq(Object.keys(g.getNode("rm1").getNeighborsByRelation("has_linked_resource", "to")), ["r1"],
     "letto, l'RM trova la sua risorsa");
}

// ── da dove vengono i byte ────────────────────────────────────────────────
const hex = "b".repeat(64);
const studio = { node: "http://127.0.0.1:8000/", room: "templu copia" };
eq(Heriverse.sourceOfResource({ url: "models/x.glb", checksum: "sha256:" + hex }, studio),
   { kind: "node", sha256: hex,
     url: `http://127.0.0.1:8000/v1/rooms/templu%20copia/asset/sha256:${hex}` },
   "studio da una stanza: l'indirizzo per impronta del nodo, non il percorso dell'export");
eq(Heriverse.sourceOfResource({ url: "models/x.glb", checksum: "sha256:" + hex }, null),
   { kind: "path", url: "models/x.glb" },
   "studio aperto da file: il percorso locale, come prima");
eq(Heriverse.sourceOfResource({ url: `https://n/em/v1/rooms/r/asset/sha256:${hex}` }, null),
   { kind: "node", url: `https://n/em/v1/rooms/r/asset/sha256:${hex}`, sha256: hex },
   "un url che È un indirizzo per impronta si riconosce anche senza studio dichiarato");
eq(Heriverse.sourceOfResource({ url: "x.glb" }, studio), { kind: "path", url: "x.glb" },
   "senza impronta registrata non c'è indirizzo per impronta");

// ── i byte si misurano ────────────────────────────────────────────────────
const bytes = Buffer.from("glTF finto ma con un'impronta vera");
const vero = createHash("sha256").update(bytes).digest("hex");
const chiamate = [];
const finto = (body, status = 200) => async (url, opts) => {
  chiamate.push({ url, opts });
  return { ok: status === 200, status,
           arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) };
};
Heriverse.nodeStudy = { ...studio, token: "T" };
righe.length = 0;
let got = await Heriverse.fetchVerified({ kind: "node", url: "u", sha256: vero }, "RM1", finto(bytes));
eq([got.ok, got.received], [true, vero], "sha256 uguale alla registrata: si carica");
eq(chiamate[0].opts, { headers: { Authorization: "Bearer T" } },
   "il token va nell'intestazione, mai nell'url");
ok(/= the registered one/.test(righe[0]), "…e il log lo dice");
righe.length = 0;
got = await Heriverse.fetchVerified({ kind: "node", url: "u", sha256: "c".repeat(64) }, "RM1",
                                    finto(bytes));
ok(!got.ok, "sha256 diversa: non si carica");
ok(/NOT the registered version/.test(righe[0]) && righe[0].includes(vero.slice(0, 12)),
   "…e il log dice quale si aspettava e quale è arrivata");
got = await Heriverse.fetchVerified({ kind: "node", url: "u", sha256: vero }, "RM1",
                                    finto(bytes, 403));
eq([got.ok, got.status], [false, 403], "un rifiuto del nodo è un rifiuto, detto");
Heriverse.nodeStudy = null;

console.log(`heriverse node study: ${n} controlli passati`);
