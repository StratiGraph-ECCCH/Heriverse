/**
 * LE ALTERNATIVE DI UN OGGETTO 3D — il cappello comune (E.D., 17 ott 2026;
 * s3Dgraphy `resources.alternatives`, em_visual_rules 1.6.37 → `alternatives`).
 * Copia JS della regola, come `chooseVersion`: `tests/check-alternatives.mjs`
 * le fa passare i casi di s3Dgraphy (`alternative_cases.json`, copiato in
 * `src/3dgraphy_config_files/`) e controlla che `RULE` sia il blocco della
 * libreria quando il checkout è accanto.
 *
 * Un INSIEME DI ALTERNATIVE è il gruppo di risorse 3D che rappresentano la
 * stessa cosa, con la stessa copertura, in forme diverse: `lod` (la catena dei
 * livelli), `fidelity` (il master contro le versioni), `packaging` (le mesh a
 * pezzi contro un tileset). Due risorse sono alternative SE E SOLO SE hanno lo
 * stesso CAPPELLO: l'RM, o il contenitore RM (connections 1.6.41), che ne
 * raggiunge l'asset con `has_linked_resource`. Due livelli annidati: l'RM, e il
 * contenitore — un tileset dell'insieme ha per cappello il contenitore, e
 * sceglierlo spegne i membri. Il viewer accende UNA alternativa per insieme.
 *
 * Nessun import: si prova in node senza ATON né THREE; il grafo è quello in
 * liste di un em.json (`{nodes: [{id, node_type, name, data}], edges: [{id,
 * source, target, edge_type}]}`), `graphFromMultigraph` lo ricava dal
 * multigrafo raggruppato che Heriverse tiene.
 */

/** Il blocco `alternatives` di em_visual_rules 1.6.37, come la libreria lo scrive. */
export const RULE = {
	hat_edge: "has_linked_resource",
	hats: { rm: ["representation_model", "representation_model_doc", "representation_model_sf"],
	        container: ["RepresentationModelNodeGroup"] },
	member_edge: "is_in_representation_model_group",
	epoch_edge: "has_representation_model",
	epoch_types: ["EpochNode"],
	file_types: ["3d_model"],
	tileset: { media_types: ["application/vnd.maxar.archive.3tz+zip"], packaging: ["directory"],
	           url_patterns: ["\\.3tz([?#]|$)", "(^|/)tileset\\.json([?#]|$)"] },
	reasons: ["lod", "fidelity", "packaging"],
};
//: due riquadri coprono «la stessa cosa» da questa intersezione sull'unione
export const SAME_COVERAGE_IOU = 0.9;

const LOD_KIND = "lod_generation";
const USES = ["analysis", "realtime", "web", "mobile_ar", "print", "render", "preview", "heriverse", "aton"];
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sortU = (xs) => [...new Set(xs)].sort(cmp);
const dataOf = (n) => (n && n.data && typeof n.data === "object" ? n.data : {});

/** Il multigrafo raggruppato di Heriverse (`emJsonToMultigraph`) → le liste. */
export function graphFromMultigraph(g) {
	const nodes = [];
	const walk = (group) => {
		for (const [id, n] of Object.entries(group || {})) {
			if (n && typeof n === "object" && "type" in n) nodes.push({ id, node_type: n.type, name: n.name, data: n.data || {} });
			else if (n && typeof n === "object") walk(n);
		}
	};
	walk(g?.nodes);
	const edges = [];
	for (const [type, list] of Object.entries(g?.edges || {}))
		for (const e of list || []) edges.push({ id: e.id, source: e.from, target: e.to, edge_type: type });
	return { nodes, edges };
}

/** È un tileset per ciò che dichiara (il `tileset` della regola). */
export function isTilesetData(d, rule = RULE) {
	const url = String(d?.url ?? "");
	if (rule.tileset.media_types.includes(String(d?.media_type ?? ""))) return true;
	if (rule.tileset.packaging.includes(String(d?.packaging ?? ""))) return true;
	return rule.tileset.url_patterns.some((p) => new RegExp(p, "i").test(url));
}

