import MGEdge from "../Multigraph/MGedge.js";
import MultidimensionalGraph from "../Multigraph/MultidimensionalGraph.js";
import ShelfNode from "./ShelfNode.js";

export default class ShelfGraph extends MultidimensionalGraph {
	static linksByUrlType = {};

	constructor(basepath, json) {
		super(basepath, json);
		// this.json = json;
		this.parseShelfJson();
	}

	readShelfJson(onSuccess) {
		try {
			$.getJSON(this.basepath, (json) => {}).done(() => {
				this.parseShelfJson();
				if (onSuccess) {
					onSuccess();
				}
			}, "JSON SHELF PARSED");
		} catch (e) {
			console.error(e);
		}
	}

	parseShelfJson() {
		this._jsonGraph = {};
		if (this.json.graphs.shelf) {
			const nodes = this.json.graphs.shelf.nodes;
			const edges = this.json.graphs.shelf.edges;
			let default_name = this.json.graphs.shelf.name.default;
			let default_description = this.json.graphs.shelf.description.default;
			let default_data = this.json.graphs.shelf.data;

			Object.keys(nodes).forEach((nodeId) => {
				let node = nodes[nodeId];
				this.addShelfNode(nodeId, node.type, node.name, node.data, "", "", "", "");
			});
		}
	}

	addShelfNode(id, type, name, data, author = "", license = "", creation = "", thumbnail = "") {
		if (!this._jsonGraph.graph) this._jsonGraph.graph = {};
		if (!this._jsonGraph.graph.nodes) this._jsonGraph.graph.nodes = {};
		if (!ShelfGraph.linksByUrlType[data.url_type]) ShelfGraph.linksByUrlType[data.url_type] = {};

		let newNode = new ShelfNode();
		newNode.setNodeInfo(id, type, name, data, author, license, creation, thumbnail);
		this._jsonGraph.graph.nodes[newNode.id] = newNode;

		if (!this.json) this.json = {};
		if (!this.json.graphs) this.json.graphs = {};
		if (!this.json.graphs.shelf) this.json.graphs.shelf = {};
		if (!this.json.graphs.shelf.nodes) this.json.graphs.shelf.nodes = {};
		this.json.graphs.shelf.nodes[newNode.id] = {
			name: name,
			type: "link",
			data: data,
		};
		ShelfGraph.linksByUrlType[data.url_type][newNode.id] = newNode;
	}

	newNode(node) {
		if (!this._jsonGraph.graph) this._jsonGraph.graph = {};
		if (!this._jsonGraph.graph.nodes) this._jsonGraph.graph.nodes = {};
		this._jsonGraph.graph.nodes[node.id] = node;

		if (!this.json.graphs) this.json.graphs = {};
		if (!this.json.graphs.shelf) this.json.graphs.shelf = {};
		if (!this.json.graphs.shelf.nodes) this.json.graphs.shelf.nodes = {};
		this.json.graphs.shelf.nodes[node.id] = {
			type: node.type,
			name: node.name,
			description: node.data.description,
			data: node.data,
		};
	}

	addShelfEdge(id, from, to, type) {
		if (!this._jsonGraph.graph) this._jsonGraph.graph = {};
		if (!this._jsonGraph.graph.edges) this._jsonGraph.graph.edges = {};

		let newEdge = new MGEdge();
		newEdge.setEdgeInfo(id, type, from, to);
		if (from && to) {
			from.addNeighbor(to, to.type, "to", type);
			to.addNeighbor(from, from.type, "from", type);
		}
		this._jsonGraph.graph.edges[id] = newEdge;

		if (!this.json.graphs) this.json.graphs = {};
		if (!this.json.graphs.shelf) this.json.graphs.shelf = {};
		if (!this.json.graphs.shelf.edges) this.json.graphs.shelf.edges = {};
		if (!this.json.graphs.shelf.edges[type]) this.json.graphs.shelf.edges[type] = [];
		this.json.graphs.shelf.edges[type].push({
			from: from.id,
			to: to.id,
		});
	}

	getEdges() {
		return this._jsonGraph.graph.edges;
	}

	getEdges(type) {
		return this._jsonGraph.graph.edges[type];
	}

	getNodesByContentType(contentType) {
		if (type === null) return this._jsonGraph.graph.nodes;
		let resNodes = {};
		Object.keys(this._jsonGraph.graph.nodes).forEach((nodeId) => {
			let node = this._jsonGraph.graph.nodes[nodeId];
			if (node.data.url_type === contentType) resNodes[nodeId] = node;
		});
	}
}
