import HeriverseEvents from "../src/HeriverseEvents.js";
import HeriverseGraph from "../src/HeriverseGraph/HeriverseGraph.js";
import HeriverseNode from "../src/HeriverseGraph/HeriverseNode.js";
import { namePrefix } from "./Editor.js";
import EditorUI from "./editorUI.js";
import { generateFieldHTML } from "./modalFieldRenderer.js";
import { getModalSteps } from "./modalSteps_config.js";

function compileFieldsToEdit(node, containerId) {
	const modal = document.getElementById(containerId);
	const modalBody = modal.querySelector(".modal-body");
	const inputForms = modalBody.querySelectorAll("input, textarea, select, div[id$='Info']");

	[...inputForms].forEach((inputElem) => {
		const handler = getFieldCompiler(inputElem.id || "");
		if (handler) handler(inputElem, node, modalBody);
	});
}

const FIELD_COMPILERS = [
	[
		"Name",
		(inputElem, node) => {
			inputElem.value = node.name ?? "";
		},
	],
	[
		"Description",
		(inputElem, node) => {
			inputElem.value = node.description || node.data?.description || "";
		},
	],
	[
		"TypeSelect",
		(inputElem, node) => {
			inputElem.selectedIndex = [...inputElem.options].findIndex(
				(option) =>
					(node.type === HeriverseNode.NODE_TYPE.LINK &&
						option.textContent === node.data?.url_type) ||
					option.textContent === node.type
			);
		},
	],
	[
		"StartTime",
		(inputElem, node) => {
			inputElem.value = node.data?.start_time ?? "";
		},
	],
	[
		"EndTime",
		(inputElem, node) => {
			inputElem.value = node.data?.end_time ?? "";
		},
	],
	[
		"Color",
		(inputElem, node) => {
			inputElem.value = node.data?.color ?? "";
		},
	],
	[
		"MinY",
		(inputElem, node) => {
			inputElem.value = node.data?.min_y ?? "";
		},
	],
	[
		"MaxY",
		(inputElem, node) => {
			inputElem.value = node.data?.max_y ?? "";
		},
	],
	[
		"FileText",
		(inputElem, node) => {
			inputElem.value = node.data?.url ?? "";
		},
	],
	[
		"Info",
		(inputElem, node, modalBody) => {
			const liElements = inputElem.querySelectorAll("ul li");
			const elementToSelect = [...liElements].find((liElement) =>
				node.name?.includes(liElement.textContent.trim())
			);

			if (elementToSelect) EditorUI.selectPropertyType(elementToSelect);

			prependNodeSummary(modalBody, node);
		},
	],
	[
		"License",
		(inputElem, node) => {
			inputElem.value = node.license ?? "";
		},
	],
	[
		"Authors",
		(inputElem, node) => {
			inputElem.value = Array.isArray(node.authors) ? node.authors.join(",") : "";
		},
	],
	[
		"Embargo",
		(inputElem, node) => {
			inputElem.value = node.embargo_until ?? "";
		},
	],
];

function getFieldCompiler(inputId) {
	const entry = FIELD_COMPILERS.find(([key]) => inputId.includes(key));
	return entry ? entry[1] : null;
}

function prependNodeSummary(modalBody, node) {
	if (modalBody.querySelector(".node-summary-name")) return;

	const nameSpan = buildSummarySpan("node-summary-name", "Name: " + (node.name ?? ""));
	const descriptionSpan = buildSummarySpan(
		"node-summary-description",
		"Description: " + (node.description ?? "")
	);

	modalBody.prepend(descriptionSpan);
	modalBody.prepend(nameSpan);
}

function buildSummarySpan(extraClass, text) {
	const span = document.createElement("span");
	span.classList.add(
		extraClass,
		"w-100",
		"fs-6",
		"text-center",
		"my-2",
		"d-flex",
		"justify-content-center"
	);
	span.innerHTML = text;
	return span;
}

function saveNodeInformation() {
	$("#idLoader").show();

	const ctx = getSaveNodeContext(this);
	const draft = collectNodeDraft(ctx);

	if (!validateNodeDraft(draft)) return;

	const updatedNode = buildUpdatedNode(ctx, draft);
	persistUpdatedNode(ctx, updatedNode, draft);

	bootstrap.Modal.getOrCreateInstance(ctx.modal).hide();
}