function index(g) {
	const alive = (x) => !(x?.data?.removed) && !(x?.attributes?.removed);
	const nodes = (g.nodes || []).filter(alive);
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const edges = (g.edges || []).filter((e) => alive(e) && byId.has(e.source) && byId.has(e.target));
	const out = new Map(), inn = new Map();
	for (const e of edges) {
		(out.get(e.source) ?? out.set(e.source, []).get(e.source)).push(e);
		(inn.get(e.target) ?? inn.set(e.target, []).get(e.target)).push(e);
	}
	const outOf = (id, t) => (out.get(id) ?? []).filter((e) => e.edge_type === t).map((e) => e.target);
	const inOf = (id, t) => (inn.get(id) ?? []).filter((e) => e.edge_type === t).map((e) => e.source);
	return { nodes, byId, edges, outOf, inOf };
}

// ── le versioni, come `versions_of` le legge (la catena lod_generation) ─────
function versionsApi(ix) {
	const isRes = (id) => ix.byId.get(id)?.node_type === "resource";
	const oldest = (id) => { const seen = new Set([id]); let cur = id;
		for (;;) { const o = ix.outOf(cur, "was_revision_of").sort(cmp)[0]; if (!o || seen.has(o)) return cur; seen.add(o); cur = o; } };
	const current = (id) => { const seen = new Set([id]); let cur = id;
		for (;;) { const nw = ix.inOf(cur, "was_revision_of").sort(cmp)[0]; if (!nw || seen.has(nw)) return cur; seen.add(nw); cur = nw; } };
	const chain = (id) => { const out = []; const seen = new Set(); let cur = oldest(id);
		while (cur && !seen.has(cur)) { out.push(cur); seen.add(cur); cur = ix.inOf(cur, "was_revision_of").sort(cmp)[0]; } return out; };
	const lodInput = (id) => { for (const p of ix.inOf(oldest(id), "dtc_had_output")) {
		if (dataOf(ix.byId.get(p)).dtc_kind !== LOD_KIND) continue;
		return ix.outOf(p, "dtc_had_input").filter(isRes).sort(cmp)[0] ?? null; } return null; };
	const assetOf = (id) => { const seen = new Set(); let cur = id;
		while (!seen.has(cur)) { seen.add(cur); const i = lodInput(cur); if (!i) return oldest(cur); cur = i; } return oldest(cur); };
	const usesOf = (d, params) => { const u = d.use ?? params.use;
		if (Array.isArray(u)) return u.map(String); if (typeof u === "string" && u) return [u];
		const purpose = String(params.purpose || ""); return USES.includes(purpose) ? [purpose] : []; };
	const entry = (id, extra) => { const n = ix.byId.get(id); const d = dataOf(n);
		return { id, name: String(n?.name ?? ""), level: null, lod_level: null, use: [], ...extra,
		         size_bytes: typeof d.size_bytes === "number" ? d.size_bytes : undefined,
		         checksum: String(d.checksum || ""), url: String(d.url || ""), data: d }; };
	const levelKey = (l) => { const t = String(l ?? ""); const m = /(\d+)/.exec(t); return [m ? 0 : 1, m ? parseInt(m[1], 10) : 0, t]; };
	const cmpKey = (a, b) => a[0] - b[0] || a[1] - b[1] || cmp(a[2], b[2]);
	const versionsOf = (asset) => {
		const rest = [];
		const seen = new Set([asset]);
		const walk = (from, depth) => {
			for (const rev of chain(from))
				for (const p of ix.inOf(rev, "dtc_had_input")) {
					const pd = dataOf(ix.byId.get(p));
					if (pd.dtc_kind !== LOD_KIND) continue;
					const params = pd.parameters && typeof pd.parameters === "object" ? pd.parameters : {};
					for (const child of ix.outOf(p, "dtc_had_output").filter(isRes)) {
						if (seen.has(child)) continue;
						seen.add(child);
						const cur = current(child);
						rest.push(entry(cur, { master: false, level: params.level == null ? null : String(params.level),
						                       lod_level: `lod${depth}`, use: usesOf(dataOf(ix.byId.get(cur)), params) }));
						walk(child, depth + 1);
					}
				}
		};
		walk(asset, 0);
		rest.sort((a, b) => cmpKey(levelKey(a.lod_level ?? a.level), levelKey(b.lod_level ?? b.level))
			|| cmpKey(levelKey(a.level), levelKey(b.level)) || cmp(a.id, b.id));
		return [entry(current(asset), { master: true }), ...rest];
	};
	return { assetOf, versionsOf };
}

