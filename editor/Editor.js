"use strict";
import HeriverseNode from "../src/HeriverseGraph/HeriverseNode.js";
import HeriverseEvents from "../src/HeriverseEvents.js";

/**
@namespace Editor
*/
import EditorUI from "./editorUI.js";
import { getModalSteps } from "./modalSteps_config.js";
import { setupEditCreateModal } from "./editCreateNodeModal.js";
import { setupModalSteps } from "./pathCreationWizard.js";
import { populateShelfPanel, setupShelf, updateInScenePanel } from "./shelfPanel.js";
import { applyWorkspaceFilter, populateWorkspace, setupWorkspace } from "./workspacePanel.js";
import { getPeriodFilterElementsFromEvent } from "../src/periodFilterDOM.js";
import HeriverseGraph from "../src/HeriverseGraph/HeriverseGraph.js";

let Editor = {};
let epoch = null;

Editor.state = {
	currShelfElement: null,
	currWorkspaceElement: null,
	currSelectedNode: null,
	legalSelectedNode: null,
	addFromScene: false,
	closedSRModal: false,
	lastWorkspaceX: null,
	lastWorkspaceY: null,
};

export let selectedVisual = null;

Editor._grid = null;

Editor.semanticShapeDrawingActive = false;

let setupPanels = false,
	setupShelfResMB = false;

Editor.modal_steps = undefined;

window.Editor = Editor;
Editor.currentOperation;
Editor.currObj;
Editor.EditorUI = EditorUI;
EditorUI.setHandlers({
	saveEpoch: (values) => {
		Editor.addEpoch(
			values.id,
			values.name,
			values.description,
			values.start_time,
			values.end_time,
			values.color,
			values.min_y,
			values.max_y
		);
	},
	saveDocumentShelf: (values) => {
		Editor.addDocumentToShelf(values.id, values.name, values.description, values.url, values.files);
	},
	saveImageShelf: (values) => {
		Editor.addImageToShelf(values.id, values.name, values.description, values.url, values.files);
	},
	saveRepresentationModel: (values, shelf = false) => {
		$("#idLoader").show();

		Editor.addRepresentationModel(
			values.id,
			values.name,
			values.description,
			values.url,
			values.files,
			shelf
		);
	},
	saveAuthor: (values) => {
		Editor.addAuthor(
			values.id,
			values.name,
			values.description,
			values.orcid,
			values.author_name,
			values.author_surname
		);
	},
	saveLink: (values) => {
		Editor.addLink(
			values.id,
			values.name,
			values.description,
			values.url,
			null,
			values.url_type,
			values.description_link
		);
	},
	saveSemanticShape: (values) => {
		Editor.addSemantiShape(values.id, values.name, values.description, values.url);
	},
	saveStratigraphicNode: (values) => {
		Editor.addStratigraphic(values.id, values.type, values.name, values.description);
	},
	saveNode: (values) => {
		Editor.addNode(
			values.id,
			values.type,
			values.name,
			values.description,
			{},
			Heriverse.currGraphId,
			false
		);
	},
	saveGraph: (values) => {
		Editor.createGraph(values);
	},
	saveEdge: (values) => {
		Editor.addEdge(values);
	},
	saveGraphState: () => {
		if (Editor.state.currSelectedNode) {
			Editor.gizmo.controlInstance.detach();
		}

		Editor.state.currSelectedNode = null;

		if (Editor.semanticShapeDrawingActive) ATON.fire("SemanticShapeDrawingMode", true);

		Editor.send(Heriverse.ResourceScene);
	},
	exportGraphState: () => {
		HeriverseImportExport.exportResourceJSON();
	},
	exportSemShape: () => {
		Editor.setupExportSemShapeModal();
	},
	finalizeExportSemShape: (semanticShapeIds) => {
		Editor.exportSemShapesById(semanticShapeIds);
	},
	updateSelectedNodeTransform: ({ transformKey, axis, value }) => {
		const node = Editor.state.currSelectedNode;
		if (!node) return;

		node[transformKey][axis] = value;
		refreshSelectionVisual();
	},
	savePeriod: (values) => {
		Editor.savePeriod(values);
	},
	getEdgeCompatibilityOptions: (edgeType) => {
		return Editor.getEdgeCompatibilityOptions(edgeType);
	},
	getCurrentGraphDefaults: () => {
		return Editor.getCurrentGraphDefaults();
	},
	getPropertyQualiumById: (qualiumId) => {
		return Editor.getPropertyQualiumById(qualiumId);
	},
	getStratigraphicNodeTypes: () => {
		return Editor.getStratigraphicNodeTypes();
	},
	getAvailableEdgeTypes: () => {
		return Editor.getAvailableEdgeTypes();
	},
	getConnectionRuleNodeTypes: () => {
		return Editor.getConnectionRuleNodeTypes();
	},
	getConnectionRuleNodeType: (key) => {
		return Editor.getConnectionRuleNodeType(key);
	},
});

