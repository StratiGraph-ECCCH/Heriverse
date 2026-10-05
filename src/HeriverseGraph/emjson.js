// HERIVERSE LEGGE L'EM.JSON (E.D., 5 ott 2026).
//
// Lo studio arriva com'è nel nodo e in ogni altro client: `em.json`, cioè
// `{header, graphs: {<id>: {graph_id, name, nodes: [...], edges: [...]}}}`,
// nodi con `node_type`, archi con `edge_type`/`source`/`target`. Il lettore di
// Heriverse è nato sul multigrafo raggruppato per tipo dell'export di
// Blender (`nodes[<gruppo>][<id>]`, `edges[<tipo>] = [{id, from, to}]`): qui si
// passa dall'uno all'altro, senza perdere niente di ciò che il lettore usa, e
// il lettore resta uno solo.
//
// Nessun import: il modulo si prova in node senza ATON né THREE, e i tipi
// stratigrafici li passa chi chiama (`HeriverseGraph.stratigraphicTypes`).

// Lo «shelf» che Create e il server aggiungono a un progetto caricato è un
// grafo nella forma raggruppata (`nodes: {}`) anche quando il resto è un
// em.json (il pacchetto su disco, H4): basta UN grafo a liste perché il
// documento sia un em.json, e i grafi già raggruppati passano com'erano.
const isListGraph = (g) => Boolean(g && Array.isArray(g.nodes));

/** È un em.json (liste di nodi e archi) e non il multigrafo raggruppato? */
export function isEmJson(json) {
	if (!json || typeof json !== "object") return false;
	if (json.header && json.header.format === "em.json") return true;
	const graphs = json.graphs && Object.values(json.graphs);
	return Boolean(graphs && graphs.some(isListGraph));
}

/** em.json → il multigrafo che `HeriverseGraph.parseJson` legge. */
export function emJsonToMultigraph(doc, stratigraphicTypes = []) {
	const strat = new Set(stratigraphicTypes);
	const out = { version: doc.header?.version || "em.json", graphs: {} };
	for (const [key, g] of Object.entries(doc.graphs || {})) {
		if (!isListGraph(g)) {
			out.graphs[key] = g;
			continue;
		}
		const nodes = { stratigraphic: {} };
		for (const n of g.nodes || []) {
			const type = n.node_type || n.type;
			if (!n.id || !type) continue;
			const entry = { type, name: n.name ?? "", description: n.description ?? "",
			                data: n.data || {} };
			for (const k of ["license", "authors", "embargo_until"])
				if (n[k] !== undefined) entry[k] = n[k];
			const group = strat.has(type) ? (nodes.stratigraphic[type] ||= {}) : (nodes[type] ||= {});
			group[n.id] = entry;
		}
		const edges = {};
		for (const e of g.edges || []) {
			const type = e.edge_type || e.type;
			const from = e.source ?? e.from;
			const to = e.target ?? e.to;
			if (!type || from === undefined || to === undefined) continue;
			(edges[type] ||= []).push({ id: e.id || `${from}_${type}_${to}`, from, to });
		}
		out.graphs[key] = { name: g.name || key, nodes, edges,
		                                  ...(g.defaults ? { defaults: g.defaults } : {}) };
	}
	return out;
}