const hatKind = (n, rule) => {
	const t = String(n?.node_type ?? "");
	if (rule.hats.container.includes(t)) return "container";
	if (rule.hats.rm.includes(t)) return "rm";
	return null;
};

/** La copertura di un riquadro contro quelli dei modelli (s3Dgraphy). */
export function measureCoverage(altBox, boxes) {
	if (!boxes.size) return null;
	const all = [...boxes.values()];
	const vol = (b) => Math.max(0, b[1][0] - b[0][0]) * Math.max(0, b[1][1] - b[0][1]) * Math.max(0, b[1][2] - b[0][2]);
	const union = [[0, 1, 2].map((i) => Math.min(...all.map((b) => b[0][i]))), [0, 1, 2].map((i) => Math.max(...all.map((b) => b[1][i])))];
	const inter = [[0, 1, 2].map((i) => Math.max(altBox[0][i], union[0][i])), [0, 1, 2].map((i) => Math.min(altBox[1][i], union[1][i]))];
	const iv = vol(inter);
	const iou = iv / Math.max(1e-12, vol(altBox) + vol(union) - iv);
	const inside = [...boxes].filter(([, b]) => [0, 1, 2].every((i) => altBox[0][i] <= (b[0][i] + b[1][i]) / 2 && (b[0][i] + b[1][i]) / 2 <= altBox[1][i]))
		.map(([m]) => m).sort(cmp);
	// tutti i modelli dentro e l'alternativa molto più grande: copre PIÙ del
	// contenitore (l'alternativa di uno più grande) — mai «più o meno»
	return { coverage: iou >= SAME_COVERAGE_IOU ? "whole" : inside.length === boxes.size ? "more" : "partial", iou, inside };
}

/** Per ogni cappello l'insieme delle sue alternative, annidato, con le diagnosi:
 *  `alternative_sets` di s3Dgraphy. → `{sets, warnings, counts}`. */