Editor.gizmo = {
	onDraggingChange: (e) => {
		if (ATON.Nav._controls) {
			ATON.Nav._controls.enabled = !e.value;
		}

		EditorUI.updateTransformationInputs(Editor.state.currSelectedNode);

		const scene_node = e.target._gizmo.object;

		const objectDataOPC = {
			objectName: scene_node.name,
			objectType: scene_node.type,
			position: scene_node.position.clone(),
			rotation: scene_node.rotation.clone(),
			scale: scene_node.scale.clone(),
		};

		const dataOPC = {
			event: HeriverseEvents.Events.OBJECT_POSITION_CHANGE,
			object: objectDataOPC,
		};
		ATON.fireEvent(HeriverseEvents.Events.PHOTON_EVENT, dataOPC);
	},
	onChangeGizmo: () => {
		refreshSelectionVisual();
		ATON._renderer.render(ATON._mainRoot, ATON.Nav._camera);
	},
	cycleGizmoMode: () => {
		Editor.gizmo.modeIndex = (Editor?.gizmo?.modeIndex + 1) % Editor?.gizmo?.modes.length;
		updateGizmoMode(Editor.state.currSelectedNode);
	},
	controlInstance: null,
	initControls: () => {
		if (Editor.gizmo.controlInstance) return;

		Editor.gizmo.controlInstance = new THREE.TransformControls(
			ATON.Nav._camera,
			ATON._renderer.domElement
		);
	},
	modes: ["translate", "rotate", "scale", null],
	modeIndex: 3,
};

Editor.init = () => {
	if (!Editor.modal_steps) Editor.modal_steps = getModalSteps();

	if (!setupPanels) {
		Editor.setupEventHandlers();
		Editor.setupShelf();
		setupPanels = true;
	}
	Editor.populateShelfPanel();
	Editor.setupWorkspace();
	Editor.populateWorkspace();

	if (!setupShelfResMB) {
		EditorUI.setupShelfResManageButtons();
		setupShelfResMB = true;
	}

	ATON.Nav._camera.position.set(8, 8, 8);
	ATON.Nav._camera.lookAt(0, 0, 0);

	Editor.gizmo.initControls();

	if (Editor.shelf_objects_in_scene && Editor.shelf_objects_in_scene.length) {
		Editor.shelf_objects_in_scene.forEach((n) => n.attachTo(Heriverse.currTemporalFilter.id));

		Editor.setupGizmoListeners();

		if (Heriverse.selectedNodeToRestore) {
			Editor.setSelectedNode(Heriverse.selectedNodeToRestore);
			console.log("VISUAL SELECTED", selectedVisual);
		}
	}

	// Add grid helper
	Editor._grid = new THREE.GridHelper(50, 50);
	Editor._grid.raycast = ATON.Utils.VOID_CAST;
	ATON.getRootScene().add(Editor._grid);

	ATON.SceneHub._bEdit = true;
};

Editor.setupGizmoListeners = () => {
	if (!Editor.gizmo.controlInstance) return;

	Editor.gizmo.controlInstance.removeEventListener(
		"dragging-changed",
		Editor.gizmo.onDraggingChange
	);
	Editor.gizmo.controlInstance.removeEventListener("change", Editor.gizmo.onChangeGizmo);

	Editor.gizmo.controlInstance.addEventListener("dragging-changed", Editor.gizmo.onDraggingChange);
	Editor.gizmo.controlInstance.addEventListener("change", Editor.gizmo.onChangeGizmo);
};

Editor.shelf_objects_in_scene = [];

Editor.setupShelf = setupShelf;

Editor.populateShelfPanel = populateShelfPanel;

