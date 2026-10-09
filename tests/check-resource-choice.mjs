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
   ["gltf", "tiles3d", "tiles3tz", "unpackArchive"], "le quattro capacità dichiarate");
// C1 (Templu Mare v2, 6 ott 2026): ATON aperto, il loader c'è
// (`ATON.MRes.loadTileSetFromURL`), misurato su un tileset vero: YES. E il
// `.3tz` lo legge `src/HeriverseTiles3tz.js`, in questo repo: YES.
eq(Heriverse.capabilityState("tiles3d"), "yes", "3D Tiles: sì, misurato in ATON");
eq(Heriverse.capabilityState("tiles3tz"), "yes", "un .3tz: sì, il lettore è qui");
eq(Heriverse.capabilityState("gltf"), "yes",
   "glTF: sì, e si vede da qui — è la riga che carica ogni modello");
eq(Heriverse.capabilityState("unpackArchive"), "no",
   "scompattare: NO, e anche questo è un fatto locale — JSZip qui serve "
   + "all'export, e nessuna riga apre un archivio in ingresso");

// ── T3 · «NON SO» NON È «NO» ──────────────────────────────────────────────
//
// La verità su `tiles3d` non è falso: il caricamento lo fa ATON, che arriva
// dal deploy, e da questo checkout non è verificabile. Dichiarare falso ciò
// che non si è misurato è la stessa bugia piccola che era stata rifiutata sul
// packaging.
// (il caso del «non so» resta, provato su una capacità messa a UNKNOWN: è la
// forma che ha chi non ha ancora aperto ATON)
const salvaT3 = Heriverse.CAPABILITIES.tiles3d;
Heriverse.CAPABILITIES.tiles3d = Heriverse.CAPABILITY.UNKNOWN;
eq(Heriverse.capabilityState("tiles3d"), "unknown",
   "3D Tiles: sconosciuto, non falso");
{
  const tiles = { url_type: "3d_model", url: "tilesets/r/tileset.json",
                  packaging: "directory" };
  const v = Heriverse.canConsumeResource(tiles);
  ok(!v.ok, "…e nella SCELTA si comporta come un no: non si prende sperando");
  eq(v.state, "unknown", "…ma lo stato viaggia col rifiuto");
  ok(/cannot tell/.test(v.why), "…e la frase dice «non ho potuto stabilire»");
  ok(/ATON/.test(v.why), "…nominando ATON, cioè DOVE andare a guardare");
  ok(!/cannot load/.test(v.why),
     "…e NON dice «non so caricarli», che manderebbe a cercare la cosa sbagliata");

  const zip = { url_type: "3d_model", url: "x.zip", tier: "distribution" };
  const z = Heriverse.canConsumeResource(zip);
  ok(/cannot load/.test(z.why) && !/cannot tell/.test(z.why),
     "un NO misurato parla diversamente da un NON SO");
}
Heriverse.CAPABILITIES.tiles3d = salvaT3;
{
  // i booleani di prima continuano a valere: un ramo non aggiornato non deve
  // smettere di funzionare per la forma di un valore
  const salva = Heriverse.CAPABILITIES.tiles3d;
  Heriverse.CAPABILITIES.tiles3d = true;
  eq(Heriverse.capabilityState("tiles3d"), "yes", "true vale ancora YES");
  Heriverse.CAPABILITIES.tiles3d = false;
  eq(Heriverse.capabilityState("tiles3d"), "no", "false vale ancora NO");
  Heriverse.CAPABILITIES.tiles3d = salva;
}

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
ok(Heriverse.canConsumeResource(zip).why.includes("archive"),
   "un archive si salta, e la ragione lo dice invece di fingere");

const zipDetto = { url_type: "3d_model", url: "tilesets/x", packaging: "archive" };
ok(!Heriverse.canConsumeResource(zipDetto).ok,
   "…e conta il `packaging` DICHIARATO, non l'estensione");

const tiles2 = { url_type: "3d_model", url: "tilesets/r/tileset.json",
                 packaging: "directory" };
eq(Heriverse.canConsumeResource(tiles2).ok, true,
   "un tileset.json si apre (3D Tiles in ATON)");
eq(Heriverse.tilesKindOf(tiles2), "directory", "…ed è un tileset in cartella, non un glTF");

