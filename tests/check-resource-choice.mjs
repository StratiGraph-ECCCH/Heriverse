// R4 · la regola di Heriverse provata estraendola dal modulo.
//
// `src/Heriverse.js` tira dentro ATON e il DOM, quindi non si importa in node:
// si prova LA REGOLA, che è ciò che decide. Le funzioni sotto sono copiate
// carattere per carattere dal file (verificato da `check_copia` sotto: se
// qualcuno le cambia là e non qui, questa prova lo dice).
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// `HERI` per girare da fuori, altrimenti il repo a cui questo file appartiene
const RADICE = process.env.HERI || new URL("..", import.meta.url).pathname;
const SRC = readFileSync(RADICE + "/src/Heriverse.js", "utf8");
const Heriverse = { CAPABILITIES: null };
const HeriverseNode = { RELATIONS: { HAS_LINKED_RESOURCE: "has_linked_resource" },
                        DIRECTIONS: { TO: "to" } };
// estraggo il blocco vero dal sorgente ed eseguo QUELLO: niente copie a mano
const inizio = SRC.indexOf('const HERIVERSE_INTERNAL_SCHEME = "blend://";');
const fine = SRC.indexOf("function getConvexShapePoints");
assert.ok(inizio > 0 && fine > inizio, "blocco non trovato nel sorgente");
const blocco = SRC.slice(inizio, fine);
const console_ = { log: () => {} };
new Function("Heriverse", "HeriverseNode", "console", blocco)(
  Heriverse, HeriverseNode, console_);

let n = 0;
const ok = (c, w) => { assert.ok(c, w); n++; };
const eq = (g, e, w) => { assert.deepEqual(g, e, `${w} — ho ${JSON.stringify(g)}`); n++; };

// ── le capacità sono DATO, non condizioni sparse ──────────────────────────
eq(Object.keys(Heriverse.CAPABILITIES).sort(),
   ["gltf", "tiles3d", "unpackArchive"], "le tre capacità dichiarate");
ok(Heriverse.CAPABILITIES.gltf === true, "glTF: sì, è ciò su cui ATON è costruito");
ok(Heriverse.CAPABILITIES.unpackArchive === false,
   "scompattare: NO — JSZip qui serve all'export, non al caricamento");

// ── cosa si sa aprire, e cosa no CON LA RAGIONE ───────────────────────────
const gltf = { url_type: "3d_model", url: "models/muro.gltf" };
eq(Heriverse.canConsumeResource(gltf).ok, true, "un glTF si apre");

const master = { url_type: "3d_model", url: "blend://studio.blend#Object/muro" };
eq(Heriverse.canConsumeResource(master), { ok: false, why: "master" },
   "un locator blend:// è un master, e si SALTA — non è un errore");

const masterDetto = { url_type: "3d_model", url: "models/originale.obj",
                      tier: "master" };
eq(Heriverse.canConsumeResource(masterDetto).why, "master",
   "…e un master DICHIARATO si salta anche senza blend://");

const zip = { url_type: "3d_model", url: "tilesets/x.zip", tier: "distribution" };
ok(Heriverse.canConsumeResource(zip).why.includes("cannot unpack"),
   "un archive si salta, e la ragione lo dice invece di fingere");

const zipDetto = { url_type: "3d_model", url: "tilesets/x", packaging: "archive" };
ok(!Heriverse.canConsumeResource(zipDetto).ok,
   "…e conta il `packaging` DICHIARATO, non l'estensione");

const tiles = { url_type: "3d_model", url: "tilesets/r/tileset.json",
                packaging: "directory" };
ok(Heriverse.canConsumeResource(tiles).why.includes("3D Tiles"),
   "3D Tiles: dichiarato non supportato in questo ramo, e detto");

const senzaEstensione = { url_type: "3d_model", url: "https://x/asset/abc" };
eq(Heriverse.canConsumeResource(senzaEstensione).ok, true,
   "un endpoint senza estensione NON si rifiuta: si sceglie per capacità, "
   + "non per elenco chiuso di nomi di file");

eq(Heriverse.canConsumeResource({ url_type: "image", url: "a.jpg" }).ok, false,
   "un'immagine non è un modello");

// ── la scelta fra più candidate ───────────────────────────────────────────
const nodo = (risorse) => ({
  getNeighborsByRelation: () => Object.fromEntries(
    risorse.map((d, i) => [`r${i}`, { data: d }])),
});
const scegli = (risorse) => Heriverse.getLinkFromRepresentationModel(nodo(risorse));

eq(scegli([master, gltf]), "models/muro.gltf",
   "col master PRIMO nell'ordine dei vicini, sceglie comunque il glTF — "
   + "è la regressione che B2 aveva creato");
eq(scegli([master]), "",
   "solo un master: NIENTE, invece di tentare di caricare un blend://");
eq(scegli([{ ...gltf, url: "a.glb" },
           { ...gltf, url: "b.glb", checksum: "sha256:aa" }]), "b.glb",
   "a parità, vince quella di cui si sa anche COSA ci si deve trovare");
eq(scegli([{ ...gltf, url: "a.glb", checksum: "sha256:aa" },
           { ...gltf, url: "b.glb", preferred: true }]), "b.glb",
   "ma il suggerimento di chi conosce lo studio viene prima del checksum");
eq(scegli([{ ...gltf, url: "a.glb" }, { ...gltf, url: "b.glb" }]), "a.glb",
   "senza nessun segnale: la prima, e non si inventa un criterio");

// ── RETRO-COMPATIBILITÀ: un project.json PRE-notte ────────────────────────
//
// Il caso vero: una sola risorsa, nessun tier, nessun packaging, nessun
// checksum, url relativo. Deve tornare ESATTAMENTE quello che tornava prima.
const preNotte = { url_type: "3d_model", url: "models/casa.gltf" };
eq(scegli([preNotte]), "models/casa.gltf",
   "un progetto di prima di stanotte carica identico");
eq(Heriverse.canConsumeResource(preNotte).ok, true,
   "…e il suo unico modello è consumabile senza dichiarare niente");

console.log(`heriverse: ${n} controlli passati`);