export function alternativeSets(g, rule = RULE, bounds = null) {
	const ix = index(g);
	const { byId } = ix;
	const V = versionsApi(ix);
	const name = (id) => String(byId.get(id)?.name ?? "") || id;
	const is3d = (id) => byId.get(id)?.node_type === "resource" && rule.file_types.includes(String(dataOf(byId.get(id)).url_type ?? ""));
	const hatAssets = new Map(), assetHats = new Map(), onVersion = [];
	for (const e of ix.edges) {
		if (e.edge_type !== rule.hat_edge || !hatKind(byId.get(e.source), rule) || !is3d(e.target)) continue;
		const asset = V.assetOf(e.target);
		if (asset !== e.target) onVersion.push([e.source, e.target, asset]);
		const ha = hatAssets.get(e.source) ?? hatAssets.set(e.source, []).get(e.source);
		if (!ha.includes(asset)) ha.push(asset);
		const ah = assetHats.get(asset) ?? assetHats.set(asset, []).get(asset);
		if (!ah.includes(e.source)) ah.push(e.source);
	}
	const versions = new Map(), tiles = new Map();
	for (const a of sortU(assetHats.keys())) {
		const es = V.versionsOf(a);
		versions.set(a, es);
		tiles.set(a, es.some((x) => isTilesetData(dataOf(byId.get(x.id)), rule)));
	}
	const membersOf = (gid) => [...new Set(ix.edges.filter((e) => e.edge_type === rule.member_edge && e.target === gid).map((e) => e.source))];
	const containerOf = (id) => ix.outOf(id, rule.member_edge)[0] ?? null;
	const deep = (gid, seen = new Set([gid])) => { const out = [];
		for (const m of membersOf(gid)) { if (!byId.has(m)) continue;
			if (hatKind(byId.get(m), rule) === "container") { if (!seen.has(m)) { seen.add(m); for (const x of deep(m, seen)) if (!out.includes(x)) out.push(x); } }
			else if (!out.includes(m)) out.push(m); }
		return out; };
	const epochCache = new Map();
	const epochs = (hat) => { if (epochCache.has(hat)) return epochCache.get(hat);
		const ids = hatKind(byId.get(hat), rule) === "container" ? deep(hat) : [hat];
		const r = sortU(ids.flatMap((i) => ix.inOf(i, rule.epoch_edge).filter((s) => rule.epoch_types.includes(String(byId.get(s)?.node_type ?? "")))));
		epochCache.set(hat, r); return r; };
	const warnings = [];
	const build = (hat, parent, seen) => {
		const node = byId.get(hat);
		const kind = hatKind(node, rule);
		const assets = sortU(hatAssets.get(hat) ?? []);
		const alts = [];
		for (const a of assets) for (const e of versions.get(a) ?? []) alts.push({ ...e, asset_id: a, current: e.id, tileset: !!tiles.get(a), reason: "lod" });
		const members = [];
		let covers = [];
		if (kind === "container")
			for (const m of membersOf(hat)) {
				if (!byId.has(m) || seen.has(m) || !hatKind(byId.get(m), rule)) continue;
				seen.add(m);
				const sub = build(m, hat, seen);
				members.push(sub);
				covers = covers.concat(sub.hat_kind === "container" ? sub.covers : [m]);
			}
		const mixed = alts.some((x) => x.tileset) && (kind === "container" || alts.some((x) => !x.tileset));
		for (const x of alts) x.reason = x.tileset && mixed ? "packaging" : x.master ? "fidelity" : "lod";
		const byAsset = new Map();
		for (const x of alts) (byAsset.get(x.asset_id) ?? byAsset.set(x.asset_id, []).get(x.asset_id)).push(x);
		const reasons = [];
		if ([...byAsset.values()].some((xs) => xs.some((x) => x.master) && xs.some((x) => !x.master))) reasons.push("fidelity");
		if ([...byAsset.values()].some((xs) => new Set(xs.filter((x) => !x.master).map((x) => x.lod_level ?? null)).size >= 2)) reasons.push("lod");
		if (mixed) reasons.push("packaging");
		let coverage = null;
		if (kind === "container" && alts.length) {
			coverage = "unmeasured";
			if (bounds && bounds.size) {
				const altBox = [hat, ...alts.map((x) => x.id), ...assets].map((i) => bounds.get(i)).find(Boolean);
				const boxes = new Map(covers.filter((m) => bounds.has(m)).map((m) => [m, bounds.get(m)]));
				const cov = altBox && boxes.size === covers.length ? measureCoverage(altBox, boxes) : null;
				if (cov) {
					coverage = cov.coverage;
					if (cov.coverage === "more")
						warnings.push({ code: "partial_coverage", hat, ids: cov.inside,
							message: `the alternative of ${JSON.stringify(name(hat))} covers more than its ${covers.length} models`,
							cure: "put in the container every model the alternative covers, or declare it on the container that holds them" });
					else if (cov.coverage === "partial")
						warnings.push({ code: "partial_coverage", hat, ids: cov.inside,
							message: `the alternative of ${JSON.stringify(name(hat))} covers ${cov.inside.length} of its ${covers.length} models`,
							cure: "make a sub-container of the covered models and declare the alternative its own" });
				}
			}
		}
		if (kind === "container" && alts.length && epochs(hat).length > 1)
			warnings.push({ code: "epochs", hat, ids: epochs(hat),
				message: `${JSON.stringify(name(hat))} has an alternative and its members lie in ${epochs(hat).length} epochs`,
				cure: "one sub-container per epoch, each with its own alternative" });
		return { hat, hat_kind: kind, name: name(hat), node_type: String(node?.node_type ?? ""), epochs: epochs(hat), assets,
		         alternatives: alts, reasons, members, covers: kind === "container" ? covers : [hat], coverage, parent };
	};
	const seen = new Set();
	const top = [];
	for (const c of sortU(ix.nodes.filter((n) => hatKind(n, rule) === "container").map((n) => n.id)))
		if (containerOf(c) == null && !seen.has(c)) { seen.add(c); top.push(build(c, null, seen)); }
	for (const h of sortU(hatAssets.keys()))
		if (!seen.has(h) && hatKind(byId.get(h), rule) === "rm") { seen.add(h); top.push(build(h, null, seen)); }
	for (const h of sortU(hatAssets.keys())) if (!seen.has(h)) { seen.add(h); top.push(build(h, null, seen)); }
	for (const [asset, hats] of [...assetHats].sort((a, b) => cmp(a[0], b[0]))) {
		if (hats.length < 2) continue;
		warnings.push({ code: "two_hats", hat: hats[0], ids: [...sortU(hats), asset],
			message: `${JSON.stringify(name(asset))} has ${hats.length} hats: one object, one hat`,
			cure: "keep the hat that says what it represents and remove the other links" });
	}
	for (const [facet, version, asset] of onVersion)
		for (const hat of assetHats.get(asset) ?? []) {
			if (hat === facet) continue;
			const a = epochs(hat), b = epochs(facet);
			if (a.length !== b.length || a.some((x, i) => x !== b[i]))
				warnings.push({ code: "epochs", hat, ids: [facet, version, asset],
					message: `${JSON.stringify(name(version))}, a version of ${JSON.stringify(name(asset))}, is linked in another epoch than its hat`,
					cure: "the hat is said once, on the master: remove the link on the version" });
		}
	const flat = [...iterSets(top)];
	const by_reason = {};
	for (const k of rule.reasons) by_reason[k] = flat.filter((s) => s.reasons.includes(k)).length;
	return { sets: top, warnings, counts: { sets: flat.length,
		with_alternatives: flat.filter((s) => s.alternatives.length >= 2 || (s.hat_kind === "container" && s.alternatives.length > 0)).length,
		containers: flat.filter((s) => s.hat_kind === "container").length, by_reason,
		entries: flat.reduce((n, s) => n + s.alternatives.length, 0) } };
}

