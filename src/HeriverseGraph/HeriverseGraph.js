import MultidimensionalGraph from "../Multigraph/MultidimensionalGraph.js";
import HeriverseNode from "./HeriverseNode.js";
import HeriverseEdge from "./HeriverseEdge.js";
import MGEdge from "../Multigraph/MGedge.js";
import Period from "../Models/period.js";

/**
 * Class related to a multidimensional graph.
 */
export default class HeriverseGraph extends MultidimensionalGraph {
	static stratigraphicTypes = [
		"serSU",
		"SF",
		"US",
		"USD",
		"USVn",
		"USVs",
		"serUSVs",
		"serUSVn",
		"UTR",
		"VSF",
		"TSU",
		"SE",
	];

	/**
	 * Initialize the object who'll host the graph and set the basepath
	 * to the JSON file conteining the graph.
	 * @param {String} basepath
	 */
	constructor(basepath, json) {
		super(basepath, json);
		this.timeline = [];
		this.representationNodes = {};
		this.panoramaNodes = {};
		this.proxyNodes = {};
		this.stratigraphicNodes = {};
		this.nodesByIndex = {};
		this.panorama = "";
	}

	parseJson() {
		this._jsonGraph = {};
		if (this.json && this.json.graphs && Object.keys(this.json.graphs).length) {
			const graphKeys = Object.keys(this.json.graphs);
			for (let graphKey of graphKeys) {
				const nodeGroups = this.json.graphs[graphKey].nodes;
				const edgeGroups = this.json.graphs[graphKey].edges;
				let default_authors = this.json.graphs[graphKey].defaults
					? this.json.graphs[graphKey].defaults.authors
					: "anonymous";
				let default_license = this.json.graphs[graphKey].defaults
					? this.json.graphs[graphKey].defaults.license
					: "none";
				let default_embargo_until = this.json.graphs[graphKey].defaults
					? this.json.graphs[graphKey].defaults.embargo_until
					: "none";
				this.panorama = this.json.graphs[graphKey].defaults
					? this.json.graphs[graphKey].defaults.panorama
					: "";
				if (Object.keys(nodeGroups).length) {
					Object.keys(nodeGroups).forEach((key) => {
						if (key === "stratigraphic") {
							const subNodeGroups = nodeGroups.stratigraphic;
							Object.keys(subNodeGroups).forEach((subKey) => {
								Object.keys(subNodeGroups[subKey]).forEach((id) => {
									let node = subNodeGroups[subKey][id];
									let license = node.license || default_license;
									let authors = node.authors || default_authors;
									let embargo_until = node.embargo_until || default_embargo_until;
									// graphKey + "_" + id
									this.addNode(
										id,
										node.type,
										node.name,
										node.description,
										node.data,
										license,
										authors,
										embargo_until,
										graphKey
									);
								});
							});
						} else {
							Object.keys(nodeGroups[key]).forEach((id) => {
								let node = nodeGroups[key][id];
								let license = node.license || default_license;
								let authors = node.authors || default_authors;
								let embargo_until = node.embargo_until || default_embargo_until;
								// graphKey + "_" + id
								this.addNode(
									id,
									node.type,
									node.name,
									node.description,
									node.data,
									license,
									authors,
									embargo_until,
									graphKey
								);
							});
						}
					});
				}
				if (Object.keys(edgeGroups).length) {
					Object.keys(edgeGroups).forEach((key) => {
						if (edgeGroups[key].length > 0) {
							Object.keys(edgeGroups[key]).forEach((id) => {
								let edge = edgeGroups[key][id];
								// graphKey + "_" + edge.id
								// graphKey + "_" + edge.from
								// graphKey + "_" + edge.to
								this.addEdge(
									edge.id,
									key,
									this.getNode(edge.from),
									this.getNode(edge.to),
									graphKey
								);
							});
						}
					});
				}
			}
		}
		this.rebuildIndexes();
	}

	indexTimeline() {
		let epochs = this.getNodes("EpochNode"); // epoch
		this.timeline = [];
		for (let epoch in epochs) {
			this.timeline.push(
				new Period(epoch, epochs[epoch].name, 0, 0, epochs[epoch].graph)
					.setMin(epochs[epoch].data.start_time)
					.setMax(epochs[epoch].data.end_time)
					.setColor(new THREE.Color(epochs[epoch].data.color))
			);
		}
		this.timeline.sort(Heriverse.comparePeriod);
	}

	indexNodes() {
		let rnodes = this.getNodes();
		for (let id in rnodes) {
			if (rnodes[id].graph !== "shelf") this.nodesByIndex[id] = rnodes[id];
		}
	}

