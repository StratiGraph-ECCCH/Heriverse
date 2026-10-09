/**
 * MICRO-HERIVERSE-INSIEMI (9 ott 2026) — una versione di PIÙ file (un glTF con
 * il suo `.bin` e le sue texture) aperta da un NODO.
 *
 * Nel grafo una versione così è una risorsa `packaging: file_set` con
 * `digest_covers: members`: il suo checksum è il digest dei membri, il suo url
 * è la porta (il `.gltf`), e ogni file è un `ResourceFile` legato da
 * `has_file`, con la sua sha256. Un nodo tiene un file per impronta: il digest
 * dei membri non è un file, e chiederlo dà 404 (misurato il 9 ott). Si fa come
 * per il `.3tz` dei tileset (`HeriverseTiles3tz.js`): la porta si chiede per
 * la SUA impronta, e il loader chiede i file che la porta nomina sotto una base
 * che nessuno serve; l'URL modifier del loader la risolve con i byte dei
 * membri, chiesti al nodo per impronta (`asset/sha256:<hex>`, col token
 * nell'header, mai nell'url) e misurati PRIMA che il loader li veda. Un membro
 * che manca o non torna: la versione non si carica, e la riga dice quale file.
 *
 * Niente three né ATON qui: il modulo è puro, e `check-file-set.mjs` lo prova
 * in node. Da una cartella non passa di qui: gli uri relativi restano relativi.
 */

const sha256Hex = (checksum) => {
    const m = /^(?:sha256:)?([0-9a-f]{64})$/i.exec(String(checksum || ""));
    return m ? m[1].toLowerCase() : null;
};

const clean = (url) => String(url || "").split(/[?#]/)[0];
const dirOf = (url) => { const u = clean(url); const i = u.lastIndexOf("/"); return i < 0 ? "" : u.slice(0, i + 1); };

/** Un percorso relativo normalizzato: `./` tolto, `a/../` risolto, `%20` letto.
 *  → il percorso, o null se esce sopra la radice. */
export function normalizePath(path) {
    let p = clean(path);
    try { p = decodeURIComponent(p); } catch (e) { /* un `%` da solo resta com'è */ }
    const out = [];
    for (const part of p.split("/")) {
        if (part === "" || part === ".") continue;
        if (part === "..") { if (!out.length) return null; out.pop(); continue; }
        out.push(part);
    }
    return out.join("/");
}

/** La porta dell'insieme: il membro col suo url uguale a quello della versione,
 *  altrimenti il solo `.gltf`/`.glb` fra i membri. → il membro, o null. */
export function doorOfSet(data, members) {
    const url = normalizePath(data?.url);
    const same = (members || []).find((m) => normalizePath(m.url) === url);
    if (same) return same;
    const gltf = (members || []).filter((m) => /\.(gltf|glb)$/i.test(clean(m.url)));
    return gltf.length === 1 ? gltf[0] : null;
}

/** I membri per il percorso RELATIVO alla porta (quello che la porta scrive). */
export function membersByPath(door, members) {
    const base = normalizePath(dirOf(door.url));
    const map = new Map();
    for (const m of members || []) {
        if (m === door) continue;
        const full = normalizePath(m.url);
        if (full == null) continue;
        const rel = base && full.startsWith(`${base}/`) ? full.slice(base.length + 1) : full;
        map.set(rel, m);
    }
    return map;
}

const GLB_MAGIC = 0x46546c67; // "glTF"

/** Il JSON di una porta glTF, testo o `.glb` (il primo chunk). */
export function gltfJson(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength >= 20 && dv.getUint32(0, true) === GLB_MAGIC) {
        const len = dv.getUint32(12, true);
        return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + len)));
    }
    return JSON.parse(new TextDecoder().decode(bytes));
}

/** Gli uri ESTERNI che una porta nomina (buffer e immagini), così come sono
 *  scritti: niente `data:`, niente indirizzi assoluti. */