const senzaEstensione = { url_type: "3d_model", url: "https://x/asset/abc" };
eq(Heriverse.canConsumeResource(senzaEstensione).ok, true,
   "un endpoint senza estensione NON si rifiuta: si sceglie per capacità, "
   + "non per elenco chiuso di nomi di file");

eq(Heriverse.canConsumeResource({ url_type: "image", url: "a.jpg" }).ok, false,
   "un'immagine non è un modello");

// ── la scelta fra più candidate ───────────────────────────────────────────
//
// Dal 5 ottobre 2026 la scelta è la regola della versione per un uso
// (`chooseVersion`, provata caso per caso in `check-version-for.mjs`): qui si
// guarda solo che i vecchi casi diano ancora una risposta sensata.
const nodo = (risorse) => ({
  getNeighborsByRelation: () => Object.fromEntries(
    risorse.map((d, i) => [`r${i}`, { id: `r${i}`, type: "resource", data: d }])),
});
const scegli = (risorse) => Heriverse.getLinkFromRepresentationModel(nodo(risorse));

eq(scegli([master, gltf]), "models/muro.gltf",
   "col master PRIMO nell'ordine dei vicini, sceglie comunque il glTF — "
   + "è la regressione che B2 aveva creato");
eq(scegli([master]), "",
   "solo un master: NIENTE, invece di tentare di caricare un blend://");
eq(scegli([{ ...gltf, url: "b.glb", checksum: "sha256:aa" },
           { ...gltf, url: "a.glb" }]), "b.glb",
   "due risorse e nessuna versione: il master del primo asset per id, "
   + "non il primo nell'ordine dei vicini");
eq(scegli([{ ...gltf, url: "a.glb" },
           { ...gltf, url: "b.glb", preferred: true }]), "a.glb",
   "`preferred` non si legge più: decide la regola, non un segnale per-viewer");
eq(scegli([masterDetto]), "",
   "un master dichiarato in un formato che non si sa aprire: niente, "
   + "non un .obj tentato sperando");
eq(scegli([{ url_type: "3d_model", url: "https://n/asset/sha256:ab",
             media_type: "model/gltf-binary", tier: "master" }]),
   "https://n/asset/sha256:ab",
   "un master glTF per impronta (niente estensione, il media_type lo dice) "
   + "si carica, come ultima risorsa");

// ── T1 · il tileset adesso ha DUE distribuzioni, e nessuna delle due mente ──
//
// Dallo stesso insieme di master nascono l'albero servito (`directory`) e
// l'archivio che viaggia (`archive`). Heriverse oggi non carica né l'uno né
// l'altro — ma per DUE ragioni diverse, ed è il punto: una manda a cercare un
// loader in ATON, l'altra dice che scompattare qui non si sa fare.
{
  const albero = { url_type: "3d_model", url: "tilesets/r/tileset.json",
                   packaging: "directory", tier: "distribution",
                   checksum: "sha256:aa", checksum_of: "entry-point" };
  const archivio = { url_type: "3d_model", url: "tilesets/r.zip",
                     packaging: "archive", tier: "distribution",
                     checksum: "sha256:bb" };
  // C1: ATON si è scoperto capace, e una riga sola ha cambiato l'esito
  eq(scegli([albero, archivio]), "tilesets/r/tileset.json",
     "YES: prende l'albero servito — e non lo zip");
  const b = Heriverse.canConsumeResource(archivio);
  eq(b.capability, "unpackArchive", "lo zip resta fuori, e dice quale capacità manca");
  // finché ATON era da verificare, nessuna delle due: per DUE ragioni diverse
  const salva = Heriverse.CAPABILITIES.tiles3d;
  Heriverse.CAPABILITIES.tiles3d = Heriverse.CAPABILITY.UNKNOWN;
  eq(scegli([albero, archivio]), "", "UNKNOWN: non ne tenta una sperando");
  const a = Heriverse.canConsumeResource(albero);
  eq([a.capability, b.capability], ["tiles3d", "unpackArchive"],
     "…e ciascuna dice QUALE capacità manca");
  ok(a.why !== b.why, "due ragioni diverse, non una voce sola");
  Heriverse.CAPABILITIES.tiles3d = salva;
}