	indexRepresentationNodes() {
		let rnodes = this.getNodes("representation_model");
		for (let id in rnodes) {
			this.representationNodes[id] = rnodes[id];
		}
	}

	indexStratigraphicNodes() {
		let rnodes = this.getStratigraphicNodes();
		for (let id in rnodes) {
			this.stratigraphicNodes[id] = rnodes[id];
		}
	}

	indexPanoramaNodes() {
		let rnodes = this.getNodes(HeriverseNode.TYPE.PANORAMA_MODELS);
		for (let id in rnodes) {
			this.panoramaNodes[id] = rnodes[id];
		}
	}

	rebuildIndexes() {
		this.clearIndexes();
		this.indexNodes();
		this.indexTimeline();
		this.indexRepresentationNodes();
		this.indexStratigraphicNodes();
		this.indexPanoramaNodes();
	}

	clearIndexes() {
		this.timeline = [];
		this.nodesByIndex = {};
		this.representationNodes = {};
		this.panoramaNodes = {};
		this.proxyNodes = {};
		this.stratigraphicNodes = {};
	}

	getSourceGraphByProxyID(id) {
		for (let i in this.nodesByIndex) {
			let xn = this.nodesByIndex[i];
			if (xn.name === id) return xn;
		}
		return undefined;
	}

