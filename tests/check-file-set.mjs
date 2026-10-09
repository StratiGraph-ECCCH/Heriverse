// MICRO-HERIVERSE-INSIEMI (9 ott 2026) · una versione di più file dal nodo.
// Un insieme di tre membri — la porta `.gltf`, il suo `.bin`, una texture in
// una sottocartella col nome che ha uno spazio — in un em.json com'è nel nodo
// (`file_set`, `digest_covers: members`, `has_file`), e un nodo finto che
// tiene un file per impronta. Il codice è quello vero: il blocco della scelta
// di `src/Heriverse.js` (sourceOfResource, fetchVerified, membersOfResource)
// e `src/HeriverseFileSet.js`.
//
//   node tests/check-file-set.mjs
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import MultidimensionalGraph from "../src/Multigraph/MultidimensionalGraph.js";
import { emJsonToMultigraph } from "../src/HeriverseGraph/emjson.js";
import { fetchFileSet, fileSetURLModifier, fileSetBase, normalizePath, doorOfSet, gltfJson,
         externalUris, mimeOf } from "../src/HeriverseFileSet.js";

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
const sha = (b) => createHash("sha256").update(b).digest("hex");

// ── l'insieme: tre file ───────────────────────────────────────────────────
const bin = Buffer.from("tre vertici finti, ma byte veri");
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 0xff, 0xd9]);
const gltf = Buffer.from(JSON.stringify({
  asset: { version: "2.0" },
  buffers: [{ uri: "muro.bin", byteLength: bin.length }],
  images: [{ uri: "textures/tex%20a.jpg" }, { uri: "data:image/png;base64,AAAA" }],
}));
const DIR = "versions/muro@lod0-heriverse/";
const membri = [
  { id: "f1", url: `${DIR}muro.gltf`, b: gltf, media_type: "model/gltf+json" },
  { id: "f2", url: `${DIR}muro.bin`, b: bin },
  { id: "f3", url: `${DIR}textures/tex a.jpg`, b: jpg },
];
const digestMembri = "d".repeat(64);  // il digest dei membri: non è un file
const doc = {
  header: { format: "em.json", version: "1.0" },
  graphs: { g1: { graph_id: "g1", name: "Templu", nodes: [
    { id: "rm1", node_type: "representation_model", name: "Muro", data: {} },
    { id: "v1", node_type: "resource", name: "Muro lod0",
      data: { url_type: "3d_model", url: `${DIR}muro.gltf`, media_type: "model/gltf+json",
              packaging: "file_set", digest_covers: "members", checksum: `sha256:${digestMembri}` } },
    ...membri.map((m) => ({ id: m.id, node_type: "resource_file", name: m.url.split("/").pop(),
      data: { url: m.url, checksum: `sha256:${sha(m.b)}`, size_bytes: m.b.length,
              ...(m.media_type ? { media_type: m.media_type } : {}) } })),
  ], edges: membri.map((m) => ({ id: `h${m.id}`, edge_type: "has_file", source: "v1", target: m.id })) } },
  active_graph_id: "g1",
};
const mg = emJsonToMultigraph(doc, ["US"]);
const g = new MultidimensionalGraph("x", {});
for (const [grp, nodes] of Object.entries(mg.graphs.g1.nodes))
  for (const [id, nd] of Object.entries(grp === "stratigraphic" ? Object.assign({}, ...Object.values(nodes)) : nodes))
    g.addNode(id, nd.type, nd.name, nd.description, nd.data);
for (const [type, list] of Object.entries(mg.graphs.g1.edges))
  for (const e of list) g.addEdge(e.id, type, g.getNode(e.from), g.getNode(e.to));

const versione = g.getNode("v1");
ok(Heriverse.isFileSet(versione.data), "una versione file_set con digest dei membri è un insieme");
ok(!Heriverse.isFileSet({ url: "x.glb", checksum: "sha256:" + "a".repeat(64) }), "un glb da solo no");
const lista = Heriverse.membersOfResource(versione);
eq(lista.map((m) => m.url), membri.map((m) => m.url), "i suoi tre file, letti dagli archi has_file");
eq(doorOfSet(versione.data, lista).url, `${DIR}muro.gltf`, "la porta è il membro all'url della versione");