function updateGizmoMode(currNode) {
	ATON._mainRoot.remove(Editor.gizmo.controlInstance.getHelper());

	const mode = Editor?.gizmo?.modes[Editor?.gizmo?.modeIndex];
	if (currNode && mode) {
		Editor.gizmo.controlInstance.enabled = true;
		Editor.gizmo.controlInstance.setMode(mode);
		Editor.gizmo.controlInstance.attach(currNode);
		ATON._mainRoot.add(Editor.gizmo.controlInstance.getHelper());
	} else {
		Editor.gizmo.controlInstance.enabled = false;
		Editor.gizmo.controlInstance.detach();
	}
}

function clearSelectionVisual() {
	if (!selectedVisual) return;

	selectedVisual.removeFromParent?.();
	selectedVisual.geometry?.dispose?.();

	if (Array.isArray(selectedVisual.material)) {
		selectedVisual.material.forEach((m) => m?.dispose?.());
	} else {
		selectedVisual.material?.dispose?.();
	}

	selectedVisual = null;
}

function refreshSelectionVisual() {
	if (!Editor.state.currSelectedNode || !selectedVisual) return;

	Editor.state.currSelectedNode.updateWorldMatrix?.(true, true);
	selectedVisual.update();
}

Editor.setSelectedNode = (node, options = {}) => {
	const { resetMode = true, updateTransformPanel = true, clearTransformPanel = true } = options;

	if (!node) {
		Editor.state.currSelectedNode = null;
		Editor.gizmo.modeIndex = 3;

		Editor.gizmo.controlInstance.detach();
		ATON._mainRoot.remove(Editor.gizmo.controlInstance.getHelper());

		clearSelectionVisual();
		EditorUI.updateSelectedNodeSection(Editor.state.currSelectedNode?.name ?? "");

		if (clearTransformPanel) {
			EditorUI.clearTransformationInputs();
		}

		return;
	}

	if (Editor.state.currSelectedNode !== node) {
		Editor.gizmo.controlInstance.detach();
	}

	Editor.state.currSelectedNode = node;

	if (resetMode) {
		Editor.gizmo.modeIndex = 0;
	}

	updateSelectionVisual(Editor.state.currSelectedNode);
	updateGizmoMode(Editor.state.currSelectedNode);

	if (updateTransformPanel) {
		EditorUI.updateTransformationInputs(Editor.state.currSelectedNode);
	}

	EditorUI.updateSelectedNodeSection(Editor.state.currSelectedNode?.name ?? "");
};

function updateSelectionVisual(node) {
	clearSelectionVisual();

	if (!node) return;

	node.updateWorldMatrix?.(true, true);

	selectedVisual = new THREE.BoxHelper(node, 0x00ffff);
	selectedVisual.userData.isSelectionVisual = true;

	ATON._mainRoot.add(selectedVisual);
}

const shelfElementPointer = new THREE.Vector2();

Editor.updateInScenePanel = updateInScenePanel;

Editor.setupWorkspace = setupWorkspace;

Editor.populateWorkspace = populateWorkspace;

Editor.applyWorkspaceFilter = applyWorkspaceFilter;

function isHeriNodeEqualAtonNode(heriNode, atonNode) {
	return (
		heriNode &&
		atonNode &&
		heriNode.data &&
		atonNode.userData &&
		heriNode.data.url &&
		atonNode.userData.urlContent &&
		heriNode.data.url === atonNode.userData.urlContent &&
		heriNode.data.url_type &&
		atonNode.userData.contType &&
		heriNode.data.url_type === atonNode.userData.contType &&
		heriNode.name &&
		atonNode.userData.contName &&
		heriNode.name === atonNode.userData.contName &&
		heriNode.data.description &&
		atonNode.userData.contDescription &&
		heriNode.data.description === atonNode.userData.contDescription
	);
}

export const namePrefix = "Shape for ";

Editor.getExportableSemanticShapes = () => {
	return Object.values(Heriverse.currMG.proxyNodes || {})
		.map((proxy) => proxy.shape)
		.filter(Boolean)
		.map((shape) => ({ id: shape.id, name: shape.name }));
};

Editor.setupExportSemShapeModal = () => {
	const semShapes = Editor.getExportableSemanticShapes();

	if (!semShapes.length) {
		alert("There is no semantic mask in this period.");
		return;
	}

	EditorUI.showExportSemanticShapeModal(semShapes);
};

