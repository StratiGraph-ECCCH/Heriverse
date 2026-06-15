/*
 *
 *  Scene Aton:
 *    ATON._mainRoot
 *    ATON._rootVisibleGlobal
 *  Camere Aton:
 *    Nav._camOrbit
 *    Nav._camFP
 *    Nav._camDevOri
 *  Renderer Aton:
 *    ATON._renderer
 *
 *  XR.rig
 *
 */
import { Line2 } from "./lines/Line2.js";
import { LineMaterial } from "./lines/LineMaterial.js";
import { LineGeometry } from "./lines/LineGeometry.js";
import HeriverseNode from "./HeriverseGraph/HeriverseNode.js";
import HeriverseEvents from "./HeriverseEvents.js";
import HeriverseGraph from "./HeriverseGraph/HeriverseGraph.js";
import Utils from "../config/Utils.js";
import {
	drawController,
	drawDetailsOnWrist,
	setupEventHandlers as setupXRUIEventHandlers,
} from "./xr/HeriverseXRUI.js";

let HeriverseGraphDrawer = {};

HeriverseGraphDrawer.activeRelations = [
	HeriverseNode.RELATIONS.HAS_PROPERTY,
	HeriverseNode.RELATIONS.IS_AFTER,
	HeriverseNode.RELATIONS.GENERIC_CONNECTION,
];

let relations_material_map = {
	is_before: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.1,
		gapSize: 0.1,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_same_time: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	changed_from: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.1,
		gapSize: 0.1,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_data_provenance: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	contrasts_with: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.1,
		gapSize: 0.1,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_first_epoch: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	survive_in_epoch: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.1,
		gapSize: 0.1,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_activity: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_property: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.1,
		gapSize: 0.1,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	extracted_from: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	combines: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_timebranch: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	generic_connection: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_author: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_geoposition: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_linked_resource: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_representation_model: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
	has_semantic_shape: new LineMaterial({
		color: 0x000000,
		linewidth: 2,
		dashed: true,
		dashSize: 0.6,
		gapSize: 0.3,
		opacity: 1,
		transparent: true,
		depthTest: false,
	}),
};

window.HeriverseGraphDrawer = HeriverseGraphDrawer;

HeriverseGraphDrawer.nodes = {};
HeriverseGraphDrawer.stagedNodes = {};
HeriverseGraphDrawer.node4deletion = [];
HeriverseGraphDrawer.stagedSemantic = [];
HeriverseGraphDrawer.edges = [];

HeriverseGraphDrawer.proxyActivated = false;

HeriverseGraphDrawer.init = () => {
	HeriverseGraphDrawer.setupEventHandlers();
	HeriverseGraphDrawer.setupRelationsMaterialFromFile(
		Utils.baseUrl + "/src/3dgraphy_config_files/em_visual_rules.json"
	);
};

HeriverseGraphDrawer.setupRelationsMaterialFromFile = (jsonVisualRulesFile) => {
	relations_material_map = {};
	try {
		fetch(jsonVisualRulesFile)
			.then((response) => response.json())
			.then((data) => {
				const style_from_data = data.edge_style;
				for (let relation_name in style_from_data) {
					const relationStyle = style_from_data[relation_name];
					if (
						relationStyle.style.line_style &&
						(relationStyle.style.line_style.includes("dashed") ||
							relationStyle.style.line_style === "dotted")
					) {
						if (relationStyle.style.line_style === "dotted") {
							relations_material_map[relation_name] = new LineMaterial({
								color: Number("0x" + relationStyle.style.color.slice(1)) || 0x000000,
								linewidth: relationStyle.style.width,
								dashed: true,
								dashSize: 0.1,
								gapSize: 0.1,
								opacity: 1,
								transparent: true,
								depthTest: false,
							});
						} else if (relationStyle.style.line_style === "dashed") {
							relations_material_map[relation_name] = new LineMaterial({
								color: Number("0x" + relationStyle.style.color.slice(1)) || 0x000000,
								linewidth: relationStyle.style.width,
								dashed: true,
								dashSize: 0.3,
								gapSize: 0.1,
								opacity: 1,
								transparent: true,
								depthTest: false,
							});
						} else {
							relations_material_map[relation_name] = new LineMaterial({
								color: Number("0x" + relationStyle.style.color.slice(1)) || 0x000000,
								linewidth: 2,
								dashed: true,
								dashSize: 0.1,
								gapSize: 0.1,
								opacity: 1,
								transparent: true,
								depthTest: false,
							});
						}
					} else {
						relations_material_map[relation_name] = new LineMaterial({
							color: Number("0x" + relationStyle.style.color.slice(1)) || 0x000000,
							linewidth: relationStyle.style.width,
							opacity: 1,
							transparent: true,
							depthTest: false,
						});
					}
				}
			});
	} catch (error) {
		console.error("Failed fetching JSON: ", error);
	}
};

