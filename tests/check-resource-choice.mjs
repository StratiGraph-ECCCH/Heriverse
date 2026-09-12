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
ok(Heriverse.canConsumeResource(tiles2).why.includes("3D Tiles"),
   "un tileset.json viene riconosciuto come 3D Tiles e non come glTF");

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
  eq(scegli([albero, archivio]), "",
     "oggi non ne carica nessuna, e non ne tenta una sperando");
  const a = Heriverse.canConsumeResource(albero);
  const b = Heriverse.canConsumeResource(archivio);
  eq([a.capability, b.capability], ["tiles3d", "unpackArchive"],
     "…e ciascuna dice QUALE capacità manca");
  ok(a.why !== b.why, "due ragioni diverse, non una voce sola");
  // …e il giorno che ATON si scopre capace, una riga sola cambia l'esito
  const salva = Heriverse.CAPABILITIES.tiles3d;
  Heriverse.CAPABILITIES.tiles3d = Heriverse.CAPABILITY.YES;
  eq(scegli([albero, archivio]), "tilesets/r/tileset.json",
     "dichiarato YES, prende l'albero servito — e non l'archivio");
  Heriverse.CAPABILITIES.tiles3d = salva;
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