Editor.exportSemShapesById = (semanticShapeIds) => {
	const semShapeToExport = {};

	semanticShapeIds.forEach((shapeId) => {
		const semanticShape = Heriverse.currMG.nodesByIndex[shapeId];

		if (!semanticShape) return;

		const atonSemNodeId = semanticShape.name.includes(namePrefix)
			? semanticShape.name.split(namePrefix)[1]
			: semanticShape.name;

		const atonSemNode = ATON.getSemanticNode(atonSemNodeId);

		if (atonSemNode) {
			semShapeToExport[semanticShape.id] = atonSemNode;
			console.log("ATON SEM NODE", atonSemNode);
		}
	});

	if (!Object.keys(semShapeToExport).length) {
		alert("No semantic mask selected.");
		return;
	}

	HeriverseImportExport.exportNodesAsZip(semShapeToExport);
};

Editor.addDocumentToShelf = (id, name, description, url, file) => {
	let data = {};
	if (file.length > 0) {
		let uploaded_url = Editor.uploadResource(file, "document");

		data.url = uploaded_url;
	} else {
		data.url = url;
	}

	data.url_type = "document";
	data.description = description;

	if (!Heriverse.shelf) Heriverse.shelf = new Heriverse.ShelfGraph("", Heriverse.currMG.json);
	Editor.addNode(id, HeriverseNode.NODE_TYPE.LINK, name, "", data, "shelf", true);
};

Editor.addImageToShelf = (id, name, description, url, file) => {
	let data = {};
	if (file.length > 0) {
		let uploaded_url = Editor.uploadResource(file, "image");

		data.url = uploaded_url;
	} else {
		data.url = url;
	}

	data.url_type = "image";
	data.description = description;

	if (!Heriverse.shelf) Heriverse.shelf = new Heriverse.ShelfGraph("", Heriverse.currMG.json);
	Editor.addNode(id, HeriverseNode.NODE_TYPE.LINK, name, "", data, "shelf", true);
};

Editor.addRepresentationModel = (id, name, description, url, file, shelf = false) => {
	let data = {};
	if (file.length > 0) {
		let uploaded_url = Editor.uploadResource(file, "3d_model");

		data.url = uploaded_url;
	} else {
		data.url = url;
	}

	if (shelf) {
		data.url_type = "3d_model";
		data.description = description;
	}
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL,
		name,
		description,
		data,
		shelf ? "shelf" : Heriverse.currGraphId,
		shelf
	);
};