function getSaveNodeContext(doneButton) {
	const modal = doneButton.closest(".modal");
	const modalBody = modal.querySelector(".modal-body");
	const nodeId = modalBody.dataset.nodeid;
	const node = nodeId ? Heriverse.currMG.nodesByIndex[nodeId] : null;
	const nodeType = node ? node.type : Heriverse.getNodeTypeByCRNodeType(modalBody.dataset.type);

	const inputForms = modalBody.querySelectorAll("input, textarea, select, div[id$='Info'], ul");

	return {
		modal,
		modalBody,
		node,
		nodeType,
		inputForms,
		isNewNode: modalBody.dataset.newNode === "true",
	};
}

function createNodeDraft(node) {
	return {
		name: "",
		description: node?.description ?? "",
		data: {},
		type: "",
		license: node?.license ?? "",
		authors: node?.authors ?? [],
		embargo: node?.embargo_until ?? "",
		graph: node?.graph ?? Heriverse.currGraphId,
	};
}

function collectNodeDraft(ctx) {
	const draft = createNodeDraft(ctx.node);

	[...ctx.inputForms].forEach((input) => applyInputToDraft(input, ctx, draft));

	return draft;
}

function applyInputToDraft(input, ctx, draft) {
	const id = input.id || "";

	if (id.includes("Name")) {
		draft.name = input.value;
		return;
	}

	if (id.includes("Description")) {
		if (ctx.nodeType === HeriverseNode.NODE_TYPE.LINK) draft.data.description = input.value;
		else draft.description = input.value;
		return;
	}

	if (id.includes("TypeSelect")) {
		draft.type = input.value;
		return;
	}

	if (id.includes("Relate")) {
		handleRelateField(input, ctx, draft);
		return;
	}

	if (id.includes("Color")) {
		draft.data.color = input.value;
		return;
	}

	if (id.includes("StartTime")) {
		draft.data.start_time = input.value;
		return;
	}

	if (id.includes("EndTime")) {
		draft.data.end_time = input.value;
		return;
	}

	if (id.includes("MinY")) {
		draft.data.min_y = input.value;
		return;
	}

	if (id.includes("MaxY")) {
		draft.data.max_y = input.value;
		return;
	}

	if (id.includes("Info")) {
		handlePropertyInfoField(input, draft);
		return;
	}

	if (id.includes("Checklist")) {
		handleChecklistField(input);
		return;
	}

	if (id.includes("License")) {
		draft.license = input.value;
		return;
	}

	if (id.includes("Authors")) {
		draft.authors = input.value
			.split(",")
			.map((author) => author.trim())
			.filter(Boolean);
		return;
	}

	if (id.includes("Embargo")) {
		draft.embargo = input.value;
		return;
	}

	if (id.includes("FileText")) {
		draft.data.url = input.value;
		draft.data.url_type = "External Link";
		return;
	}

	if (id.includes("Files")) {
		draft.data.url = Editor.uploadResource(input.files);
		draft.data.url_type = "Link";
	}
}

function handleRelateField(input, ctx, draft) {
	if (ctx.nodeType !== HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE) return;

	const selectedOption = input.options[input.selectedIndex];
	const stratigraphicNode = Heriverse.currMG.nodesByIndex[selectedOption.dataset.id];

	const pL = [...ATON.SemFactory.convexPoints];

	ATON.SemFactory.createConvexShape(stratigraphicNode.name, ATON.SemFactory.convexPoints);

	draft.name = namePrefix + stratigraphicNode.name;
	draft.data = {
		url: "",
		convexshape: pL,
		speres: [],
	};
	draft.license = stratigraphicNode.license;
	draft.authors = stratigraphicNode.authors;
	draft.embargo = stratigraphicNode.embargo_until;
	draft.graph = stratigraphicNode.graph;

	ATON.SemFactory.stopCurrentConvex();
	Editor.semanticShapeDrawingActive = false;
	document.getElementById("finalizeSemanticShapeDrawing").disabled = true;
	document.getElementById("startSemanticShapeDrawing")?.classList.remove("active");
}

function handlePropertyInfoField(input, draft) {
	draft.name = input.querySelector("#propType-dropdownMenu").textContent;
	draft.description = "";

	const parts = input.querySelectorAll(
		"#propInput-section input, #propInput-section select, #propInput-section label"
	);

	[...parts].forEach((elem) => {
		if (elem.tagName === "LABEL") draft.description += elem.textContent + " ";
		if (elem.tagName === "INPUT") draft.description += elem.value + " ";
		if (elem.tagName === "SELECT") {
			draft.description += elem.options[elem.selectedIndex].value + " ";
		}
	});

	draft.description = draft.description.trim();
}

