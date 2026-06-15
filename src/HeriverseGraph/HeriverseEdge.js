import MGEdge from "../Multigraph/MGedge.js";

export default class HeriverseEdge extends MGEdge {

     /**
   * Method to set the basic information about the edge.
   * @param {String} id
   * @param {String} type
   * @param {MGNode} from
   * @param {MGNode} to
   * @param {graph} graph
   */
  setEdgeInfo(id, type, from, to, graph) {
    super.setEdgeInfo(id, type, from, to);
    this.graph = graph;
  }

}