HeriverseGraphDrawer.getPositionInfo = () => {
	let position_info = {};
	let clicked_object = ATON._rcSemantics.intersectObjects(
		ATON.getRootSemantics().children,
		true
	)[0];

	position_info.click_point = clicked_object.point;

	position_info.horizontal =
		Math.round(clicked_object.face.normal.y) == 1 || Math.round(clicked_object.face.normal.y) == -1;
	position_info.sideFace =
		Math.round(clicked_object.face.normal.x) == 1 || Math.round(clicked_object.face.normal.x) == -1;

	position_info.face_normal = clicked_object.face.normal;

	return position_info;
};

HeriverseGraphDrawer.drawGraph = (node, position, normal, horizontal, sideFace) => {
	HeriverseGraphDrawer.clearAll();

	if (node) {
		HeriverseGraphDrawer.proxyActivated = true;

		const pos_node_offset = 0.03;
		const initialRadius = 0.6;
		const expansionAngle = Math.PI / 2;
		let isRootLayer = true;

		const center = { x: position.x, y: position.y, z: position.z };

		if (normal) {
			if (horizontal) {
				const y_face = Math.round(normal.y);
				if (y_face == 1) position.y += 0.4 + pos_node_offset;
				else if (y_face == -1) position.y -= 0.4 - pos_node_offset;
			}

			if (sideFace) {
				const x_face = Math.round(normal.x);
				if (x_face == 1) position.x += 0.4 + pos_node_offset;
				else if (x_face == -1) position.x -= 0.4 - pos_node_offset;
			} else {
				const z_face = Math.round(normal.z);
				if (z_face == 1) position.z += 0.4 + pos_node_offset;
				else if (z_face == -1) position.z -= 0.4 - pos_node_offset;
			}
		}

		drawNode(node, node.id, position);

		let currentLayerResults = [];

		do {
			const nextLayerResults = [];

			if (isRootLayer) {
				const adjacencyResult = drawAdjacent(
					node,
					isRootLayer,
					position,
					center,
					normal,
					horizontal,
					sideFace,
					initialRadius,
					expansionAngle
				);

				nextLayerResults.push(adjacencyResult);
			} else {
				currentLayerResults.forEach((layerResult) => {
					layerResult.vicini.forEach((childNode) => {
						const adjacencyResult = drawAdjacent(
							childNode,
							isRootLayer,
							position,
							center,
							normal,
							horizontal,
							sideFace,
							layerResult.next_r,
							expansionAngle
						);

						nextLayerResults.push(adjacencyResult);
					});
				});
			}

			currentLayerResults = nextLayerResults;
			isRootLayer = false;
		} while (thereAreAdjacent(currentLayerResults));
	}
};

HeriverseGraphDrawer.clearAll = () => {
	HeriverseGraphDrawer.node4deletion.forEach((node) => {
		node.disablePicking();
		node.delete();
	});

	HeriverseGraphDrawer.stagedSemantic.forEach((node) => {
		ATON.SemFactory.deleteSemanticNode(node);
	});

	HeriverseGraphDrawer.edges.forEach((edge) => {
		edge.visible = false;
		ATON.getRootScene().remove(edge);
	});

	HeriverseGraphDrawer.nodes = {};
	HeriverseGraphDrawer.stagedNodes = {};
	HeriverseGraphDrawer.node4deletion = [];
	HeriverseGraphDrawer.stagedSemantic = [];
	HeriverseGraphDrawer.edges = [];

	HeriverseGraphDrawer.proxyActivated = false;
};