// ── C1 · il .3tz: un archivio che NON si scompatta ────────────────────────
{
  const tz = { url_type: "3d_model", url: "../RB/cesium/TempluMare.3tz", packaging: "archive",
               media_type: "application/vnd.maxar.archive.3tz+zip", checksum: "sha256:cc" };
  eq(Heriverse.tilesKindOf(tz), "3tz", "un .3tz si riconosce");
  eq(Heriverse.canConsumeResource(tz).ok, true,
     "…e si apre, anche se è un archive: non si scompatta, si legge dalla fine");
  const perImpronta = { url_type: "3d_model", url: "https://n/v1/rooms/r/asset/sha256:" + "c".repeat(64),
                        packaging: "archive", media_type: "application/vnd.maxar.archive.3tz+zip" };
  eq(Heriverse.tilesKindOf(perImpronta), "3tz",
     "…anche per impronta, dove l'url non dice niente: lo dice il media_type");
  eq(Heriverse.tilesKindOf({ url: "x.zip", packaging: "archive" }), "",
     "uno zip qualunque non è un tileset");
}

// ── C1 · da un nodo, la rappresentazione che il nodo sa servire ───────────
{
  // versione cartella ←dtc_derived_from— .3tz (preferred); lo zip master è a
  // pari distanza dall'altra parte, ed è anche lui un archive
  const nodi = {};
  const rel = [];
  const mk = (id, data) => (nodi[id] = { id, type: "resource", name: id, data,
    getNeighborsByRelation: (r, dir) => Object.fromEntries(rel
      .filter((e) => e.r === r && (dir === "to" ? e.s === id : e.t === id))
      .map((e) => { const o = nodi[dir === "to" ? e.t : e.s]; return [o.id, o]; })) });
  mk("zip", { url_type: "3d_model", url: "../RB/cesium/TempluMare.zip", packaging: "archive", tier: "master" });
  mk("dir", { url_type: "3d_model", url: "../RB/cesium/TempluMare/tileset.json", packaging: "directory" });
  mk("tz", { url_type: "3d_model", url: "../RB/cesium/TempluMare.3tz", packaging: "archive",
             media_type: "application/vnd.maxar.archive.3tz+zip", preferred: true });
  mk("foto", { url_type: "dataset", url: "smb://x/y.psx" });
  rel.push({ r: "dtc_derived_from", s: "dir", t: "zip" }, { r: "dtc_derived_from", s: "tz", t: "dir" },
           { r: "dtc_derived_from", s: "zip", t: "foto" });
  eq(Heriverse.servableRepresentation(nodi.dir)?.id, "tz",
     "dalla cartella al suo .3tz — non allo zip, che non è un tileset");
  delete nodi.tz.data.preferred;
  eq(Heriverse.servableRepresentation(nodi.dir)?.id, "tz", "…anche senza preferred: lo zip non è un .3tz");
  rel.splice(1, 1);
  eq(Heriverse.servableRepresentation(nodi.dir), null,
     "senza un .3tz dichiarato, niente: non si inventa un indirizzo");
}

// ── MICRO-HERIVERSE-INSIEMI · una versione di più file ────────────────────
//
// glTF + .bin + texture: `file_set`, checksum = digest dei membri, url = la
// porta. La regola la sceglie come un glTF qualunque, e dalla cartella si
// carica dalla porta; dal nodo il digest dei membri non è un file, e la si
// apre dai membri (`check-file-set.mjs`).
{
  const insieme = { url_type: "3d_model", url: "versions/m@lod0-heriverse/m.gltf",
                    media_type: "model/gltf+json", packaging: "file_set",
                    digest_covers: "members", checksum: "sha256:" + "d".repeat(64) };
  eq(Heriverse.canConsumeResource(insieme).ok, true, "un insieme glTF si apre: la porta è un glTF");
  eq(scegli([insieme]), "versions/m@lod0-heriverse/m.gltf", "…e la regola dà la sua porta");
  ok(Heriverse.isFileSet(insieme), "…ed è un insieme");
  eq(Heriverse.sourceOfResource(insieme, null).kind, "path", "dalla cartella: il percorso, come prima");
  const file = (id, url) => ({ id, type: "resource_file", data: { url } });
  const v = { id: "v", getNeighborsByRelation: (r, dir) => r === "has_file" && dir === "to"
    ? { b: file("b", "x/m.bin"), a: file("a", "x/m.gltf"), z: { id: "z", type: "resource", data: { url: "x" } } } : {} };
  eq(Heriverse.membersOfResource(v).map((m) => m.url), ["x/m.gltf", "x/m.bin"],
     "i membri: i ResourceFile legati da has_file, in ordine di id");
}

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