function handleChecklistField(input) {
	const checkedEpochs = input.querySelectorAll("ul input[type=checkbox]:checked");
	const nodesChecked = [...checkedEpochs].map(
		(checkedItem) => Heriverse.currMG.nodesByIndex[checkedItem.dataset.id]
	);

	if (singleStep.checkedList[0].dataset.type === HeriverseNode.TYPE.EPOCHS) {
		nodesChecked.sort((a, b) => a.data.start_time - b.data.start_time);

		nodesChecked.forEach((nodeChecked, index) => {
			Heriverse.currMG.newEdge(
				null,
				concreteNode,
				nodeChecked,
				index === 0
					? HeriverseNode.RELATIONS.HAS_FIRST_EPOCH
					: HeriverseNode.RELATIONS.SURVIVE_IN_EPOCH
			);
		});
	}
}

function validateNodeDraft(draft) {
	if (draft.data.start_time && draft.data.end_time && draft.data.start_time > draft.data.end_time) {
		alert("L'inizio dell'epoca è successivo alla fine. Inserisci informazioni consistenti.");
		$("#idLoader").hide();
		return false;
	}

	return true;
}

function buildUpdatedNode(ctx, draft) {
	const isNewSemanticShape =
		ctx.isNewNode && ctx.nodeType === HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE;

	const updatedNode = new HeriverseNode();

	if (ctx.node) {
		updatedNode.neighbors = ctx.node.neighbors;
		updatedNode.edges = ctx.node.edges;
	}

	updatedNode.setNodeInfo(
		isNewSemanticShape ? null : ctx.node ? ctx.node.id : null,
		draft.type || ctx.nodeType || ctx.node?.type || null,
		draft.name || ctx.node?.name || null,
		draft.description,
		Object.keys(draft.data).length ? draft.data : ctx.node?.data || {},
		draft.license,
		draft.authors,
		draft.embargo,
		draft.graph
	);

	return updatedNode;
}

function persistUpdatedNode(ctx, updatedNode) {
	Heriverse.currMG.newNode(updatedNode);

	if (ctx.isNewNode && ctx.nodeType === HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE) {
		const relateSelect = [...ctx.inputForms].find((input) => input.id?.includes("Relate"));
		const selectedOption = relateSelect.options[relateSelect.selectedIndex];
		const stratigraphicNode = Heriverse.currMG.nodesByIndex[selectedOption.dataset.id];

		Heriverse.currMG.newEdgeFromIds(
			null,
			stratigraphicNode.id,
			updatedNode.id,
			HeriverseNode.RELATIONS.HAS_SEMANTIC_SHAPE
		);
	}

	Heriverse.syncGraphJSONToScene();

	Heriverse.setState({
		tempFilter: Heriverse.currTemporalFilter,
		graphId: Heriverse.currGraphId,
		selectedNode: Editor.state.legalSelectedNode ? Editor.state.legalSelectedNode : null,
	});

	Heriverse.setScene();
}

export function setupEditCreateModal(nodeType, node = null, containerId = "createEditNode") {
	const modal = document.getElementById(containerId);
	const modalBody = modal.querySelector(".modal-body");
	const modalTitle = modal.querySelector(".modal-title");

	const modalConfig = getModalConfigByNodeType(nodeType);
	if (!modalConfig) return console.error("Config for modal not exists!");

	renderModalHeader(modalTitle, modalConfig);
	setModalBodyDataset(modalBody, nodeType, node);
	renderModalBody(modalBody, modalConfig);

	if (node) {
		compileFieldsToEdit(node, containerId);
	}

	bindSaveButton(containerId);

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
}

function getModalConfigByNodeType(nodeType) {
	const connectionRuleType = Heriverse.getCRNodeTypeByNodeType(nodeType);

	return getModalSteps().find((step) => step.node_type === connectionRuleType);
}

function renderModalHeader(modalTitle, modalConfig) {
	modalTitle.textContent = modalConfig.title;
	modalTitle.dataset.i18n = modalConfig.i18n_label;
}

function setModalBodyDataset(modalBody, nodeType, node) {
	delete modalBody.dataset.nodeid;
	delete modalBody.dataset.newNode;

	if (node) modalBody.dataset.nodeid = node.id;
	else modalBody.dataset.newNode = true;

	modalBody.dataset.type = nodeType;
}

function renderModalBody(modalBody, modalConfig) {
	modalBody.innerHTML = modalConfig.fields
		.filter(shouldRenderField)
		.map((field) => generateFieldHTML(field))
		.join("");
}

function shouldRenderField(field) {
	return !(
		(field.id.includes("Select") && !field.id.includes("TypeSelect")) ||
		field.id.includes("Checklist")
	);
}

function bindSaveButton(containerId) {
	$("#" + containerId + " #doneButton")
		.off("click", saveNodeInformation)
		.on("click", saveNodeInformation);
}