function drawNode(node, nodeId, position) {
	let sceneNode = ATON.createUINode(nodeId);
	sceneNode.enablePicking();

	if (node.type) {
		createTextSprite(node.name, node.type, node.name).then((sprite) => {
			sceneNode.add(sprite);
		});
	}

	if (node.layout && node.layout.scale) sceneNode.setScale(node.layout.scale);
	else sceneNode.setScale(10);

	sceneNode.setPosition(position.x, position.y, position.z);
	sceneNode.attachToRoot();

	// Heriverse.semantic_circle_prefix + node.name = node.id
	createSemanticHandleForNode(node, position);

	HeriverseGraphDrawer.nodes[nodeId] = sceneNode;
	HeriverseGraphDrawer.stagedNodes[nodeId] = sceneNode;
	HeriverseGraphDrawer.node4deletion.push(sceneNode);
}

function createSemanticHandleForNode(node, position) {
	if (HeriverseGraphDrawer.stagedSemantic.includes(node.id)) return;

	let sem = ATON.createSemanticNode(node.id).attachToRoot();
	let handleLocation = new THREE.Vector3(position.x, position.y, position.z);
	let handleRadius = 0.2;

	ATON.SemFactory.createSphere(node.id, handleLocation, handleRadius);
	sem.enablePicking();

	sem.onHover = () => {
		let semid = ATON._hoveredSemNode;
		let S = ATON.getSemanticNode(semid);
		if (S) S.highlight();
	};
	sem.onLeave = () => {
		let semid = ATON._hoveredSemNode;
		let S = ATON.getSemanticNode(semid);
		if (S) S.restoreDefaultMaterial();
	};

	HeriverseGraphDrawer.stagedSemantic.push(node.id);
}

function shouldStopExpansion(node, isRootNode) {
	if (isRootNode) return false;

	return (
		Heriverse.currMG.stratigraphicNodes[node.id] !== undefined ||
		node.type === HeriverseNode.NODE_TYPE.DOCUMENT ||
		node.type === HeriverseNode.NODE_TYPE.LINK ||
		node.type === HeriverseNode.NODE_TYPE.EPOCH ||
		node.type === "ActivityNodeGroup" ||
		node.type === "ParadataNodeGroup"
	);
}

function emptyAdjacentResult() {
	return { vicini: [], next_r: -1 };
}

function collectAdjacency(node, isRootNode, activeRelations) {
	return isRootNode ? collectRootAdjacency(node, activeRelations) : collectChildAdjacency(node);
}

function createAdjacencyInfo() {
	return { nodes: [], types: {}, directions: {} };
}

function collectRootAdjacency(node, activeRelations) {
	const adjacency = createAdjacencyInfo();

	activeRelations.forEach((relation) => {
		const direction = relation === HeriverseNode.RELATIONS.HAS_PROPERTY ? "to" : "both";

		adjacency.nodes.push(...Object.values(node.getNeighborsByRelationP(relation, direction) || {}));
	});

	activeRelations.forEach((relation) => {
		if (relation === HeriverseNode.RELATIONS.HAS_PROPERTY) {
			registerNeighborsByDirection(adjacency, node, relation, "to", "from");
		} else {
			registerNeighborsByDirection(adjacency, node, relation, "from", "from");
			registerNeighborsByDirection(adjacency, node, relation, "to", "to");
		}
	});

	return adjacency;
}

function registerNeighborsByDirection(adjacency, node, relation, queryDirection, edgeDirection) {
	const neighbors = node.getNeighborsByRelationP(relation, queryDirection) || {};

	for (const neighborId in neighbors) {
		if (!adjacency.types[neighborId]) {
			adjacency.types[neighborId] = relation;
		}

		if (!adjacency.directions[neighborId]) {
			adjacency.directions[neighborId] = edgeDirection;
		} else if (adjacency.directions[neighborId] === "from" && edgeDirection === "to") {
			adjacency.directions[neighborId] = "both";
		}
	}
}

function collectChildAdjacency(node) {
	const adjacency = createAdjacencyInfo();
	const relations = getChildExpansionRelations(node);

	relations.forEach((relation) => {
		const neighbors = node.getNeighborsByRelationP(relation, "to") || {};

		adjacency.nodes.push(...Object.values(neighbors));

		for (const neighborId in neighbors) {
			if (!adjacency.types[neighborId]) {
				adjacency.types[neighborId] = relation;
			}
			if (!adjacency.directions[neighborId]) {
				adjacency.directions[neighborId] = "from";
			}
		}
	});

	return adjacency;
}