Editor.addEpoch = (id, name, description, start_time, end_time, color, min_y, max_y) => {
	let data = {};
	data.start_time = start_time;
	data.end_time = end_time;
	data.color = color;
	data.min_y = min_y;
	data.max_y = max_y;

	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.EPOCH,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addAuthor = (id, name, description, orcid, author_name, author_surname) => {
	let data = {};
	data.orcid = orcid;
	data.name = author_name;
	data.surname = author_surname;
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.AUTHOR,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addStratigraphic = (id, type, name, description) => {
	let data = {};
	let node = new HeriverseNode();
	node.setNodeInfo(id, type, name, description, data);
	Heriverse.currMG.newStratigraphicNode(node);
	Heriverse.syncGraphJSONToScene();

	Heriverse.setScene();
};

Editor.addGroup = (id, name, description) => {
	let data = {};
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.GROUP,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addProperty = (id, name, description) => {
	let data = {};
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.PROPERTY,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addDocument = (id, name, description) => {
	let data = {};
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.DOCUMENT,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addExtractor = (id, name, description) => {
	let data = {};
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.EXTRACTOR,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addCombiner = (id, name, description) => {
	let data = {};
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.COMBINER,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addLink = (id, name, description, url, file, url_type, data_description) => {
	let data = {};
	((data.url = url), (data.url_type = url_type));
	data.description = data_description;
	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.LINK,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addSemantiShape = (
	id,
	name,
	description,
	url,
	file = null,
	convexshapes = [],
	spheres = []
) => {
	let data = {};
	data.url = url;
	data.convexshapes = convexshapes;
	data.spheres = spheres;

	Editor.addNode(
		id,
		HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE,
		name,
		description,
		data,
		Heriverse.currGraphId,
		false
	);
};

Editor.addNode = (id, type, name, description, data, graph = "shelf", shelf = false) => {
	let node;
	if (shelf) {
		Heriverse.shelf.addShelfNode(id, type, name, data);
		Heriverse.Scene.multigraph.graphs[graph] = Heriverse.shelf.json.graphs[graph];
		Heriverse.ResourceScene.resource_json.multigraph.graphs[graph] =
			Heriverse.shelf.json.graphs[graph];

		Editor.populateShelfPanel();

		$("#idLoader").hide();
	} else {
		let default_authors = Heriverse.currMG.json.graphs[graph].defaults
			? Heriverse.currMG.json.graphs[graph].defaults.authors
			: [];
		let default_license = Heriverse.currMG.json.graphs[graph].defaults
			? Heriverse.currMG.json.graphs[graph].defaults.license
			: "";
		let default_embargo_until = Heriverse.currMG.json.graphs[graph].defaults
			? Heriverse.currMG.json.graphs[graph].defaults.embargo_until
			: "";
		node = new HeriverseNode();
		node.setNodeInfo(
			id,
			type,
			name,
			description,
			data,
			default_license,
			default_authors,
			default_embargo_until,
			graph
		);
		Heriverse.currMG.newNode(node);
		Heriverse.syncGraphJSONToScene();

		Heriverse.refresh(Heriverse.ResourceScene);
	}
	// Heriverse.loadEM(null, false, true);
};

Editor.addEdge = ({ from_id, to_id, type }) => {
	let id = from_id + "::" + to_id;
	let to = Heriverse.currMG.getNode(to_id);
	let from = Heriverse.currMG.getNode(from_id);

	Heriverse.currMG.newEdge(id, from, to, type);
	Heriverse.syncGraphJSONToScene();

	Heriverse.setScene();
};

Editor.applyFreeSemShape = () => {
	Editor.setupEditCreateModal(Heriverse.CONNECTION_RULES_NODETYPES.SEMANTIC_SHAPE);

	const modal = document.getElementById("createEditNode");
	bootstrap.Modal.getOrCreateInstance(modal).show();
};

Editor.setupEventHandlers = () => {
	ATON.on("goToPeriodPerformed", (e) => {
		Editor.epoch = Heriverse.currPeriodName;
	});
	ATON.on("SemanticShapeDrawingMode", (b) => {
		if (!b) {
			Editor.applyFreeSemShape();
			return;
		}

		if (Editor.semanticShapeDrawingActive) {
			Editor.semanticShapeDrawingActive = false;
			ATON.SemFactory.stopCurrentConvex();
			EditorUI.setSemanticShapeDrawingUI(false);
			return;
		}

		Editor.semanticShapeDrawingActive = true;
		EditorUI.setSemanticShapeDrawingUI(true);
	});
	ATON.on("EMLoaded", (e) => {});
	ATON.on("Tap", (e) => {
		if (Editor.semanticShapeDrawingActive && Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
			let clicked_object = ATON._rcScene.intersectObjects(ATON._rootVisible.children, true)[0];

			const isInFinalizeButton = EditorUI.isPointerInsideFinalizeSemanticShapeButton(
				Heriverse.mousePosition
			);

			if (!isInFinalizeButton && clicked_object) {
				let clicked_point = clicked_object.point;
				ATON.SemFactory.addConvexPoint(clicked_point);
			}
		}

		shelfElementPointer.x = (e.clientX / ATON._renderer.domElement.clientWidth) * 2 - 1;
		shelfElementPointer.y = -(e.clientY / ATON._renderer.domElement.clientHeight) * 2 + 1;

		ATON._rcScene.setFromCamera(shelfElementPointer, ATON.Nav._camera);

		const shelfObjectHits = ATON._rcScene.intersectObjects(Editor.shelf_objects_in_scene, true);

		if (shelfObjectHits.length > 0) {
			const hitRoot = getShelfSceneNodeFromHit(shelfObjectHits[0].object);
			if (!hitRoot) return;

			if (hitRoot.userData && hitRoot.userData.addedToGraph) return;

			if (!Editor.state.currSelectedNode) {
				Editor.setSelectedNode(hitRoot);
				return;
			}

			if (Editor.state.currSelectedNode !== hitRoot) {
				Editor.setSelectedNode(hitRoot);
				return;
			}

			Editor.gizmo.cycleGizmoMode();
			refreshSelectionVisual();

			EditorUI.updateSelectedNodeSection(Editor.state.currSelectedNode?.name ?? "");
		} else {
			Editor.setSelectedNode(null);
		}
	});

	EditorUI.setupTransformationInputListeners();
};

function getShelfSceneNodeFromHit(hitObject) {
	let node = hitObject;

	while (node) {
		if (Editor.shelf_objects_in_scene.includes(node)) {
			return node;
		}
		node = node.parent;
	}

	return null;
}

Editor.send = (E, shelf_update = false, attempt = false) => {
	if (E.creator && E.creator._id) {
		E.creator = E.creator._id;
	}
	if (Array.isArray(E.viewers)) {
		E.viewers = E.viewers.map((viewer) =>
			typeof viewer === "object" && viewer !== null && "_id" in viewer ? viewer._id : viewer
		);
	}
	if (Array.isArray(E.editors)) {
		E.editors = E.editors.map((editor) =>
			typeof editor === "object" && editor !== null && "_id" in editor ? editor._id : editor
		);
	}
	let data = {
		sid: Heriverse.paramSID,
		scene: { scene: Heriverse.ResourceScene },
	};

	$.ajax({
		type: "PUT",
		url: Utils.baseHost + "heriverse/scene",
		data: JSON.stringify(E),
		contentType: "application/json",
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		success: function (response) {
			if (shelf_update) Heriverse.refresh(response, shelf_update);
			else Heriverse.refresh(response);
		},
		error: function (error) {
			if (error.status == 401 && !attempt) {
				let errorMessage = "";
				if (error.responseJSON && error.responseJSON.message) {
					errorMessage = error.responseJSON.message;
				} else if (error.responseText) {
					errorMessage = error.responseText;
				} else {
					errorMessage = "An unexpected error occurred";
				}
				if (errorMessage == "Token not found or expired") {
					ATON.Flares["Auth"].refreshToken().then((refreshToken) => {
						if (refreshToken == true) {
							Editor.send(E, false, true);
						} else {
							location.href = "/a/heriverse/login";
						}
					});
				}
			}
		},
	});
};

Editor.uploadResource = (files, contentType = "") => {
	let ret = "";
	let formData = new FormData();
	for (let i = 0; i < files.length; i++) {
		formData.append("files", files[i]);
	}

	$.ajax({
		type: "POST",
		url: Utils.baseHost + "heriverse/upload",
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		data: formData,
		processData: false,
		contentType: false,
		async: false,
		success: function (response) {
			let files_array = response.files;
			if (contentType === "3d_model") {
				ret = files_array.find((value) => /\.(?:gltf|glb|obj|ply|fbx|3ds|e57)$/i.test(value));
			} else if (contentType === "image") {
				ret = files_array.find((value) => /\.(?:jpg|jpeg|png)$/i.test(value));
			} else if (contentType === "document") {
				ret = files_array.find((value) => /\.(?:pdf|txt|docx|tiff|xlsx)$/i.test(value));
			} else {
				ret = files_array;
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error("Errore nella richiesta:", textStatus, errorThrown);
			reject(new Error("Errore nel caricamento della risorsa"));
		},
	});

	return ret;
};

Editor.setupEditCreateModal = setupEditCreateModal;

Editor.setupModalSteps = setupModalSteps;

export function saveTemporalFilter(e) {
	const { startPeriodForm, endPeriodForm } = getPeriodFilterElementsFromEvent(e);

	EditorUI.showSavePeriodModal({
		start: startPeriodForm?.value ?? "",
		end: endPeriodForm?.value ?? "",
	});
}

export function editTemporalFilter(e) {
	const { periodSelectButton, startPeriodForm, endPeriodForm, selectedOption } =
		getPeriodFilterElementsFromEvent(e);

	if (!selectedOption || selectedOption.dataset.index === "0") return;

	EditorUI.showEditPeriodModal({
		id: selectedOption.dataset.id,
		name: periodSelectButton?.textContent ?? "",
		start: startPeriodForm?.value ? parseInt(startPeriodForm.value) : "",
		end: endPeriodForm?.value ? parseInt(endPeriodForm.value) : "",
		color: periodSelectButton?.style.getPropertyValue("background-color") || "#000000",
	});
}

Editor.ensurePeriodContext = () => {
	if (!Heriverse.currMG.json) Heriverse.currMG.json = {};
	if (!Heriverse.currMG.json.context) Heriverse.currMG.json.context = {};
	if (!Heriverse.currMG.json.context.absolute_time_Epochs)
		Heriverse.currMG.json.context.absolute_time_Epochs = {};
};

Editor.savePeriod = ({ id, name, start, end, color }) => {
	Editor.ensurePeriodContext();

	const periods = Heriverse.currMG.json.context.absolute_time_Epochs;
	const nextId = "custom_" + name.replace(" ", "_");

	const period = {
		name,
		start: parseInt(start),
		end: parseInt(end),
		color,
	};

	const isEditingExistingPeriod = id && periods[id];
	const isRenamingPeriod = isEditingExistingPeriod && id !== nextId;
	const nextIdAlreadyExists = periods[nextId] && id !== nextId;

	if (isRenamingPeriod && nextIdAlreadyExists) {
		alert("There is a filter with this name!");
		return;
	}

	if (isRenamingPeriod) {
		delete periods[id];
	}

	periods[nextId] = period;

	Heriverse.Scene.multigraph.context.absolute_time_Epochs = periods;

	Heriverse.ResourceScene.resource_json.multigraph.context.absolute_time_Epochs = periods;

	UI.buildPeriodFilter("#idTL");
	const periodPanelContent = document.querySelector("#periodSectionPanel > div");
	if (periodPanelContent) {
		UI.buildPeriodFilter("#periodSectionPanel > div", true);
	}
};

Editor.createGraph = (values) => {
	const { id, name, description, license, authors, embargo, panoramaFiles } = values;

	let panoramaUrl = "";

	if (panoramaFiles && panoramaFiles.length > 0) {
		panoramaUrl = Editor.uploadResource(panoramaFiles);
	}

	const graph = {
		name,
		description,
		defaults: { license, authors, embargo_until: embargo, panorama: panoramaUrl },
		nodes: {},
		edges: {},
	};

	Heriverse.ResourceScene.resource_json.multigraph.graphs[id] = graph;
	Heriverse.Scene.multigraph.graphs[id] = graph;

	Heriverse.setScene();
};

Editor.getEdgeCompatibilityOptions = (edgeType) => {
	const compatibility = Heriverse.node_types_by_conn?.[edgeType] || {
		source: [],
		target: [],
	};

	const sourceNodes = [];
	const targetNodes = [];

	const nodes = Heriverse.currMG.getNodes();

	for (const node of Object.values(nodes)) {
		const crNodeType = Heriverse.getCRNodeTypeByNodeType(node.type);

		if (compatibility.source.includes(crNodeType)) {
			sourceNodes.push({
				id: node.id,
				name: node.name,
			});
		}

		if (compatibility.target.includes(crNodeType)) {
			targetNodes.push({
				id: node.id,
				name: node.name,
			});
		}
	}

	return {
		sourceNodes,
		targetNodes,
	};
};

Editor.getCurrentGraphDefaults = () => {
	const graph = Heriverse.currMG?.json?.graphs?.[Heriverse.currGraphId];

	console.log("CURR_GRAPH_ID", Heriverse.currGraphId, "GRAPH", graph);

	return {
		license: graph?.defaults?.license || "",
		authors: graph?.defaults?.authors || [],
		embargo_until: graph?.defaults?.embargo_until || "",
	};
};

Editor.getPropertyQualiumById = (qualiumId) => {
	const categories = Heriverse.properties_rules?.qualia_categories || [];

	for (const category of categories) {
		for (const subcategory of Object.values(category.subcategories || {})) {
			const qualium = subcategory.qualia?.find((item) => item.id === qualiumId);

			if (qualium) {
				return qualium;
			}
		}
	}
};

Editor.getStratigraphicNodeTypes = () => {
	return HeriverseGraph.stratigraphicTypes;
};

Editor.getAvailableEdgeTypes = () => {
	return Object.values(HeriverseNode.RELATIONS).map((relation) => ({
		value: relation,
		label: HeriverseNode.RELATION_LABELS?.[relation.toLowerCase()] || relation,
	}));
};

Editor.getConnectionRuleNodeTypes = () => {
	return Object.entries(Heriverse.CONNECTION_RULES_NODETYPES).map(([key, value]) => ({
		key,
		value,
		label: value,
	}));
};

Editor.getConnectionRuleNodeType = (key) => {
	return Heriverse.CONNECTION_RULES_NODETYPES?.[key] || null;
};

export default Editor;