export function* iterSets(sets) { for (const s of sets) { yield s; yield* iterSets(s.members); } }
export function findSet(res, hat) { for (const s of iterSets(res.sets)) if (s.hat === hat) return s; return null; }

const declares = (s, u) => s.alternatives.some((x) => !x.master && (x.use ?? []).includes(u));
const membersDeclare = (s, u) => s.members.some((m) => declares(m, u) || membersDeclare(m, u));

/** L'alternativa da accendere — `choose_alternative` di s3Dgraphy. `choose` è
 *  la regola della versione (`Heriverse.chooseVersion`); `pick` filtra le voci
 *  che il viewer sa aprire; `force` (container | members) è la scelta a mano. */
export function chooseAlternative(s, use, choose, { preferLevel = null, force = null, pick = (e) => e } = {}) {
	const uses = typeof use === "string" ? [use] : [...(use ?? [])];
	if (s.hat_kind !== "container") {
		const ch = choose(pick(s.alternatives), uses, preferLevel);
		return ch ? { ...ch, level: "rm", hat: s.hat, members: null } : null;
	}
	const members = (note = "") => ({ entry: null, reason: "none", use: null, note, level: "members", hat: s.hat,
		members: Object.fromEntries(s.members.map((m) => [m.hat, chooseAlternative(m, uses, choose, { preferLevel, pick })])) });
	const own = pick(s.alternatives);
	if (force === "container" && own.length) return { ...choose(own, uses, preferLevel), level: "container", hat: s.hat, members: null };
	if (force === "members" || !s.alternatives.length) {
		const out = members(force === "members" ? "chosen by hand" : "");
		out.use = force === "members" ? null : uses.find((u) => membersDeclare(s, u)) ?? null;
		return out;
	}
	// the container's own alternative when one this viewer can open serves a use
	if (own.length && uses.some((u) => declares({ alternatives: own }, u)))
		return { ...choose(own, uses, preferLevel), level: "container", hat: s.hat, members: null };
	const out = members();
	out.use = uses.find((u) => membersDeclare(s, u)) ?? null;
	if (!out.use) out.note = `no version for ${uses.join(", ") || "no use"}: the members, each with its master`;
	return out;
}