// ── il nodo: un file per impronta ─────────────────────────────────────────
const studio = { node: "http://127.0.0.1:8000", room: "templu-mare-v2", token: "T" };
let tenuti = new Map(membri.map((m) => [sha(m.b), m.b]));
const chiesti = [];
const nodoFinto = async (url, opts) => {
  chiesti.push({ url, auth: opts?.headers?.Authorization });
  const hex = /asset\/sha256:([0-9a-f]{64})$/.exec(url)?.[1];
  const b = hex && tenuti.get(hex);
  return b ? { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
           : { ok: false, status: 404 };
};
Heriverse.nodeStudy = studio;
const fetchMember = (m, what) => {
  const src = Heriverse.sourceOfResource(m);
  return src.kind === "node" ? Heriverse.fetchVerified(src, what, nodoFinto) : Promise.resolve({ ok: false });
};

// oggi: il digest dei membri chiesto al nodo, 404
{
  const src = Heriverse.sourceOfResource(versione.data);
  ok(src.url.endsWith(`sha256:${digestMembri}`), "la versione intera si chiederebbe per il digest dei membri…");
  const got = await Heriverse.fetchVerified(src, "Muro", nodoFinto);
  eq(got.status, 404, "…e il nodo non ce l'ha: è il 404 misurato il 9 ottobre");
}

chiesti.length = 0; righe.length = 0;
const set = await fetchFileSet({ data: versione.data, members: lista, label: "Muro", fetchMember });
ok(set.ok, `l'insieme dal nodo si apre (${set.line})`);
eq(chiesti.map((c) => c.url.split("sha256:")[1]), [sha(gltf), sha(bin), sha(jpg)],
   "prima la porta per la SUA impronta, poi i due file che nomina, per le loro");
ok(chiesti.every((c) => c.auth === "Bearer T" && !c.url.includes("T@") && !/token/i.test(c.url)),
   "il token nell'intestazione, mai nell'url");
eq(righe.filter((r) => r.includes("= the registered one")).length, 3, "tre file, tre sha256 confrontate");
eq([...set.files.keys()], ["muro.bin", "textures/tex%20a.jpg"],
   "gli uri come la porta li scrive (il data: non è un file)");
eq([...set.files.values()].map((f) => f.path), ["muro.bin", "textures/tex a.jpg"], "…e il membro che li risolve");
ok(Buffer.from(set.files.get("muro.bin").buffer).equals(bin), "i byte del .bin sono quelli del membro");
eq(mimeOf(set.files.get("textures/tex%20a.jpg").member), "image/jpeg", "la texture si dà al loader come jpeg");

// ── l'URL modifier del loader ─────────────────────────────────────────────
{
  const base = fileSetBase();
  ok(base !== fileSetBase(), "una base per insieme: due insiemi non si confondono");
  const mod = fileSetURLModifier(base, set.files, (uri) => `blob:x/${uri}`);
  eq(mod(`${base}muro.bin`), "blob:x/muro.bin", "il .bin → i suoi byte misurati");
  eq(mod(`${base}textures/tex%20a.jpg`), "blob:x/textures/tex%20a.jpg", "la texture → i suoi byte");
  eq(mod(`${base}./textures/tex a.jpg`), "blob:x/textures/tex%20a.jpg", "…anche scritta in un altro modo");
  eq(mod("https://altrove/x.png"), "https://altrove/x.png", "fuori dalla base non è affar suo");
  eq(mod(`${base}altro.bin`), "blob:heriverse-set-missing", "un file che l'insieme non ha: non va in rete");
}

// ── un membro che non torna: niente si carica, e si dice quale ────────────
{
  tenuti.set(sha(jpg), Buffer.from("un'altra texture"));
  righe.length = 0;
  const r = await fetchFileSet({ data: versione.data, members: lista, label: "Muro", fetchMember });
  ok(!r.ok, "la texture del nodo non è quella registrata: la versione non si carica");
  ok(r.line.includes("textures/tex a.jpg") && /not the registered/.test(r.line), `…la riga dice quale file (${r.line})`);
  ok(righe.some((x) => /NOT the registered version/.test(x)), "…e fetchVerified dice le due impronte");
  tenuti.delete(sha(jpg));
  const r2 = await fetchFileSet({ data: versione.data, members: lista, label: "Muro", fetchMember });
  ok(!r2.ok && r2.line.includes("textures/tex a.jpg") && r2.line.includes("404"),
     `un membro che il nodo non ha: 404, e quale (${r2.line})`);
  tenuti.set(sha(jpg), jpg);
}
{
  const senza = lista.filter((m) => !m.url.endsWith(".bin"));
  const r = await fetchFileSet({ data: versione.data, members: senza, label: "Muro", fetchMember });
  ok(!r.ok && r.line.includes("muro.bin: named by muro.gltf, not a file of the set"),
     `la porta nomina un file che l'insieme non ha: lo si dice (${r.line})`);
  const r2 = await fetchFileSet({ data: versione.data, members: lista.map((m) => m.url.endsWith(".bin")
    ? { ...m, checksum: "" } : m), label: "Muro", fetchMember });
  ok(!r2.ok && r2.line.includes("muro.bin: no sha256"), "un membro senza sha256 non si chiede alla cieca");
  const r3 = await fetchFileSet({ data: { ...versione.data, url: "altrove.gltf" }, members: [lista[1]], label: "Muro", fetchMember });
  ok(!r3.ok && /no door/.test(r3.line), "nessuna porta: lo si dice");
}

// ── una porta .glb senza file esterni ─────────────────────────────────────
{
  const json = Buffer.from(JSON.stringify({ asset: { version: "2.0" }, buffers: [{ byteLength: 0 }] }) + "  ");
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + json.length, 8);
  head.writeUInt32LE(json.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
  const glb = Buffer.concat([head, json]);
  eq(externalUris(gltfJson(glb)), [], "un .glb si legge dal suo chunk JSON: nessun file esterno");
  tenuti.set(sha(glb), glb);
  const r = await fetchFileSet({ data: { url: "v/m.glb", digest_covers: "members" },
    members: [{ url: "v/m.glb", checksum: `sha256:${sha(glb)}` }], label: "M", fetchMember });
  ok(r.ok && r.files.size === 0, "…e l'insieme di un file solo si apre dalla porta");
}

// ── dalla cartella non cambia niente ──────────────────────────────────────
Heriverse.nodeStudy = null;
eq(Heriverse.sourceOfResource(versione.data, null), { kind: "path", url: `${DIR}muro.gltf` },
   "dalla cartella: l'url della porta, relativo, e gli uri della porta restano relativi");

eq([normalizePath("a/./b/../c%20d.jpg"), normalizePath("../x")], ["a/c d.jpg", null],
   "i percorsi si normalizzano, e non si esce sopra la radice");

console.log(`heriverse file set: ${n} controlli passati`);
