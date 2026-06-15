import MGNode from "./MGnode.js";

/**
 * Class representing an edge of the graph
 * @class MultidimensionalGraph
 */
export default class MGEdge {
	constructor() {
		this.id = undefined;
		this.from = undefined;
		this.to = undefined;
		this.type = undefined;
	}

	/**
	 * Method to set the basic information about the edge.
	 * @param {String} id
	 * @param {String} type
	 * @param {MGNode} from
	 * @param {MGNode} to
	 */
	setEdgeInfo(id, type, from, to) {
		this.id = id;
		this.type = type;
		if (from && to) {
			this.from = from;
			this.to = to;
		}
	}

	/**
	 * Method to get the node where the edge start from.
	 * @returns
	 */
	getStartNode() {
		return this.from;
	}
	/**
	 * Method to get the node where the edge point to.
	 * @returns
	 */
	getEndNode() {
		return this.to;
	}

	/**
	 * Method to get the type of the edge.
	 * @returns
	 */
	getEdgeType() {
		return this.type;
	}
}
