import HeriverseNode from "../src/HeriverseGraph/HeriverseNode.js";
import { setupEditCreateModal } from "./editCreateNodeModal.js";

export function setupWorkspace() {
	if (!Heriverse?.currMG?.nodesByIndex) return;

	const workTypeSelectorSection = document.getElementById("workspace-panel-type-selector");
	const workTypeBodySection = document.getElementById("workspace-panel-body");

	const nodeTypes = [
		...new Set(
			Object.values(Heriverse.currMG.nodesByIndex)
				.filter((node) => node.graph !== "shelf")
				.map((node) => node.type)
		),
	];

	const options = [
		"<option value='all' selected>Tutti i tipi</option>",
		"<option value='stratigraphic'>Stratigraphic</option>",
		...nodeTypes.map((type) => {
			const label = type
				.split("_")
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(" ");
			return `<option value="${type}">${label}</option>`;
		}),
	];

	workTypeSelectorSection.innerHTML = `
        <select id="workspace-panel-selector" class="form-select" aria-label="Tipo di nodo">
            ${options.join("")}
        </select>
    `;

	workTypeBodySection.innerHTML = `
        <div id="workspace-panel-main" role="tabpanel">
            <ul id="workspace-panel-list" class="list-group"></ul>
        </div>
    `;

	$(document)
		.off("change", "#workspace-panel-selector", Editor.applyWorkspaceFilter)
		.on("change", "#workspace-panel-selector", Editor.applyWorkspaceFilter);

	$(document)
		.off("input", "#workspace-panel-searchbar-text", Editor.applyWorkspaceFilter)
		.on("input", "#workspace-panel-searchbar-text", Editor.applyWorkspaceFilter);
}

export function populateWorkspace() {
	if (!Heriverse?.currMG?.nodesByIndex) return;

	const ul = document.getElementById("workspace-panel-list");
	if (!ul) return;

	const items = [];

	Object.entries(Heriverse.currMG.nodesByIndex).forEach(([nodeId, node]) => {
		if (!Heriverse.currentGraphs.includes(node.graph)) return;
		if (node.graph === "shelf") return;

		let item = Editor.EditorUI.createWorkspacePanelElement(toWorkspaceNodeViewModel(node), {
			isEditor: Heriverse.MODE === Heriverse.MODETYPES.EDITOR,
		});

		items.push(item);
	});

	ul.innerHTML = items.join("");

	Editor.applyWorkspaceFilter();

	$(".semantic-shape-badge").off("click", highlightSemNode).on("click", highlightSemNode);

	$(document)
		.off("click", ".workspace-remove-button", deleteNodeWorkspace)
		.on("click", ".workspace-remove-button", deleteNodeWorkspace);

	$(document)
		.off("click", ".workspace-edit-button", editNodeWorkspace)
		.on("click", ".workspace-edit-button", editNodeWorkspace);
}

export function applyWorkspaceFilter() {
	const selected = document.getElementById("workspace-panel-selector")?.value || "all";
	const search = (
		document.getElementById("workspace-panel-searchbar-text")?.value || ""
	).toLowerCase();

	document.querySelectorAll("#workspace-panel-list > li").forEach((li) => {
		const type = li.dataset.bsType;
		const isStratigraphic = li.dataset.stratigraphic === "1";
		const name = normalizeForSearch(li.dataset.bsName);

		const matchType =
			selected === "all" || (selected === "stratigraphic" && isStratigraphic) || selected === type;

		const matchSearch = !search || name.includes(search);

		li.classList.toggle("d-none", !(matchType && matchSearch));
	});
}

function normalizeForSearch(s) {
	return (s ?? "")
		.toString()
		.trim()
		.toLowerCase()
		.replace(/[’‘`]/g, "'")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\s+/g, " ");
}

function highlightSemNode(e) {
	e.stopPropagation();

	let semanticShapeId = this.dataset.ssid;
	if (semanticShapeId.includes("_shape")) semanticShapeId = semanticShapeId.split("_shape")[0];

	const semanticNode = ATON.semnodes?.[semanticShapeId];

	if (!semanticNode) return;

	semanticNode.highlight();
}

function deleteNodeWorkspace(e) {
	e.stopPropagation();
	const nodeId = this.closest("li").dataset.bsElementid;
	const node = Heriverse.currMG.nodesByIndex[nodeId];

	if (!node) return;

	if (!confirm("Vuoi eliminare il nodo " + node.name + "?")) return;

	const deleted = Heriverse.currMG.deleteNode(nodeId);

	if (!deleted) return;

	Heriverse.syncGraphJSONToScene();

	Heriverse.setState({
		tempFilter: Heriverse.currTemporalFilter,
		graphId: Heriverse.currGraphId,
		selectedNode: Editor.state.legalSelectedNode ? Editor.state.legalSelectedNode : null,
	});

	Heriverse.loadEM(null, false, true);

	populateWorkspace();
}

function editNodeWorkspace(e) {
	e.stopPropagation();
	const nodeId = this.closest("li").dataset.bsElementid;
	const node = Heriverse.currMG.nodesByIndex[nodeId];
	setupEditCreateModal(node.type, node);

	const modal = document.getElementById("createEditNode");
	bootstrap.Modal.getOrCreateInstance(modal).show();
}

function isLinkTypeNode(type) {
	const TYPES = ["image", "3d_model", "doc"];

	return TYPES.includes(type) ? "link" : type;
}

function toWorkspaceNodeViewModel(node) {
	const semanticShape = Object.values(
		node.getNeighborsByType?.(HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE) || {}
	)[0];
	const nType = isLinkTypeNode(node.type);

	return {
		id: node.id,
		name: node.name,
		type: nType,
		iconType: Heriverse.NODETYPES[nType?.toUpperCase()] || nType?.toUpperCase(),
		isStratigraphic: HeriverseNode.STRATIGRAPHIC_TYPE
			? Object.values(HeriverseNode.STRATIGRAPHIC_TYPE).includes(nType)
			: false,
		hasSemanticShape: !!semanticShape,
		semanticShapeId: semanticShape?.id || null,
		iconUrl: `${Utils.baseUrl}/res/graphicons/${nType}.svg`,
		fallbackIconUrl: `${Utils.baseUrl}/res/graphicons/generic_node.svg`,
		rawNode: node,
	};
}