function getChildExpansionRelations(node) {
	if (node.type === HeriverseNode.NODE_TYPE.PROPERTY) {
		return ["has_data_provenance", "generic_connection"];
	}

	if (node.type === HeriverseNode.NODE_TYPE.EXTRACTOR) {
		return ["extracted_from", "generic_connection"];
	}

	if (node.type === HeriverseNode.NODE_TYPE.COMBINER) {
		return ["combines", "generic_connection"];
	}

	return [];
}

function drawAdjacentNodes({
	adjacent,
	rootNode,
	types,
	directions,
	root_sons,
	start_position,
	center,
	normal,
	horizontal,
	sideFace,
	r_node,
	phi,
}) {
	const neighborsCount = adjacent.length;
	const rootPosition = rootNode.position;

	let tmp_r = -1;

	adjacent.forEach((neighbor, neighborIndex) => {
		const theta = calculateAdjacentTheta({
			root_sons,
			neighborIndex,
			neighborsCount,
			rootPosition,
			center,
			normal,
			phi,
		});

		const newPoint = calculatePoint(
			rootPosition.x,
			rootPosition.y,
			rootPosition.z,
			start_position,
			0,
			normal,
			horizontal,
			sideFace,
			r_node,
			theta
		);

		drawNode(neighbor, neighbor.id, newPoint);

		drawEdge(
			rootNode.name,
			rootPosition,
			neighbor.id,
			newPoint,
			types[neighbor.id],
			directions[neighbor.id]
		);

		tmp_r = calculateNextRadiusCandidate({
			currentRadius: tmp_r,
			neighborsCount,
			newPoint,
			rootPosition,
			horizontal,
			sideFace,
		});
	});

	return tmp_r;
}

function calculateAdjacentTheta({
	root_sons,
	neighborIndex,
	neighborsCount,
	rootPosition,
	center,
	normal,
	phi,
}) {
	if (root_sons) {
		return (2 * Math.PI * neighborIndex) / neighborsCount;
	}

	const baseAngle = calculateBaseAngle(rootPosition, center, normal);

	if (neighborsCount >= 1) {
		return (
			baseAngle - phi / 2 + (phi * neighborIndex) / neighborsCount + phi / (2 * neighborsCount)
		);
	}

	return baseAngle;
}

function calculateBaseAngle(rootPosition, center, normal) {
	if (Math.round(normal.y) === 1 || Math.round(normal.y) === -1) {
		return Math.atan2(rootPosition.z - center.z, rootPosition.x - center.x);
	}

	if (Math.round(normal.x) === 1 || Math.round(normal.x) === -1) {
		return Math.atan2(rootPosition.z - center.z, rootPosition.y - center.y);
	}

	if (Math.round(normal.z) === 1 || Math.round(normal.z) === -1) {
		return Math.atan2(rootPosition.y - center.y, rootPosition.x - center.x);
	}

	return 0;
}

function calculateNextRadiusCandidate({
	currentRadius,
	neighborsCount,
	newPoint,
	rootPosition,
	horizontal,
	sideFace,
}) {
	if (neighborsCount === 1) {
		return neighborsCount * 0.8;
	}

	if (neighborsCount <= 1) {
		return currentRadius;
	}

	const projectHalfDistance = calculateProjectedHalfDistance({
		newPoint,
		rootPosition,
		horizontal,
		sideFace,
	});

	if (currentRadius === -1 || currentRadius === undefined) {
		return projectHalfDistance;
	}

	return Math.min(currentRadius, projectHalfDistance);
}

function calculateProjectedHalfDistance({ newPoint, rootPosition, horizontal, sideFace }) {
	if (horizontal) {
		return (
			Math.sqrt(
				Math.pow(newPoint.x - rootPosition.x, 2) + Math.pow(newPoint.z - rootPosition.z, 2)
			) / 2
		);
	}

	if (sideFace) {
		return (
			Math.sqrt(
				Math.pow(newPoint.y - rootPosition.y, 2) + Math.pow(newPoint.z - rootPosition.z, 2)
			) / 2
		);
	}

	return (
		Math.sqrt(Math.pow(newPoint.x - rootPosition.x, 2) + Math.pow(newPoint.y - rootPosition.y, 2)) /
		2
	);
}