	/**
	 * Method to add a new node to the graph. It requests: the id of the node; the type of the node; the name; the description;
	 * @param {String} id
	 * @param {String} type
	 * @param {String} name
	 * @param {String} description
	 * @param {Object} data
	 */
	addNode(id, type, name, description, data, license, authors, embargo_until, graph) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.nodes) {
			this._jsonGraph.graph["nodes"] = {};
		}

		let newNode = new HeriverseNode();
		newNode.setNodeInfo(id, type, name, description, data, license, authors, embargo_until, graph);
		this._jsonGraph.graph.nodes[id] = newNode;
	}

	/**
	 * Method to add a new edge to the graph. Requested informations are:
	 * - the identifier of the edge;
	 * - the type;
	 * - the node whom starts the edge;
	 * - the node where the edge ends;
	 * @param {String} id
	 * @param {String} type
	 * @param {HeriverseNode} from
	 * @param {HeriverseNode} to
	 * @param {String} graph
	 */
	addEdge(id, type, from, to, graph) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.edges) {
			this._jsonGraph.graph["edges"] = {};
		}

		let newEdge = new HeriverseEdge();

		newEdge.setEdgeInfo(id, type, from, to, graph);
		if (from && to) {
			from.addNeighbor(to, to.type, "to", type);
			to.addNeighbor(
				from,
				from.type,
				"from",
				type === HeriverseNode.RELATIONS.IS_AFTER ? HeriverseNode.RELATIONS.CHANGED_FROM : type
			);
		}
		this._jsonGraph.graph.edges[id] = newEdge;
	}

	newNode(node, { rebuild = true } = {}) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.nodes) {
			this._jsonGraph.graph["nodes"] = {};
		}

		// node.graph + "_" + node.id
		this._jsonGraph.graph.nodes[node.id] = node;

		if (HeriverseGraph.stratigraphicTypes.includes(node.type)) {
			if (!this.json.graphs[node.graph].nodes["stratigraphic"])
				this.json.graphs[node.graph].nodes["stratigraphic"] = {};

			if (!this.json.graphs[node.graph].nodes["stratigraphic"][node.type])
				this.json.graphs[node.graph].nodes["stratigraphic"][node.type] = {};

			// node.graph + "_" + node.id
			this.json.graphs[node.graph].nodes["stratigraphic"][node.type][node.id] = {
				type: node.type,
				name: node.name,
				description: node.description,
				data: node.data,
				license: node.license,
				authors: node.authors,
				embargo_until: node.embargo_until,
			};
		} else {
			if (!this.json.graphs[node.graph].nodes[this.fromNodeType2GraphType(node.type)])
				this.json.graphs[node.graph].nodes[this.fromNodeType2GraphType(node.type)] = {};

			// node.graph + "_" + node.id
			this.json.graphs[node.graph].nodes[this.fromNodeType2GraphType(node.type)][node.id] = {
				type: node.type,
				name: node.name,
				description: node.description,
				data: node.data,
				license: node.license,
				authors: node.authors,
				embargo_until: node.embargo_until,
			};
		}

		if (rebuild) {
			this.rebuildIndexes();
		}
	}

	deleteNode(nodeId, { rebuild = true } = {}) {
		const node = this.nodesByIndex[nodeId] || this.getNode(nodeId);

		if (!node) {
			console.warn("Node not found:", nodeId);
			return false;
		}

		const graph = this.json?.graphs?.[node.graph];

		if (!graph) {
			console.warn("Graph not found for node:", nodeId);
			return false;
		}

		this.deleteNodeEdgesFromJSON(nodeId, graph);
		this.deleteNodeFromJSON(nodeId, node, graph);

		this.deleteNodeEdgesFromRuntimeGraph(nodeId);
		this.deleteNodeFromRuntimeGraph(nodeId);

		if (rebuild) this.parseJson();

		return true;
	}

	deleteNodeEdgesFromJSON(nodeId, graph) {
		if (!graph.edges) return;

		Object.keys(graph.edges).forEach((edgeType) => {
			graph.edges[edgeType] = graph.edges[edgeType].filter(
				(edge) => edge.from !== nodeId && edge.to !== nodeId
			);

			if (!graph.edges[edgeType].length) {
				delete graph.edges[edgeType];
			}
		});
	}

	deleteNodeFromJSON(nodeId, node, graph) {
		if (!graph.nodes) return;

		if (HeriverseGraph.stratigraphicTypes.includes(node.type)) {
			const stratigraphicNodes = graph.nodes.stratigraphic;

			if (!stratigraphicNodes) return;

			const stratigraphicType = node.type || HeriverseNode.getTypeFromNodeType?.(node.type);

			if (stratigraphicNodes[stratigraphicType]?.[nodeId]) {
				delete stratigraphicNodes[stratigraphicType][nodeId];

				if (!Object.keys(stratigraphicNodes[stratigraphicType]).length) {
					delete stratigraphicNodes[stratigraphicType];
				}
			}

			return;
		}

		const graphNodeType =
			this.fromNodeType2GraphType(node.type) || HeriverseNode.getTypeFromNodeType?.(node.type);

		if (graphNodeType && graph.nodes[graphNodeType]?.[nodeId]) {
			delete graph.nodes[graphNodeType][nodeId];

			if (!Object.keys(graph.nodes[graphNodeType]).length) {
				delete graph.nodes[graphNodeType];
			}
		}
	}

	deleteNodeEdgesFromRuntimeGraph(nodeId) {
		const runtimeEdges = this._jsonGraph?.graph?.edges;

		if (!runtimeEdges) return;

		Object.keys(runtimeEdges).forEach((edgeId) => {
			const edge = runtimeEdges[edgeId];

			const fromId = this.getEdgeEndpointId(edge.from);
			const toId = this.getEdgeEndpointId(edge.to);

			if (fromId === nodeId || toId === nodeId) {
				delete runtimeEdges[edgeId];
			}
		});
	}

	deleteNodeFromRuntimeGraph(nodeId) {
		if (this._jsonGraph?.graph?.nodes?.[nodeId]) {
			delete this._jsonGraph.graph.nodes[nodeId];
		}

		if (this.nodesByIndex?.[nodeId]) {
			delete this.nodesByIndex[nodeId];
		}
	}

	fromNodeType2GraphType(nodetype) {
		const typeMapping = {
			[HeriverseNode.NODE_TYPE.AUTHOR]: HeriverseNode.TYPE.AUTHORS,
			[HeriverseNode.NODE_TYPE.STRATIGRAPHIC]: HeriverseNode.TYPE.STRATIGRAPHIC,
			[HeriverseNode.NODE_TYPE.EPOCH]: HeriverseNode.TYPE.EPOCHS,
			[HeriverseNode.NODE_TYPE.GROUP]: HeriverseNode.TYPE.GROUPS,
			[HeriverseNode.NODE_TYPE.ACTIVITY_NODE_GROUP]: HeriverseNode.TYPE.GROUPS,
			[HeriverseNode.NODE_TYPE.PARADATA_NODE_GROUP]: HeriverseNode.TYPE.GROUPS,
			[HeriverseNode.NODE_TYPE.PROPERTY]: HeriverseNode.TYPE.PROPERTIES,
			[HeriverseNode.NODE_TYPE.DOCUMENT]: HeriverseNode.TYPE.DOCUMENTS,
			[HeriverseNode.NODE_TYPE.EXTRACTOR]: HeriverseNode.TYPE.EXTRACTORS,
			[HeriverseNode.NODE_TYPE.COMBINER]: HeriverseNode.TYPE.COMBINERS,
			[HeriverseNode.NODE_TYPE.LINK]: HeriverseNode.TYPE.LINKS,
			[HeriverseNode.NODE_TYPE.GEO]: HeriverseNode.TYPE.GEO,
			[HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE]: HeriverseNode.TYPE.SEMANTIC_SHAPES,
			[HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL]: HeriverseNode.TYPE.REPRESENTATION_MODELS,
			[HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC]:
				HeriverseNode.TYPE.REPRESENTATION_MODEL_DOC,
			[HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF]: HeriverseNode.TYPE.REPRESENTATION_MODEL_SF,
			[HeriverseNode.NODE_TYPE.PANORAMA_MODEL]: HeriverseNode.TYPE.PANORAMA_MODELS,
		};

		return typeMapping[nodetype] || null;
	}

	newEdge(id, from, to, type, { rebuild = true } = {}) {
		if (!from || !to || from.graph !== to.graph) {
			alert("Nodi appartenenti a grafi diversi o almeno uno è inesistente. Relazione non creata.");
			return;
		}

		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.edges) {
			this._jsonGraph.graph["edges"] = {};
		}

		let newEdge = new MGEdge();

		let _id = id || crypto.randomUUID();

		newEdge.setEdgeInfo(_id, type, from, to);
		if (from && to) {
			from.addNeighbor(to, to.type, "to", type);
			to.addNeighbor(
				from,
				from.type,
				"from",
				type === HeriverseNode.RELATIONS.IS_AFTER ? HeriverseNode.RELATIONS.CHANGED_FROM : type
			);
		}
		this._jsonGraph.graph.edges[_id] = newEdge;
		if (!this.json.graphs[from.graph].edges) this.json.graphs[from.graph].edges = {};
		if (!this.json.graphs[from.graph].edges[type]) this.json.graphs[from.graph].edges[type] = [];
		this.json.graphs[from.graph].edges[type].push({
			id: _id,
			from: from.id,
			to: to.id,
		});

		if (rebuild) this.rebuildIndexes();
	}

	newEdgeFromIds(id, fromId, toId, type, graph, { rebuild = true } = {}) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.edges) {
			this._jsonGraph.graph["edges"] = {};
		}

		let from = this.getNode(fromId);
		let to = this.getNode(toId);

		if (!from || !to || from.graph !== to.graph) {
			alert("Nodi appartenenti a grafi diversi o almeno uno è inesistente. Relazione non creata.");
			return;
		}

		let newEdge = new MGEdge();

		let _id = id || crypto.randomUUID();

		newEdge.setEdgeInfo(_id, type, from, to);
		if (from && to) {
			from.addNeighbor(to, to.type, "to", type);
			to.addNeighbor(
				from,
				from.type,
				"from",
				type === HeriverseNode.RELATIONS.IS_AFTER ? HeriverseNode.RELATIONS.CHANGED_FROM : type
			);
		}

		this._jsonGraph.graph.edges[_id] = newEdge;

		if (!this.json.graphs[from.graph].edges) {
			this.json.graphs[from.graph].edges = {};
		}

		if (!this.json.graphs[from.graph].edges[type]) {
			this.json.graphs[from.graph].edges[type] = [];
		}

		this.json.graphs[from.graph].edges[type].push({
			id: _id,
			from: from.id,
			to: to.id,
		});

		if (rebuild) this.rebuildIndexes();
	}

	deleteEdge(edgeId, { rebuild = true } = {}) {
		if (!edgeId) return false;

		let deleted = false;

		Object.values(this.json?.graph || {}).forEach((graph) => {
			if (!graph.edges) return;

			Object.keys(graph.edges).forEach((edgeType) => {
				const before = graph.edges[edgeType].length;

				graph.edges[edgeType] = graph.edges[edgeType].filter((edge) => edge.id !== edgeId);

				if (graph.edges[edgeType].length !== before) {
					deleted = true;
				}

				if (!graph.edges[edgeType].length) {
					delete graph.edges[edgeType];
				}
			});
		});

		if (this._jsonGraph?.graph?.edges?.[edgeId]) {
			delete this._jsonGraph.graph.edges[edgeId];
			deleted = true;
		}

		if (!deleted) return false;

		if (rebuild) {
			this.parseJson();
		}

		return true;
	}

	deleteEdgeByNodes(fromId, toId, type = null, { rebuild = true } = {}) {
		if (!fromId || !toId) return false;

		const edgeIdsToDelete = [];

		Object.values(this.json?.graphs || {}).forEach((graph) => {
			if (!graph.edges) return;

			Object.entries(graph.edges).forEach(([edgeType, edges]) => {
				if (type && edgeType !== type) return;

				edges.forEach((edge) => {
					if (edge.from === fromId && edge.to === toId) {
						edgeIdsToDelete.push(edge.id);
					}
				});
			});
		});

		if (!edgeIdsToDelete.length) return false;

		edgeIdsToDelete.forEach((edgeId) => {
			this.deleteEdge(edgeId, { rebuild: false });
		});

		if (rebuild) {
			this.parseJson();
		}

		return true;
	}

	/**
	 * Method who return all stratigraphic nodes.
	 * @returns
	 */
	getStratigraphicNodes() {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};
		let resNodes = {};
		Object.keys(this._jsonGraph.graph.nodes).forEach((key) => {
			let node = this._jsonGraph.graph.nodes[key];
			if (HeriverseGraph.stratigraphicTypes.includes(node.type)) {
				resNodes[key] = node;
			}
		});
		return resNodes;
	}

	/**
	 * Method to get edges according to the type or the direction.
	 * @param {String} typeOrDirection
	 * @returns
	 */
	getEdges(type = null) {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};

		if (!type) {
			return this._jsonGraph.graph.edges;
		}

		let resEdges = {};

		Object.keys(this._jsonGraph.graph.edges).forEach((key) => {
			let edge = this._jsonGraph.graph.edges[key];

			if (edge.type === type) {
				resEdges[edge.id] = edge;
			}
		});

		return resEdges;
	}

	getEdgeEndpointId(endpoint) {
		if (!endpoint) return null;

		if (typeof endpoint === "string") return endpoint;

		if (endpoint.id) return endpoint.id;

		return null;
	}

	getPeriod(id) {
		if (!this.timeline) return undefined;
		let numPeriods = this.timeline.length;

		for (let p = 0; p < numPeriods; p++) {
			if (this.timeline[p].id === id) return this.timeline[p];
		}

		return undefined;
	}

	getPeriodFromName(nameid) {
		if (!this.timeline) return undefined;
		let numPeriods = this.timeline.length;

		for (let p = 0; p < numPeriods; p++) {
			if (this.timeline[p].name === nameid) return this.timeline[p];
		}

		return undefined;
	}

	getPanoramaUrlFromPeriod(id) {
		let panorama = this.panorama;
		let epoch = this.getNode(id);
		if (epoch) {
			let panos = Object.values(epoch.getNeighborsByType(HeriverseNode.NODE_TYPE.PANORAMA_MODEL));
			let pano = null;
			if (panos.length > 0) {
				pano = panos[0];
			}
			if (pano && pano.data && pano.data.url) {
				panorama = pano.data.url;
			}
		}
		return panorama;
	}

	getEpoch(id) {
		if (!this.timeline) return undefined;
		let numPeriods = this.timeline.length;

		for (let p = 0; p < numPeriods; p++) {
			if (this.timeline[p].id === id) return this.timeline[p];
		}

		return undefined;
	}

	getPeriodIndexFromName(nameid) {
		if (!this.timeline) return undefined;
		let numPeriods = this.timeline.length;

		for (let p = 0; p < numPeriods; p++) {
			if (this.timeline[p].name === nameid) return p;
		}

		return undefined;
	}

	checkPeriodFromTime(start_t, end_t) {
		let numPeriods = this.timeline.length;
		for (let p = 0; p < numPeriods; p++) {
			let period = this.timeline[p];
			if (period.min <= start_t && start_t <= period.max) {
				return true;
			}
			if (period.min <= end_t && end_t <= period.max) {
				return true;
			}
			if (period.min >= start_t && period.max <= end_t) {
				return true;
			}
		}
		return false;
	}

	getPeriodIndexFromTime(start_t, end_t) {
		if (!this.timeline) return undefined;
		this.checkPeriodFromTime(start_t, end_t);
		let numPeriods = this.timeline.length;
		let start = 0;
		let end = numPeriods - 1;
		for (let p = 0; p < numPeriods; p++) {
			if (start_t > this.timeline[p].max) {
				if (p < numPeriods - 1) start = p + 1;
			}
			if (end_t < this.timeline[p].min) {
				if (p > 0) {
					end = p - 1;
					break;
				}
			}
		}
		//return (numPeriods-1);
		return [start, end];
	}

	buildContinuity() {
		return;
	}

	buildRec() {
		for (let p in this.timeline) {
			let pname = this.timeline[p].name;

			let pnamerec = pname + " Rec";

			let currGroup = ATON.getSemanticNode(pname);
			let recGroup = ATON.getSemanticNode(pnamerec);

			if (currGroup && recGroup) {
				for (let c in currGroup.children) {
					let proxNode = currGroup.children[c];

					let EMdata = proxNode.userData.EM;
					EMdata.periods[pnamerec] = true;
				}
			}
		}
	}
}