export function externalUris(json) {
    return [...(json.buffers || []), ...(json.images || [])]
        .map((x) => x && x.uri).filter((u) => typeof u === "string" && u
            && !/^(data:|blob:|[a-z][a-z0-9+.-]*:\/\/|\/\/)/i.test(u));
}

const MIME = { bin: "application/octet-stream", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
               webp: "image/webp", ktx2: "image/ktx2" };
export const mimeOf = (member) => member?.media_type
    || MIME[clean(member?.url).split(".").pop().toLowerCase()] || "application/octet-stream";

/**
 * L'insieme dal nodo, misurato. `fetchMember(member, label)` → `{ok, buffer,
 * line}` (Heriverse: `sourceOfResource` + `fetchVerified`, cioè per impronta,
 * col token, sha256 confrontata). Prima la porta, poi i file che nomina.
 * → `{ok, door, doorBuffer, files: Map(uri come scritto → {member, path,
 *     buffer}), line}`; con `ok: false` la riga dice quale file.
 */
export async function fetchFileSet({ data, members, label, fetchMember }) {
    const fail = (why) => ({ ok: false, line: `[Heriverse] RM ${label}: the set is not loaded — ${why}` });
    const door = doorOfSet(data, members);
    if (!door) return fail(`no door among its ${(members || []).length} files (no member at ${data?.url})`);
    const doorPath = normalizePath(door.url).split("/").pop();
    if (!sha256Hex(door.checksum)) return fail(`${doorPath}: no sha256 in the graph`);
    const got = await fetchMember(door, `${label} · ${doorPath}`);
    if (!got.ok) return fail(`${doorPath}: ${got.status ? `the node answered ${got.status}` : "the bytes are not the registered ones"}`);
    let json;
    try { json = gltfJson(got.buffer); } catch (e) { return fail(`${doorPath}: not a glTF (${e.message})`); }
    const byPath = membersByPath(door, members);
    const files = new Map();
    for (const uri of externalUris(json)) {
        const path = normalizePath(uri);
        const member = path != null ? byPath.get(path) : null;
        if (!member) return fail(`${path ?? uri}: named by ${doorPath}, not a file of the set`);
        if (!sha256Hex(member.checksum)) return fail(`${path}: no sha256 in the graph`);
        files.set(uri, { member, path });
    }
    const results = await Promise.all([...files.values()].map((f) => fetchMember(f.member, `${label} · ${f.path}`)));
    let i = 0;
    for (const f of files.values()) {
        const r = results[i++];
        if (!r.ok) return fail(`${f.path}: ${r.status ? `the node answered ${r.status}` : "the bytes are not the registered ones"}`);
        f.buffer = r.buffer;
    }
    return { ok: true, door, doorBuffer: got.buffer, files,
             line: `[Heriverse] RM ${label}: the set from the node, ${files.size + 1} files each by its sha256 `
                   + `(${doorPath} + ${[...files.values()].map((f) => f.path).join(", ") || "nothing else"})` };
}

/** La base sotto cui il loader chiede i file dell'insieme: nessuno la serve,
 *  la risolve l'URL modifier (la forma di `archiveBase` del `.3tz`). */
let seq = 0;
export function fileSetBase() {
    const origin = typeof location !== "undefined" && /^https?:/.test(location.origin) ? location.origin : "https://heriverse.invalid";
    return `${origin}/__set__/${++seq}/`;
}

/** L'URL modifier: sotto `base`, l'uri che la porta scrive → l'url dei suoi
 *  byte già misurati (`urlOf(uri)`, un `blob:` nel browser); fuori dalla base
 *  non è affar suo. Un uri sotto la base che l'insieme non ha → un `blob:`
 *  che non esiste: il loader fallisce lì, senza andare in rete. */
export function fileSetURLModifier(base, files, urlOf) {
    return (url) => {
        if (!String(url).startsWith(base)) return url;
        const rel = String(url).slice(base.length);
        for (const [uri, f] of files) if (uri === rel || f.path === normalizePath(rel)) return urlOf(uri, f);
        return "blob:heriverse-set-missing";
    };
}