function drawAdjacent(
	node,
	root_sons,
	start_position,
	center,
	normal,
	horizontal,
	sideFace,
	r_node,
	phi,
	activeRelations = HeriverseGraphDrawer.activeRelations
) {
	if (shouldStopExpansion(node, root_sons)) {
		return emptyAdjacentResult();
	}

	const root_node = HeriverseGraphDrawer.nodes[node.id];
	const adjacency = collectAdjacency(node, root_sons, activeRelations);

	const adjacent = adjacency.nodes;
	const types = adjacency.types;
	const directions = adjacency.directions;

	if (!adjacent.length) {
		return emptyAdjacentResult();
	}

	const nextRadius = drawAdjacentNodes({
		adjacent,
		rootNode: root_node,
		types,
		directions,
		root_sons,
		start_position,
		center,
		normal,
		horizontal,
		sideFace,
		r_node,
		phi,
	});

	return { vicini: adjacent, next_r: nextRadius };
}

function calculatePoint(
	x,
	y,
	z,
	start_position,
	nodeOffset,
	normal,
	horizontal,
	sideFace,
	r,
	theta
) {
	let new_point = { x: 0, y: 0, z: 0 };
	let horizontal_pos, horizontal_neg, sideFace_pos, sideFace_neg, face_pos, face_neg;
	if (normal) {
		horizontal_pos = Math.round(normal.y) == 1;
		horizontal_neg = Math.round(normal.y) == -1;
		sideFace_pos = Math.round(normal.x) == 1;
		sideFace_neg = Math.round(normal.x) == -1;
		face_pos = Math.round(normal.z) == 1;
		face_neg = Math.round(normal.z) == -1;
	}

	if (horizontal) {
		if (nodeOffset) {
			if (horizontal_pos) {
				new_point.x = x + r * Math.cos(theta);
				new_point.z = z + r * Math.sin(theta);
				new_point.y = start_position.y + nodeOffset;
			} else if (horizontal_neg) {
				new_point.x = x + r * Math.cos(theta);
				new_point.z = z + r * Math.sin(theta);
				new_point.y = start_position.y - nodeOffset;
			}
		} else {
			new_point.x = x + r * Math.cos(theta);
			new_point.z = z + r * Math.sin(theta);
			new_point.y = start_position.y;
		}
	} else if (sideFace) {
		if (nodeOffset) {
			if (sideFace_pos) {
				new_point.y = y + r * Math.cos(theta);
				new_point.z = z + r * Math.sin(theta);
				new_point.x = start_position.x + nodeOffset;
			} else if (sideFace_neg) {
				new_point.y = y + r * Math.cos(theta);
				new_point.z = z + r * Math.sin(theta);
				new_point.x = start_position.x - nodeOffset;
			}
		} else {
			new_point.y = y + r * Math.cos(theta);
			new_point.z = z + r * Math.sin(theta);
			new_point.x = start_position.x;
		}
	} else {
		if (nodeOffset) {
			if (face_pos) {
				new_point.x = x + r * Math.cos(theta);
				new_point.y = y + r * Math.sin(theta);
				new_point.z = start_position.z + nodeOffset;
			} else if (face_neg) {
				new_point.x = x + r * Math.cos(theta);
				new_point.y = y + r * Math.sin(theta);
				new_point.z = start_position.z - nodeOffset;
			}
		} else {
			new_point.x = x + r * Math.cos(theta);
			new_point.y = y + r * Math.sin(theta);
			new_point.z = start_position.z;
		}
	}

	return new_point;
}

function thereAreAdjacent(collection) {
	for (let collectionIndex in collection) {
		let curr_vicini = collection[collectionIndex].vicini.filter(
			(elem) => elem instanceof HeriverseNode
		);
		if (curr_vicini.length > 0) return true;
	}
	return false;
}

