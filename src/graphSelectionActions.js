import * as AppModeViewModel from "./appModeViewModel.js";
import { populateWorkspace } from "../editor/workspacePanel.js";

export function getSelectedGraphs() {
	return Heriverse.currentGraphs || [];
}

export function getCurrentGraphId() {
	return Heriverse.currGraphId || "";
}

export function getCurrentGraphName() {
	return Heriverse.currGraphName || "";
}

export function isGraphSelected(graphId) {
	return getSelectedGraphs().includes(graphId);
}

export function canDeselectGraph(graphId) {
	const selectedGraphs = getSelectedGraphs();

	return !(selectedGraphs.includes(graphId) && selectedGraphs.length === 1);
}

export function toggleGraphSelection(graphId) {
	if (!graphId) return getSelectedGraphs();

	const selectedGraphs = getSelectedGraphs();

	if (!selectedGraphs.includes(graphId)) {
		selectedGraphs.push(graphId);
		return selectedGraphs;
	}

	if (selectedGraphs.length === 1) {
		return selectedGraphs;
	}

	const removeIndex = selectedGraphs.indexOf(graphId);
	selectedGraphs.splice(removeIndex, 1);

	return selectedGraphs;
}

export function updateCurrentGraph({ graphId, graphName }) {
	if (!graphId) return;

	Heriverse.currGraphId = graphId;
	Heriverse.currGraphName = graphName || "";
}

export function getGraphSelectionLabel({ selectedGraphName = "" } = {}) {
	const selectedGraphs = getSelectedGraphs();

	if (selectedGraphs.length > 1) {
		return selectedGraphs.length + " grafi attivi";
	}

	if (selectedGraphs.length === 1) {
		return selectedGraphName || Heriverse.currGraphName || "";
	}

	return "";
}

export function getGraphSelectorButtonText(graphsCollection = []) {
	const selectedGraphs = getSelectedGraphs();

	if (selectedGraphs.length > 1) {
		return selectedGraphs.length + " grafi attivi";
	}

	const selectedGraphId = selectedGraphs[0] || getCurrentGraphId();

	return (
		getGraphNameFromCollection(graphsCollection, selectedGraphId) || getCurrentGraphName() || ""
	);
}

export function getGraphNameFromCollection(graphsCollection = [], graphId = "") {
	const graphIndex = graphsCollection.findIndex((graph) => graph.id === graphId);

	if (graphIndex < 0) return "";

	const graph = graphsCollection[graphIndex];

	return graph.name || "GRAPH " + (graphIndex + 1);
}

export function applyGraphSelection({ graphId, graphName, graphsCollection = [] }) {
	const selectedGraphs = toggleGraphSelection(graphId);

	let label = "";

	if (selectedGraphs.length === 1) {
		const selectedGraphId = selectedGraphs[0];

		const selectedGraphName =
			getGraphNameFromCollection(graphsCollection, selectedGraphId) || graphName || "";

		updateCurrentGraph({
			graphId: selectedGraphId,
			graphName: selectedGraphName,
		});

		label = selectedGraphName;
	} else {
		label = getGraphSelectionLabel();
	}

	return {
		selectedGraphs,
		label,
	};
}

export function refreshSceneAfterGraphSelection() {
	Heriverse.setScene();
}

export function refreshWorkspaceAfterGraphSelection() {
	if (!AppModeViewModel.isEditorMode()) return;

	populateWorkspace();
}
