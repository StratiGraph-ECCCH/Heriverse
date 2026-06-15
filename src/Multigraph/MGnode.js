/**
 * Class representing a node of the graph
 * @class MultidimensionalGraph
 */

export default class MGNode {
	constructor() {
		this.id = undefined;
		this.type = undefined;
		this.name = undefined;
		this.description = undefined;
		this.data = undefined;

		this.edges = {};

		this.neighbors = {};
	}

	/**
	 * Add a neighbor node according to:
	 * - type (of the addee node)
	 * - direction (if the shared edge starts or ends on addee node)
	 * - relation (type of egde shared)
	 * @param {MGNode} node
	 * @param {String} type
	 * @param {String} direction
	 * @param {String} relation
	 */
	addNeighbor(node, type, direction, relation) {
		if (!this.neighbors[type]) {
			this.neighbors[type] = {};
		}
		if (!this.edges[direction]) {
			this.edges[direction] = {};
		}
		if (!this.edges[relation]) {
			this.edges[relation] = {};
		}
		if (!this.edges[relation][direction]) {
			this.edges[relation][direction] = {};
		}

		this.neighbors[type][node.id] = node;
		this.edges[direction][node.id] = node;
		this.edges[relation][direction][node.id] = node;
	}

	/**
	 * Get the neighbor node according to the "index" and the "relation".
	 * @param {String} nodeId
	 * @param {String} relation
	 * @returns
	 */
	getNeighborByRelation(nodeId, relation, direction) {
		if (this.edges[relation][direction][nodeId]) return this.edges[relation][direction][nodeId];
		else return {};
	}

	/**
	 * Method to get the neighbors related to the specific type.
	 * @param {String} type
	 * @returns
	 */
	getNeighborsByType(type) {
		if (this.neighbors[type]) return this.neighbors[type];
		else return {};
	}

	/**
	 * Method to get the neighbors related to the direction of the shared edge.
	 * @param {String} type
	 * @returns
	 */
	getNeighborsByDirection(direction) {
		if (this.edges[direction]) return this.edges[direction];
		else return {};
	}

	/**
	 * Method to obtain the neighbors accordin
	 * @param {String} relation
	 * @param {String} direction
	 * @returns
	 */
	getNeighborsByRelation(relation, direction = null) {
		if (this.edges[relation] && !direction) return this.edges[relation];
		else if (this.edges[relation] && this.edges[relation][direction]) {
			return this.edges[relation][direction];
		} else return {};
	}

	/**
	 * Method to set the basic information about the nodes:
	 * @param {String} id
	 * @param {String} type
	 * @param {String} name
	 * @param {String} description
	 * @param {Object} data
	 */
	setNodeInfo(id, type, name, description, data) {
		this.id = id;
		this.type = type;
		this.name = name;
		this.description = description;
		this.data = data;
	}
}