function createTextSprite(text, fileName, nodeName) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	canvas.width = 512;
	canvas.height = 256;

	const background = new Image();
	background.src = Utils.baseUrl + "/" + "res/graphicons/" + fileName + ".svg";

	background.onerror = () => {
		background.onerror = null;
		background.src = Utils.baseUrl + "/" + "res/graphicons/" + "generic_node" + ".svg";
	};

	return new Promise((resolve) => {
		background.onload = () => {
			context.drawImage(background, 0, 0, canvas.width, canvas.height);

			context.font = "bold 40pt Arial";
			context.color = "red";
			switch (fileName) {
				case HeriverseNode.NODE_TYPE.PROPERTY:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SF:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SERSU:
				case HeriverseNode.STRATIGRAPHIC_TYPE.US:
				case HeriverseNode.STRATIGRAPHIC_TYPE.USD:
				case HeriverseNode.STRATIGRAPHIC_TYPE.UTR:
					context.fillStyle = "black";
					break;
				case HeriverseNode.STRATIGRAPHIC_TYPE.USVs:
				case HeriverseNode.STRATIGRAPHIC_TYPE.USVn:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SERUSVN:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SERUSVS:
				case HeriverseNode.STRATIGRAPHIC_TYPE.VSF:
					context.fillStyle = "white";
					break;
				default:
					context.fillStyle = "#a000a0";
					// context.fillStyle = "#CC00CC";
					// context.fillStyle = "#FF00FF";
					context.letterSpacing = "10px";
					context.fontStretch = "semi-expanded";
					break;
			}

			context.textAlign = "center";
			switch (fileName) {
				// case HeriverseNode.NODE_TYPE.COMBINER:
				// case HeriverseNode.NODE_TYPE.EXTRACTOR:
				// case HeriverseNode.NODE_TYPE.DOCUMENT:
				// case HeriverseNode.NODE_TYPE.EPOCH:
				// case HeriverseNode.NODE_TYPE.ACTIVITY_NODE_GROUP:
				// case HeriverseNode.NODE_TYPE.PARADATA_NODE_GROUP:
				// case HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE:
				// case HeriverseNode.NODE_TYPE.AUTHOR:
				// case HeriverseNode.NODE_TYPE.LINK:
				// 	context.fillText("", canvas.width / 2, canvas.height / 2);
				// 	break;
				// case HeriverseNode.NODE_TYPE.LINK:
				// 	context.fillText(nodeName, canvas.width / 2, canvas.height / 2);
				// 	break;
				default:
					context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width);
					break;
			}

			const texture = new THREE.Texture(canvas);
			texture.needsUpdate = true;

			const material = new THREE.SpriteMaterial({
				map: texture,
				depthTest: false,
			});
			const sprite = new THREE.Sprite(material);

			const scaleFactor = 0.00008;
			const scaleFactor2 = 0.00008;
			const scaleFactor3 = 0.00005;
			const scaleFactor4 = 0.00007;

			switch (fileName) {
				case HeriverseNode.NODE_TYPE.PROPERTY:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SF:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SERSU:
				case HeriverseNode.STRATIGRAPHIC_TYPE.US:
				case HeriverseNode.STRATIGRAPHIC_TYPE.USD:
				case HeriverseNode.STRATIGRAPHIC_TYPE.UTR:
				case HeriverseNode.STRATIGRAPHIC_TYPE.USVs:
				case HeriverseNode.STRATIGRAPHIC_TYPE.USVn:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SERUSVN:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SERUSVS:
				case HeriverseNode.STRATIGRAPHIC_TYPE.VSF:
				case HeriverseNode.STRATIGRAPHIC_TYPE.TSU:
				case HeriverseNode.STRATIGRAPHIC_TYPE.SE:
					sprite.scale.set(scaleFactor * canvas.width, scaleFactor * canvas.height);
					break;
				case HeriverseNode.NODE_TYPE.DOCUMENT:
					sprite.scale.set(scaleFactor4 * canvas.height, scaleFactor3 * canvas.width);
					break;
				default:
					sprite.scale.set(scaleFactor * canvas.height, scaleFactor2 * canvas.height);
					break;
			}

			resolve(sprite);
		};
	});
}

function getRelationMaterial(type) {
	return (
		relations_material_map[type] ||
		relations_material_map[HeriverseNode.RELATIONS.GENERIC_CONNECTION] ||
		new LineMaterial({
			color: 0x000000,
			linewidth: 2,
			transparent: true,
			depthTest: false,
		})
	);
}

