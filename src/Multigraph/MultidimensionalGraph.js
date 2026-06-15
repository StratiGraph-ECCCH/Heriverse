import MGEdge from "./MGedge.js";
import MGNode from "./MGnode.js";

/**
 * Class related to a multidimensional graph.
 */
export default class MultidimensionalGraph {
	/**
	 * Initialize the object who'll host the graph and set the basepath
	 * to the JSON file conteining the graph.
	 * @param {String} basepath
	 */
	constructor(basepath, json) {
		this._id = -1;
		this._jsonGraph = {};
		this.json = json;

		this.setBasepath(basepath);
	}

	setBasepath(basepath) {
		this.basepath = basepath;
	}

	/**
	 * Method whom generate the graph after read the json. The json is the one
	 * obtained from the basepath indicated in the constructor.
	 */
	readJson(onSuccess) {
		try {
			if (this.json) {
				this.parseJson();
				onSuccess();
			} else {
				$.getJSON(this.basepath, (json) => {
					this.json = json;
					this.parseJson();
				}).done(function () {
					if (onSuccess) {
						onSuccess();
					}
				}, "JSON PARSED");
			}
		} catch (error) {
			console.error(error);
		}
	}

	parseJson() {
		const nodeGroups = this.json.graphs.PT18.nodes;
		const edgeGroups = this.json.graphs.PT18.edges;
		Object.keys(nodeGroups).forEach((key) => {
			Object.keys(nodeGroups[key]).forEach((id) => {
				let node = nodeGroups[key][id];
				this.addNode(id, node.type, node.name, node.description, node.data);
			});
		});
		Object.keys(edgeGroups).forEach((key) => {
			if (edgeGroups[key].length > 0) {
				Object.keys(edgeGroups[key]).forEach((id) => {
					let edge = edgeGroups[key][id];
					this.addEdge(edge.id, key, this.getNode(edge.from), this.getNode(edge.to));
				});
			}
		});
	}

	/**
	 * Method to add a new node to the graph. It requests: the id of the node; the type of the node; the name; the description;
	 * @param {String} id
	 * @param {String} type
	 * @param {String} name
	 * @param {String} description
	 * @param {Object} data
	 */
	addNode(id, type, name, description, data) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.nodes) {
			this._jsonGraph.graph["nodes"] = {};
		}

		let newNode = new MGNode();

		newNode.setNodeInfo(id, type, name, description, data);

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
	 * @param {MGNode} from
	 * @param {MGNode} to
	 */
	addEdge(id, type, from, to) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.edges) {
			this._jsonGraph.graph["edges"] = {};
		}

		let newEdge = new MGEdge();

		newEdge.setEdgeInfo(id, type, from, to);
		if (from && to) {
			from.addNeighbor(to, to.type, "to", type);
			to.addNeighbor(from, from.type, "from", type);
		}
		this._jsonGraph.graph.edges[id] = newEdge;
	}

	addEdgeByIds(id, type, fromId, toId) {
		if (!this._jsonGraph.graph) {
			this._jsonGraph.graph = {};
		}
		if (!this._jsonGraph.graph.edges) {
			this._jsonGraph.graph["edges"] = {};
		}

		let newEdge = new MGEdge();

		let from = this.getNode(fromId);
		let to = this.getNode(toId);

		newEdge.setEdgeInfo(id, type, from, to);
		if (from && to) {
			from.addNeighbor(to, to.type, "to", type);
			to.addNeighbor(from, from.type, "from", type);
		}
		this._jsonGraph.graph.edges[id] = newEdge;
	}

	/**
	 * Method to obtain a node starting from its id.
	 * @param {String} id
	 * @returns
	 */
	getNode(id) {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};
		return this._jsonGraph.graph.nodes[id];
	}
	/**
	 * Method to obtain an edge starting from its id.
	 * @param {String} id
	 * @returns
	 */
	getEdge(id) {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};
		return this._jsonGraph.graph.edges[id];
	}

	/**
	 * Method to get all nodes according to the type.
	 * @param {String} type
	 * @returns
	 */
	getNodes(type) {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};
		if (type == null) return this._jsonGraph.graph.nodes;
		let resNodes = {};
		Object.keys(this._jsonGraph.graph.nodes).forEach((key) => {
			let node = this._jsonGraph.graph.nodes[key];
			if (node.type === type) {
				resNodes[key] = node;
			}
		});
		return resNodes;
	}

	/**
	 * Method to get all edges composing the graph.
	 * @returns
	 */
	getEdges() {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};
		return this._jsonGraph.graph.edges;
	}
	/**
	 * Method to get edges according to the type or the direction.
	 * @param {String} typeOrDirection
	 * @returns
	 */
	getEdges(type) {
		if (!Object.keys(this._jsonGraph).length || !Object.keys(this._jsonGraph.graph).length)
			return {};
		let resEdges = {};
		Object.keys(this._jsonGraph.graph.edges).forEach((key) => {
			let edge = this._jsonGraph.graph.edges[key];
			if (edge.type === type) {
				resEdges[edge.id] = edge;
			}
		});
		return resEdges;
	}
}