function createEdgeLine(start, end, material) {
	const geometry = new LineGeometry();

	geometry.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);

	const line = new Line2(geometry, material);
	line.computeLineDistances();

	return line;
}

function addArrowHeads(edgeGroup, start, end, direction) {
	if (direction === "from") {
		const arrow = createArrowHead();
		positionArrowOnEdge(arrow, start, end, 0.5, getEdgeDirection(start, end));

		edgeGroup.add(arrow);
		return;
	} else if (direction === "to") {
		const arrow = createArrowHead();
		positionArrowOnEdge(arrow, start, end, 0.5, getEdgeDirection(end, start));

		edgeGroup.add(arrow);
		return;
	} else if (direction === "both") {
		const arrowToStart = createArrowHead();
		const arrowToEnd = createArrowHead({
			radius: 0.02,
			height: 0.05,
		});

		positionArrowOnEdge(arrowToStart, start, end, 0.35, getEdgeDirection(end, start));
		positionArrowOnEdge(arrowToEnd, start, end, 0.65, getEdgeDirection(start, end));

		edgeGroup.add(arrowToStart);
		edgeGroup.add(arrowToEnd);
	}
}

function createArrowHead({ radius = 0.04, height = 0.07, color = 0x000000 } = {}) {
	return new THREE.Mesh(
		new THREE.ConeGeometry(radius, height, 16),
		new THREE.MeshBasicMaterial({ color: color, depthTest: false })
	);
}

function getEdgeDirection(from, to) {
	return new THREE.Vector3().subVectors(to, from).normalize();
}

function positionArrowOnEdge(arrow, start, end, t, directionVector) {
	const position = new THREE.Vector3().lerpVectors(start, end, t);

	arrow.position.copy(position);
	arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), directionVector);
}

function drawEdge(id1, position1, id2, position2, type, direction) {
	const start = convertPosition(position1);
	const end = convertPosition(position2);

	const edgeGroup = new THREE.Group();

	const line = createEdgeLine(start, end, getRelationMaterial(type));
	line.userData = { node1: id1, node2: id2 };

	edgeGroup.add(line);

	addArrowHeads(edgeGroup, start, end, direction);

	ATON.getRootScene().add(edgeGroup);
	HeriverseGraphDrawer.edges.push(edgeGroup);
}

function convertPosition(point) {
	return new THREE.Vector3(point.x, point.y, point.z);
}

function moveCameraTowardsGraph(graphGenarationPoint) {
	const surfaceNormal = graphGenarationPoint.face_normal;

	const distanceFromPoint = 3;

	const normal_x = Math.round(surfaceNormal.x);
	const normal_y = Math.round(surfaceNormal.y);
	const normal_z = Math.round(surfaceNormal.z);

	const pov = new ATON.POV();

	if (Heriverse._bZoomToGraph) {
		if (normal_x === 1) {
			pov.pos.x = graphGenarationPoint.click_point.x + distanceFromPoint;
			pov.pos.y = graphGenarationPoint.click_point.y;
			pov.pos.z = graphGenarationPoint.click_point.z;
		} else if (normal_x === -1) {
			pov.pos.x = graphGenarationPoint.click_point.x - distanceFromPoint;
			pov.pos.y = graphGenarationPoint.click_point.y;
			pov.pos.z = graphGenarationPoint.click_point.z;
		} else if (normal_y === 1) {
			pov.pos.x = graphGenarationPoint.click_point.x;
			pov.pos.y = graphGenarationPoint.click_point.y + distanceFromPoint;
			pov.pos.z = graphGenarationPoint.click_point.z;
		} else if (normal_y === -1) {
			pov.pos.x = graphGenarationPoint.click_point.x;
			pov.pos.y = graphGenarationPoint.click_point.y - distanceFromPoint;
			pov.pos.z = graphGenarationPoint.click_point.z;
		} else if (normal_z === 1) {
			pov.pos.x = graphGenarationPoint.click_point.x;
			pov.pos.y = graphGenarationPoint.click_point.y;
			pov.pos.z = graphGenarationPoint.click_point.z + distanceFromPoint;
		} else if (normal_z === -1) {
			pov.pos.x = graphGenarationPoint.click_point.x;
			pov.pos.y = graphGenarationPoint.click_point.y;
			pov.pos.z = graphGenarationPoint.click_point.z - distanceFromPoint;
		}
	} else {
		pov.pos = ATON.Nav.copyCurrentPOV().pos.clone();
	}

	pov.target.x = graphGenarationPoint.click_point.x;
	pov.target.y = graphGenarationPoint.click_point.y;
	pov.target.z = graphGenarationPoint.click_point.z;

	ATON.Nav.requestPOV(pov);
}

HeriverseGraphDrawer.drawController = drawController;

HeriverseGraphDrawer.drawDetailsOnWrist = drawDetailsOnWrist;

function handleKeyPress(k) {
	if (k === "Escape") {
		if (
			Heriverse.MODE === Heriverse.MODETYPES.SCENE ||
			Heriverse.MODE === Heriverse.MODETYPES.EDITOR
		) {
			if (HeriverseGraphDrawer.proxyActivated) {
				HeriverseGraphDrawer.proxyActivated = false;
				Heriverse.HERUI.closeSidebar();
				HeriverseGraphDrawer.drawGraph(null, null, null, null, null);
			}
			if (
				"Editor" in window &&
				Editor !== undefined &&
				Editor !== null &&
				Editor.semanticShapeDrawingActive
			) {
				ATON.fire("SemanticShapeDrawingMode", false);
			}
		}
	}
}

function handleTap(e) {
	let node = null;
	let position_info = null;

	if (ATON._hoveredSemNode) {
		let proxy = Heriverse.currMG.proxyNodes[ATON._hoveredSemNode];
		let semNode = Heriverse.currMG.nodesByIndex[ATON._hoveredSemNode];

		if (semNode) {
			if (
				HeriverseGraphDrawer.proxyActivated &&
				HeriverseGraphDrawer.stagedSemantic &&
				HeriverseGraphDrawer.stagedSemantic.findIndex(
					(nodeId) => nodeId === ATON._hoveredSemNode
				) === -1
			) {
				return;
			}
			Heriverse.HERUI.createSidebar(semNode);
			if (semNode.type === HeriverseNode.NODE_TYPE.DOCUMENT) {
				ATON.fireEvent(HeriverseEvents.Events.SHOW_DOCUMENT_LINK, semNode.id);
			} else if (HeriverseGraph.stratigraphicTypes.includes(semNode.type)) {
			}
			return;
		} else if (proxy) {
			if (HeriverseGraphDrawer.proxyActivated) return;
			HeriverseGraphDrawer.proxyActivated = true;
			node = proxy.node;
			position_info = HeriverseGraphDrawer.getPositionInfo();
		}
	}

	if (position_info) {
		HeriverseGraphDrawer.drawGraph(
			node,
			position_info.click_point,
			position_info.face_normal,
			position_info.horizontal,
			position_info.sideFace
		);
		moveCameraTowardsGraph(position_info);
	} else {
		// HeriverseGraphDrawer.drawGraph(node, null, null, null, null);
	}
}

function handleSemanticNodeHover(semid) {
	if (
		HeriverseGraphDrawer.proxyActivated ||
		(ATON.XR.isPresenting() && !Heriverse._bXRSemanticMode)
	)
		return;
	if (Heriverse._bShowAllProxies) return;
	let S = ATON.getSemanticNode(semid);
	if (S) S.highlight();
}

function handleSemanticNodeLeave(semid) {
	$("#idProxyID").html("");
	if (Heriverse._bShowAllProxies) return;
	let S = ATON.getSemanticNode(semid);
	if (!S) return;
	S.restoreDefaultMaterial();
}

function handleSemanticNodeSelect(semid) {}

HeriverseGraphDrawer.setupEventHandlers = () => {
	setupXRUIEventHandlers();

	ATON.on("KeyPress", handleKeyPress);

	ATON.on("Tap", handleTap);

	ATON.clearEventHandlers("SemanticNodeHover");
	ATON.clearEventHandlers("SemanticNodeLeave");

	ATON.on("SemanticNodeHover", handleSemanticNodeHover);

	ATON.on("SemanticNodeLeave", handleSemanticNodeLeave);

	ATON.on("SemanticNodeSelect", handleSemanticNodeSelect);
};

export default HeriverseGraphDrawer;
