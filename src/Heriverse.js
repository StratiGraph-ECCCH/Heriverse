/*!
    @preserve

 	Heriverse

 	@author 3D Research s.r.l.

==================================================================================*/
"use strict";

/**
@namespace Heriverse
*/
let Heriverse = {};
window.Heriverse = Heriverse;

import { setupAndShowEnvSettingsPanel, setupAndShowViewpointsPanel } from "./ui.js";
import UI from "./ui.js";
import Utils from "../config/Utils.js";
import Proxy from "./Models/proxy.js";
import HeriverseGraph from "./HeriverseGraph/HeriverseGraph.js";
import HeriverseEvents from "./HeriverseEvents.js";
import HeriverseNode from "./HeriverseGraph/HeriverseNode.js";
import ShelfGraph from "./ShelfGraph/ShelfGraph.js";
import { PointerLockControls } from "./controls/PointerLockControls.js";
import Period from "./Models/period.js";
import HeriverseGraphDrawer from "./HeriverseGraphDrawer.js";

let iconFolder = window.location.href.includes("heriverse-wapp")
	? "/a/heriverse-wapp/res/graphicons/"
	: window.location.href.includes("heriverse")
		? "/a/heriverse/res/graphicons/"
		: "";

let modelFolder = "/a/heriverse/res/graphmodels/";

Heriverse.HeriverseGraph = HeriverseGraph;
Heriverse.ShelfGraph = ShelfGraph;
Heriverse.HERUI = UI;
window.UI = Heriverse.HERUI;
Heriverse.Scene = null;
Heriverse.Data = null;
Heriverse.ActualProxy;
Heriverse.ActualSceneNode;
Heriverse.SidebarOpened = false;

Heriverse.firstSetup = true;

Heriverse.YED_dNodeGraphics = "d6";
Heriverse.YED_dEdgeGraphics = "d10";
Heriverse.YED_dAttrDesc = "d5";
Heriverse.YED_dAttrURL = "d4";

Heriverse.YED_sSeriation = "ellipse";
Heriverse.YED_sUS = "rectangle";
Heriverse.YED_sUSVS = "parallelogram";
Heriverse.YED_sUSVN = "hexagon";
Heriverse.YED_sSF = "octagon";

Heriverse._bProxiesAlwaysVis = true;
Heriverse._bShowAllProxies = false;
Heriverse._bOcclusion = false;
Heriverse._bDirectionalLight = false;
Heriverse._bShadowEnabled = false;
Heriverse._bAutoLightProbe = false;
Heriverse._bAmbientOcclusion = false;
Heriverse._bZoomToGraph = true;

Heriverse.camPointerLock;
Heriverse.cPointerLock;
Heriverse.pointerLockControlsActive = false;
Heriverse.MODE_POINTER_LOCK = 3;

Heriverse._ctrlHeld = false;
Heriverse._perspCam = null;
Heriverse._orthoCam = null;

Heriverse.MODE = 0;
Heriverse.currentGraphs = [];

Heriverse.MODETYPES = {
	SCENES: 0,
	DASHBOARD: 1,
	EDITOR: 2,
	SCENE: 3,
	GRAPH: 4,
};

Heriverse.NODETYPES = {
	SERIATION: 0,
	US: 1,
	USVS: 2,
	USVN: 3,
	SF: 4,
	UTR: 5,
	SERUSVN: 6,
	SERUSVS: 7,
	USD: 8,
	SERIALSU: 9,
	VSF: 10,

	COMBINER: 11,
	EXTRACTOR: 12,
	DOCUMENT: 13,
	PROPERTY: 14,
	CONTINUITY: 15,
	NODESCENE: 16,
	REPRESENTATION_MODEL: 17,
	SEMANTIC_SHAPE: 18,
	EPOCHNODE: 19,
	AUTHOR: 20,
	GEO_POSITION: 21,
	ACTIVITYNODEGROUP: 22,
	PARADATANODEGROUP: 23,
	REPRESENTATION_MODEL_DOC: 24,
	REPRESENTATION_MODEL_SF: 25,
	LINK: 26,
};

Heriverse.CONNECTION_RULES_NODETYPES = {
	STRATIGRAPHIC: "StratigraphicNode",
	PROPERTY: "PropertyNode",
	EXTRACTOR: "ExtractorNode",
	COMBINER: "CombinerNode",
	TIME_BRANCH_GROUP: "TimeBranchNodeGroup",
	REPRESENTATION_MODEL: "RepresentationModelNode",
	REPRESENTATION_MODEL_DOC: "RepresentationModelDocNode",
	REPRESENTATION_MODEL_SF: "RepresentationModelSpecialFindNode",
	EPOCH: "EpochNode",
	PARADATA: "ParadataNode",
	PARADATA_GROUP: "ParadataNodeGroup",
	DOCUMENT: "DocumentNode",
	ACTIVITY_GROUP: "ActivityNodeGroup",
	GRAPH: "GraphNode",
	GEO_POSITION: "GeoPositionNode",
	SPECIAL_FIND_UNIT: "SpecialFindUnit",
	NODE: "Node",
	SEMANTIC_SHAPE: "SemanticShapeNode",
	LICENSE: "LicenseNode",
	EMBARGO: "EmbargoNode",
	LINK: "LinkNode",
	AUTHOR: "AuthorNode",
};

Heriverse.propertiesRulesPath = Utils.baseUrl + "/src/3dgraphy_config_files/em_qualia_types.json";
Heriverse.connectionRulePath =
	Utils.baseUrl + "/src/3dgraphy_config_files/s3Dgraphy_connections_datamodel.json";
Heriverse.semanticMaterialRulePath =
	Utils.baseUrl + "/src/3dgraphy_config_files/em_visual_rules.json";

Heriverse._bXRSemanticMode = false;
Heriverse._bXRPointerMode = false;

Heriverse.semantic_shapes_materials = {};
Heriverse.node_types_by_conn = {};
Heriverse.connection_rules = {};
Heriverse.properties_rules = {};

Heriverse.semantic_circle_prefix = "Semantic Node of ";

Heriverse.APP = ATON.App.realize();
Heriverse.APP.requireFlares(["Auth"]);

Heriverse.getIconURLbyType = (type) => {
	if (type === Heriverse.NODETYPES.SERIATION) return iconFolder + "SUseries.png";
	if (type === Heriverse.NODETYPES.US) return iconFolder + "US.svg";
	if (type === Heriverse.NODETYPES.USVS) return iconFolder + "USVs.svg";
	if (type === Heriverse.NODETYPES.USVN) return iconFolder + "USVn.svg";
	if (type === Heriverse.NODETYPES.SF) return iconFolder + "SF.svg";
	if (type === Heriverse.NODETYPES.UTR) return iconFolder + "UTR.svg";
	if (type === Heriverse.NODETYPES.SERUSVN) return iconFolder + "serUSVn.svg";
	if (type === Heriverse.NODETYPES.SERUSVS) return iconFolder + "serUSVs.svg";
	if (type === Heriverse.NODETYPES.USD) return iconFolder + "USD.svg";
	if (type === Heriverse.NODETYPES.SERIALSU) return iconFolder + "serSU.svg";
	if (type === Heriverse.NODETYPES.VSF) return iconFolder + "VSF.svg";

	if (type === Heriverse.NODETYPES.COMBINER) return iconFolder + "combiner.svg";
	if (type === Heriverse.NODETYPES.EXTRACTOR) return iconFolder + "extractor.svg";
	if (type === Heriverse.NODETYPES.DOCUMENT) return iconFolder + "document.svg";
	if (type === Heriverse.NODETYPES.PROPERTY) return iconFolder + "property.svg";
	if (type === Heriverse.NODETYPES.CONTINUITY) return iconFolder + "continuity.svg";
	if (type === Heriverse.NODETYPES.REPRESENTATION_MODEL)
		return iconFolder + "representation_model.svg";
	if (type === Heriverse.NODETYPES.REPRESENTATION_MODEL_DOC)
		return iconFolder + "representation_model_doc.svg";
	if (type === Heriverse.NODETYPES.REPRESENTATION_MODEL_SF)
		return iconFolder + "representation_model_sf.svg";
	if (type === Heriverse.NODETYPES.SEMANTIC_SHAPE) return iconFolder + "semantic_shape.svg";
	if (type === Heriverse.NODETYPES.LINK) return iconFolder + "link.svg";
	if (type === Heriverse.NODETYPES.EPOCHNODE) return iconFolder + "EpochNode.svg";
	if (type === Heriverse.NODETYPES.AUTHOR) return iconFolder + "author.svg";
	if (type === Heriverse.NODETYPES.GEO_POSITION) return iconFolder + "geo_position.svg";
	if (type === Heriverse.NODETYPES.ACTIVITYNODEGROUP) return iconFolder + "ActivityNodeGroup.svg";
	if (type === Heriverse.NODETYPES.PARADATANODEGROUP) return iconFolder + "ParadataNodeGroup.svg";

	return iconFolder + "general_node.svg";
};

Heriverse.getModelURLbyType = (type) => {
	if (type === Heriverse.NODETYPES.SERIATION) return modelFolder + "SUseries.glb";
	if (type === Heriverse.NODETYPES.US) return modelFolder + "US.glb";
	if (type === Heriverse.NODETYPES.USVS) return modelFolder + "USVs.glb";
	if (type === Heriverse.NODETYPES.USVN) return modelFolder + "USVn.glb";
	if (type === Heriverse.NODETYPES.SF) return modelFolder + "SF.glb";
	if (type === Heriverse.NODETYPES.UTR) return modelFolder + "UTR.glb";
	if (type === Heriverse.NODETYPES.SERUSVN) return modelFolder + "serUSVn.glb";
	if (type === Heriverse.NODETYPES.SERUSVS) return modelFolder + "serUSVs.glb";
	if (type === Heriverse.NODETYPES.USD) return modelFolder + "USD.glb";
	if (type === Heriverse.NODETYPES.SERIALSU) return modelFolder + "serSU.glb";
	if (type === Heriverse.NODETYPES.VSF) return modelFolder + "VSF.glb";

	if (type === Heriverse.NODETYPES.COMBINER) return modelFolder + "combiner.glb";
	if (type === Heriverse.NODETYPES.EXTRACTOR) return modelFolder + "extractor.glb";
	if (type === Heriverse.NODETYPES.DOCUMENT) return modelFolder + "document.glb";
	if (type === Heriverse.NODETYPES.PROPERTY) return modelFolder + "property.glb";
	if (type === Heriverse.NODETYPES.CONTINUITY) return modelFolder + "continuity.glb";
	return "";
};

Heriverse.getDosCoBaseURL = () => {
	return "";
};

Heriverse.getCRNodeTypeByNodeType = (type) => {
	if (Object.values(HeriverseNode.STRATIGRAPHIC_TYPE).includes(type))
		return Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC;

	switch (type) {
		case HeriverseNode.TYPE.PROPERTIES:
		case HeriverseNode.NODE_TYPE.PROPERTY:
			return Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY;
		case HeriverseNode.TYPE.EXTRACTORS:
		case HeriverseNode.NODE_TYPE.EXTRACTOR:
			return Heriverse.CONNECTION_RULES_NODETYPES.EXTRACTOR;
		case HeriverseNode.TYPE.COMBINERS:
		case HeriverseNode.NODE_TYPE.COMBINER:
			return Heriverse.CONNECTION_RULES_NODETYPES.COMBINER;
		case "time_branch_group":
			return Heriverse.CONNECTION_RULES_NODETYPES.TIME_BRANCH_GROUP;
		case HeriverseNode.TYPE.REPRESENTATION_MODELS:
		case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL:
			return Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL;
		case HeriverseNode.TYPE.REPRESENTATION_MODEL_DOC:
		case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC:
			return Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_DOC;
		case HeriverseNode.TYPE.REPRESENTATION_MODEL_SF:
		case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF:
			return Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_SF;
		case HeriverseNode.TYPE.EPOCHS:
		case HeriverseNode.NODE_TYPE.EPOCH:
			return Heriverse.CONNECTION_RULES_NODETYPES.EPOCH;
		case "paradata":
			return Heriverse.CONNECTION_RULES_NODETYPES.PARADATA;
		case "parada_group":
			return Heriverse.CONNECTION_RULES_NODETYPES.PARADATA_GROUP;
		case HeriverseNode.TYPE.DOCUMENTS:
		case HeriverseNode.NODE_TYPE.DOCUMENT:
			return Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT;
		case "activity_group":
			return Heriverse.CONNECTION_RULES_NODETYPES.ACTIVITY_GROUP;
		case "graph":
			return Heriverse.CONNECTION_RULES_NODETYPES.GRAPH;
		case HeriverseNode.TYPE.GEO:
		case HeriverseNode.NODE_TYPE.GEO:
			return Heriverse.CONNECTION_RULES_NODETYPES.GEO_POSITION;
		case HeriverseNode.STRATIGRAPHIC_TYPE.SF:
			return Heriverse.CONNECTION_RULES_NODETYPES.SPECIAL_FIND_UNIT;
		case "node":
			return Heriverse.CONNECTION_RULES_NODETYPES.NODE;
		case HeriverseNode.TYPE.SEMANTIC_SHAPES:
		case HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE:
			return Heriverse.CONNECTION_RULES_NODETYPES.SEMANTIC_SHAPE;
		case "license":
			return Heriverse.CONNECTION_RULES_NODETYPES.LICENSE;
		case "embargo":
			return Heriverse.CONNECTION_RULES_NODETYPES.EMBARGO;
		case HeriverseNode.TYPE.LINKS:
		case HeriverseNode.NODE_TYPE.LINK:
			return Heriverse.CONNECTION_RULES_NODETYPES.LINK;
		case HeriverseNode.TYPE.AUTHORS:
		case HeriverseNode.NODE_TYPE.AUTHOR:
			return Heriverse.CONNECTION_RULES_NODETYPES.AUTHOR;
		default:
			return type;
	}
};

Heriverse.getNodeTypeByCRNodeType = (crNodeType) => {
	switch (crNodeType) {
		case Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC:
			return HeriverseNode.NODE_TYPE.STRATIGRAPHIC;
		case Heriverse.CONNECTION_RULES_NODETYPES.AUTHOR:
			return HeriverseNode.NODE_TYPE.AUTHOR;
		case Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY:
			return HeriverseNode.NODE_TYPE.PROPERTY;
		case Heriverse.CONNECTION_RULES_NODETYPES.EXTRACTOR:
			return HeriverseNode.NODE_TYPE.EXTRACTOR;
		case Heriverse.CONNECTION_RULES_NODETYPES.COMBINER:
			return HeriverseNode.NODE_TYPE.COMBINER;
		case Heriverse.CONNECTION_RULES_NODETYPES.TIME_BRANCH_GROUP:
			return "time_branch_group";
		case Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL:
			return HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL;
		case Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_DOC:
			return HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC;
		case Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_SF:
			return HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF;
		case Heriverse.CONNECTION_RULES_NODETYPES.EPOCH:
			return HeriverseNode.NODE_TYPE.EPOCH;
		case Heriverse.CONNECTION_RULES_NODETYPES.PARADATA:
			return "paradata";
		case Heriverse.CONNECTION_RULES_NODETYPES.PARADATA_GROUP:
			return "parada_group";
		case Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT:
			return HeriverseNode.NODE_TYPE.DOCUMENT;
		case Heriverse.CONNECTION_RULES_NODETYPES.ACTIVITY_GROUP:
			return "activity_group";
		case Heriverse.CONNECTION_RULES_NODETYPES.GRAPH:
			return "graph";
		case Heriverse.CONNECTION_RULES_NODETYPES.GEO_POSITION:
			return HeriverseNode.NODE_TYPE.GEO;
		case Heriverse.CONNECTION_RULES_NODETYPES.SPECIAL_FIND_UNIT:
			return HeriverseNode.STRATIGRAPHIC_TYPE.SF;
		case Heriverse.CONNECTION_RULES_NODETYPES.NODE:
			return "node";
		case Heriverse.CONNECTION_RULES_NODETYPES.SEMANTIC_SHAPE:
			return HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE;
		case Heriverse.CONNECTION_RULES_NODETYPES.LICENSE:
			return "license";
		case Heriverse.CONNECTION_RULES_NODETYPES.EMBARGO:
			return "embargo";
		case Heriverse.CONNECTION_RULES_NODETYPES.LINK:
			return HeriverseNode.NODE_TYPE.LINK;
		default:
			return crNodeType;
	}
};

Heriverse.buildColorPalette = () => {
	Heriverse.colors = [];

	let gm = 4.0;
	let rm = 2.0;

	let gcol = new THREE.Color(0.031 * gm, 0.191 * gm, 0.026 * gm);
	let rcol = new THREE.Color(0.328 * rm, 0.033 * rm, 0.033 * rm);

	Heriverse.colors.push(gcol);
	Heriverse.colors.push(rcol);
	Heriverse.colors.push(new THREE.Color(0.018, 0.275, 0.799));
	Heriverse.colors.push(gcol);
	Heriverse.colors.push(new THREE.Color(0.799, 0.753, 0.347));

	Heriverse.matProxyOFF = [];
	Heriverse.matProxyON = [];

	for (let i in Heriverse.colors) {
		Heriverse.matProxyOFF.push(
			new THREE.MeshStandardMaterial({
				color: Heriverse.colors[i],
				transparent: true,
				depthWrite: false,
				opacity: 0.0, //0.2,
				//flatShading: true,
				depthTest: true,
				//side: THREE.DoubleSide
				//polygonOffset: true,
				//polygonOffsetFactor: -1,
				//polygonOffsetUnits: 1,
				//renderOrder: 2
			})
		);

		Heriverse.matProxyON.push(
			new THREE.MeshStandardMaterial({
				color: Heriverse.colors[i],
				transparent: true,
				depthWrite: false,
				opacity: 0.4,
			})
		);
	}
};

Heriverse.setProxiesOpacity = (f) => {
	for (let m in Heriverse.matProxyOFF) {
		Heriverse.matProxyOFF[m].opacity = f;
		Heriverse.matProxyON[m].opacity = f + 0.1;
	}
};

Heriverse.setProxiesAlwaysVisible = (b) => {
	Heriverse._bProxiesAlwaysVis = b;

	for (let m in Heriverse.matProxyOFF) {
		Heriverse.matProxyOFF[m].depthTest = !b;
		Heriverse.matProxyON[m].depthTest = !b;
	}
};

Heriverse.init = async (page) => {
	if (page == "editor") {
		Heriverse.MODE = Heriverse.MODETYPES.EDITOR;
	} else {
		Heriverse.MODE = Heriverse.MODETYPES.SCENE;
	}

	if (page == "scenes") {
		Heriverse.MODE = Heriverse.MODETYPES.SCENES;
		return;
	}

	if (page == "dashboard") {
		Heriverse.MODE = Heriverse.MODETYPES.SCENES;
		return;
	}

	Heriverse.APP.setup = () => {
		ATON.FE.realize();
		ATON.AuthOptions = {
			basepath: "heriverse",
			scenesPage: Utils.baseUrl + "/scenes",
			logo_pilot_header: Utils.baseUrl + "/assets/logo/heriverse_logo_horizontal.svg",
			logo_pilot_footer: Utils.baseUrl + "/assets/logo/heriverse_logo_horizontal.svg",
			logo_pilot_label_header: "Heriverse",
			logo_pilot_label_footer: "Heriverse",
			logo_pilot_header_url: Utils.pilotSite,
			logo_pilot_url_footer: Utils.pilotSite,
			header_title: "HERIVERSE",
			header_subtitle: "SELECT_A_SCENE",
			open_card_label: "OPEN_SCENE",
			search_params: ["title"],
		};
		Heriverse.APP.requireFlares(["Auth"]);
		ATON.on("AllFlaresReady", async () => {
			if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
				ATON.Flares["Auth"].canEditScene(Heriverse.paramSID).then((isEditor) => {
					if (!isEditor) {
						let locComp = window.location.href.split("/editor");
						window.location.href = Utils.baseUrl + "/?scene=" + Heriverse.paramSID;
					} else {
						Heriverse.MODE = Heriverse.MODETYPES.EDITOR;
					}
				});
			}
		});
	};
	Heriverse.APP.run();

	Heriverse.paramSID = ATON.FE.urlParams.get("scene");
	Heriverse.currPeriodName = undefined;
	Heriverse.currGraphId = "";
	Heriverse.currGraphName = "";
	Heriverse._bShowAllProxies = false;

	Heriverse.buildColorPalette();
	ATON.FE.setupBasicUISounds();
	if (page == "editor") {
		Heriverse.MODE = Heriverse.MODETYPES.EDITOR;
	} else {
		Heriverse.MODE = Heriverse.MODETYPES.SCENE;
	}

	Heriverse.setupUI();
	Heriverse.setupEventHandlers();

	// Accessibility
	Heriverse.HERUI.setupFontSizeAccessibility();

	// $("body").prepend(
	// 	"<div class='atonPopupLabelContainer'><div id='idPovLabel' class='atonPopupLabel' style='display:none'></div></div>"
	// );

	if ($("#idLoader")[0]) $("#idLoader").show();
	Heriverse.loadRules();
};

Heriverse.loadRules = async () => {
	try {
		await Promise.all([
			Heriverse.setupPropertiesRules(Heriverse.propertiesRulesPath),
			Heriverse.setupConnectionRules(Heriverse.connectionRulePath),
			Heriverse.setupSemanticShapeMaterial(Heriverse.semanticMaterialRulePath),
		]);
		console.log("All rules loaded successfully");
		if (!window.trad) {
			window.trad = new Translate({
				defaultLocale: "it",
				supportedLocales: ["it", "en"],
				langSwitcherSelector: "#lang-switcher",
			});
		}
		Heriverse.run();
	} catch (error) {
		console.error("Error loading rules: ", error);
	}
};

Heriverse.setPointerLockControl = () => {
	if (ATON.XR.isPresenting()) return;

	ATON.Nav._prevMode = ATON.Nav._mode;

	ATON.Nav._mode = Heriverse.MODE_POINTER_LOCK;
	ATON.Nav._Interacting = false;
	ATON.fire("NavInteraction", false);

	if (Heriverse.cPointerLock === undefined) {
		Heriverse.camPointerLock = new THREE.PerspectiveCamera(
			Nav.STD_FOV,
			window.innerWidth / window.innerHeight,
			Nav.STD_NEAR,
			Nav.STD_FAR
		);
		Heriverse.camPointerLock.layers.enableAll();

		Heriverse.cPointerLock = new PointerLockControls(
			Heriverse.camPointerLock,
			ATON._renderer.domElement
		);
	}
};

Heriverse.redirectToDashboardPage = () => {
	Heriverse.HERUI.buildDashboardUI();
};

Heriverse.refresh = (data, shelf_update = false) => {
	if (data) {
		if (shelf_update) {
			Heriverse.Scene = ATON.SceneHub.currData;
			Heriverse.Scene._rev = data._rev;
			Heriverse.ResourceScene.resource_json.multigraph.graphs.shelf =
				data.resource_json.multigraph.graphs.shelf;
			Heriverse.ResourceScene._rev = data._rev;
			Heriverse.loadEM(null, false, true, data.resource_json.multigraph);
		} else {
			ATON.SceneHub.clear();
			ATON.SceneHub.currData = data.resource_json;
			ATON.SceneHub.currID = Heriverse.paramSID;
			ATON.SceneHub.parseScene(data.resource_json);
			ATON.setNeutralAmbientLight();
			Heriverse.Scene = ATON.SceneHub.currData;
			Heriverse.ResourceScene = data;
			Heriverse.loadEM(null, false, true, data.resource_json.multigraph);
		}
	}
	$("#idLoader").hide();
};

Heriverse.run = (firstAttempt = true) => {
	if (Heriverse.paramSID === undefined || Heriverse.paramSID === null) {
		location.href = Utils.baseUrl + "/scenes";
		return;
	}
	$.ajax({
		dataType: "json",
		url: Utils.baseHost + "heriverse/scene/" + Heriverse.paramSID,
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		success: (data) => {
			ATON.SceneHub.currData = data.resource_json;
			ATON.SceneHub.currID = Heriverse.paramSID;
			ATON.SceneHub.parseScene(data.resource_json);
			ATON.SceneHub._bLoading = false;
			Heriverse.Scene = ATON.SceneHub.currData;
			Heriverse.ResourceScene = data;
			if (
				Heriverse.ResourceScene.viewpoints &&
				Object.keys(Heriverse.ResourceScene.viewpoints).length
			)
				Heriverse.fillPovList(Heriverse.ResourceScene.viewpoints);
			Heriverse.loadEM(
				Utils.baseHost + "uploads/" + Heriverse.paramSID,
				false,
				false,
				data.resource_json.multigraph
			);
			//window.trad.init();
		},
		error: (error) => {
			if (error.status == 401 && firstAttempt) {
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
							Heriverse.run(false);
						} else {
							if ($("#idLoader")[0]) $("#idLoader").hide();
							location.href = Utils.baseUrl + "/login";
						}
					});
				}
			}
			if ($("#idLoader")[0]) $("#idLoader").hide();
			location.href = Utils.baseUrl + "/login";
		},
	});
};

Heriverse.getGraphJSON = () => {
	return Heriverse.currMG?.json;
};

Heriverse.syncGraphJSONToScene = () => {
	const graphJSON = Heriverse.getGraphJSON();

	if (!graphJSON) return;

	Heriverse.Scene.multigraph = graphJSON;
	Heriverse.ResourceScene.resource_json.multigraph = graphJSON;
};

function clearAtonSceneRoots() {
	ATON._rootSem.removeChildren();

	ATON._rootVisible.children.forEach((nodeGroup) => {
		if (nodeGroup && typeof nodeGroup.removeChildren === "function") nodeGroup.removeChildren();
	});

	if (Heriverse.currMG) {
		Heriverse.currMG.proxyNodes = {};
	}
}

function restoreCurrentGraphIfNeeded() {
	if (
		Heriverse.currGraphId ||
		!Object.keys(Heriverse.ResourceScene.resource_json.multigraph.graphs).length
	)
		return;

	Heriverse.currGraphId = Heriverse.graphToRestore
		? Heriverse.graphToRestore
		: Object.keys(Heriverse.ResourceScene.resource_json.multigraph.graphs)[0];
	Heriverse.currGraphName =
		Heriverse.ResourceScene.resource_json.multigraph.graphs[Heriverse.currGraphId].name ||
		"GRAPH 1";
	Heriverse.currentGraphs = [Heriverse.currGraphId];
}

function ensureShelfGraph() {
	const multigraph = Heriverse.currMG?.json;

	if (!multigraph?.graphs) return;

	if (!multigraph.graphs.shelf) {
		multigraph.graphs.shelf = {
			name: {
				default: "Resource Shelf",
			},
			description: {},
			data: {
				shelf_type: "global",
			},
			nodes: {},
			edges: {},
		};
	}

	Heriverse.shelf = new Heriverse.ShelfGraph("", Heriverse.currMG.json);
}

function buildTemporalNavigationUI() {
	const selectedPeriodId = Heriverse.currTemporalFilter.id;

	if (Heriverse.currentGraphs.length === 1) {
		Heriverse.HERUI.buildTimelineSelector(Heriverse.timeline, "#idTL", false, selectedPeriodId);
		Heriverse.HERUI.buildTimelineSelector(
			Heriverse.timeline,
			"#periodSectionPanel > div",
			true,
			selectedPeriodId
		);
		return;
	}

	Heriverse.HERUI.buildPeriodFilter("#idTL");
	Heriverse.HERUI.buildPeriodFilter("#periodSectionPanel > div", true);
}

function buildGraphSelectorUI() {
	const graphsCollection = Object.entries(Heriverse.currMG.json.graphs).map(
		([graphKey, graphElem]) => ({ id: graphKey, name: graphElem.name })
	);

	Heriverse.HERUI.buildGraphSelector("#graphSelector", graphsCollection);
}

function applyInitialTemporalFilter() {
	Heriverse.currPeriodIndex = Heriverse.currPeriodIndex | 0;

	if (Heriverse.currentGraphs.length > 1) {
		Heriverse.goToPeriodByValues();
		return;
	}

	if (Heriverse.currentGraphs.length === 1 && Heriverse.temporalFilters.length)
		Heriverse.goToPeriodById(Heriverse.currTemporalFilter.id);
}

function setupModeSpecificUI() {
	if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
		ATON.fire("EM loaded");
		return;
	}

	if (Heriverse.MODE === Heriverse.MODETYPES.SCENE) {
		Heriverse.HERUI.createSettings();
		Heriverse.HERUI.buildRelationsManagement("#relationsCheckboxSection");
	}
}

Heriverse.setScene = () => {
	clearAtonSceneRoots();

	restoreCurrentGraphIfNeeded();

	Heriverse.createEpochNodes();
	// Heriverse.createRepresentationModelNodes();
	Heriverse.createSemanticShapeNodes();

	ensureShelfGraph();

	buildTemporalNavigationUI();

	buildGraphSelectorUI();

	applyInitialTemporalFilter();

	if ($("#idLoader")[0]) $("#idLoader").show();

	if (Heriverse.firstSetup) ATON.fire("EMLoaded", "");

	setupModeSpecificUI();

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);

	$("#idLoader").hide();
};

Heriverse.createEpochNodes = () => {
	let epochs = Heriverse.currMG.timeline;

	Heriverse.timeline = [];
	Heriverse.temporalFilters = [];

	for (let i in epochs) {
		if (!Heriverse.currentGraphs.includes(epochs[i].graph)) continue;

		Heriverse.timeline.push(epochs[i]);

		ATON.createSceneNode(epochs[i].id).attachToRoot();
		// let pGroup = ATON.createSemanticNode(epochs[i].id);
		// pGroup.attachToRoot();
	}

	if (!Heriverse.timeline.length) return;

	if (Heriverse.currMG.json.context && Heriverse.currMG.json.context.absolute_time_Epochs) {
		const timelineFilters = Heriverse.currMG.json.context.absolute_time_Epochs;
		Object.entries(timelineFilters).forEach(([filterId, filterObj]) => {
			Heriverse.temporalFilters.push(
				new Period(filterId, filterObj.name, filterObj.start, filterObj.end, "")
			);
		});
	}

	Heriverse.timeline.sort((a, b) => a.min - b.min);

	Heriverse.currTemporalFilter = Heriverse.tempFilterToRestore
		? Heriverse.tempFilterToRestore
		: Heriverse.timeline[0];

	const firstYear = Heriverse.currMG.nodesByIndex[Heriverse.timeline[0].id].data.start_time;
	let lastEnd;
	for (let epoch of Heriverse.timeline) {
		const currEpoch = Heriverse.currMG.nodesByIndex[epoch.id];

		const epochRelatedFilters = Heriverse.temporalFilters.filter(
			(elem) =>
				(elem.min === firstYear && elem.max === currEpoch.data.end_time) ||
				(lastEnd && elem.min === lastEnd + 1 && elem.max === currEpoch.data.end_time) ||
				(elem.min === currEpoch.data.start_time && elem.max === currEpoch.data.end_time)
		);

		if (
			!epochRelatedFilters.find(
				(elem) => elem.min === firstYear && elem.max === currEpoch.data.end_time
			)
		) {
			Heriverse.temporalFilters.push(
				new Period(
					"custom_" + firstYear + "_to_" + currEpoch.data.end_time,
					firstYear + " to " + currEpoch.data.end_time,
					firstYear,
					currEpoch.data.end_time,
					""
				)
			);
		}
		if (
			lastEnd &&
			lastEnd + 1 < currEpoch.data.end_time &&
			!epochRelatedFilters.find(
				(elem) => elem.min === lastEnd + 1 && elem.max === currEpoch.data.end_time
			)
		) {
			let starting_point = lastEnd + 1;
			Heriverse.temporalFilters.push(
				new Period(
					"custom_" + starting_point + "_to_" + currEpoch.data.end_time,
					starting_point + " to " + currEpoch.data.end_time,
					starting_point,
					currEpoch.data.end_time,
					""
				)
			);
		}
		lastEnd = currEpoch.data.end_time;
	}
};

Heriverse.currTemporalFilter = null;

Heriverse.createRepresentationModelNodes = () => {
	let rnodes = Heriverse.currMG.representationNodes;
	for (let id in rnodes) {
		let rn = rnodes[id];
		if (!Heriverse.currentGraphs.includes(rn.graph)) continue;
		let generics = rn.getNeighborsByRelation(
			HeriverseNode.RELATIONS.HAS_REPRESENTATION_MODEL,
			HeriverseNode.DIRECTIONS.FROM
		);
		for (let gen in generics) {
			let e = Heriverse.currMG.getNode(gen);
			if (Heriverse.currTemporalFilter.id == e.id) {
				let name = rn.name;
				let url = Heriverse.getLinkFromRepresentationModel(rn);
				let res_url = Heriverse.getLinkToResource(url);
				let sn = ATON.createSceneNode(name);
				sn.load(res_url, () => {
					sn.removeFromParent();
					if (rn.data.transform) {
						let rot = rn.data.transform.rotation;
						let pos = rn.data.transform.position;
						let scl = rn.data.transform.scale;
						if (rot) {
							sn.setRotation(rot[0], rot[1], rot[2]);
						}
						if (pos) {
							sn.setPosition(pos[0], pos[1], pos[2]);
						}
						if (scl) {
							sn.setScale(scl[0], scl[1], scl[2]);
						}
					}
				});
			}
		}
	}
};

Heriverse.getLinkFromRepresentationModel = (node) => {
	let links = node.getNeighborsByRelation(
		HeriverseNode.RELATIONS.HAS_LINKED_RESOURCE,
		HeriverseNode.DIRECTIONS.TO
	);
	for (let link_id in links) {
		let link = links[link_id];
		if (link.data && link.data.url_type === "3d_model") {
			return link.data.url;
		}
	}
	return "";
};

function getConvexShapePoints(shape) {
	const convexshape = shape?.data?.convexshape;

	if (!convexshape) return [];

	const shapePoints = Array.isArray(convexshape)
		? convexshape
		: convexshape.object?.userData?._convexPoints || [];

	if (!shapePoints.length) return [];

	if (typeof shapePoints[0] === "number") {
		let points = [];

		for (let i = 0; i < shapePoints.length; i += 3) {
			points.push(new THREE.Vector3(shapePoints[i], shapePoints[i + 1], shapePoints[i + 2]));
		}

		return points;
	}

	return shapePoints.map((point) => new THREE.Vector3(point.x, point.y, point.z));
}

function createSemanticNodeFromShape(name, shape) {
	const url = shape?.data?.url;

	if (url) {
		return ATON.createSemanticNode(name).load(Heriverse.getLinkToResource(url));
	}

	return ATON.SemFactory.createConvexShape(name, getConvexShapePoints(shape));
}

function applySemanticShapeMaterials(semNode, stratigraphicNode) {
	const defaultMaterial = Heriverse.semantic_shapes_materials[stratigraphicNode.type + "_OFF"];
	const highlightMaterial = Heriverse.semantic_shapes_materials[stratigraphicNode.type + "_ON"];

	semNode.setDefaultAndHighlightMaterials(defaultMaterial, highlightMaterial);
	semNode.setMaterial(defaultMaterial);
}

function ensureSemanticShapeProxy(stratigraphicNode, shape) {
	const name = stratigraphicNode.name;

	if (Heriverse.currMG.proxyNodes[name]) return Heriverse.currMG.proxyNodes[name];

	const semNode = createSemanticNodeFromShape(name, shape);

	applySemanticShapeMaterials(semNode, stratigraphicNode);

	semNode.attachToRoot();

	Heriverse.currMG.proxyNodes[name] = new Proxy(shape, stratigraphicNode);

	return Heriverse.currMG.proxyNodes[name];
}

function isEpochCurrentTemporalFilter(epochId) {
	const epoch = Heriverse.currMG.getNode(epochId);

	return epoch && Heriverse.currTemporalFilter?.id === epoch.id;
}

Heriverse.createSemanticShapeNodes = () => {
	let stratigraphicNodes = Heriverse.currMG.stratigraphicNodes;

	for (const stratigraphicNode of Object.values(stratigraphicNodes)) {
		if (!Heriverse.currentGraphs.includes(stratigraphicNode.graph)) continue;

		let first_epochs = stratigraphicNode.getNeighborsByType("EpochNode");
		let semantic_shapes = stratigraphicNode.getNeighborsByType("semantic_shape");

		for (let epochId in first_epochs) {
			if (!isEpochCurrentTemporalFilter(epochId)) continue;

			for (const shape of Object.values(semantic_shapes)) {
				const proxy = ensureSemanticShapeProxy(stratigraphicNode, shape);

				proxy.addEpoch(epochId);
			}
		}
	}
};

Heriverse.loadEM = (url, bReload, refresh = false, data = null) => {
	ATON._rootVisible.removeChildren();
	ATON._rootSem.removeChildren();

	if (!refresh) {
		Heriverse.currMG = new Heriverse.HeriverseGraph(url + "/projedct.json", data);
	}

	Heriverse.currMG.readJson(Heriverse.setScene);

	$("#idLoader").show();

	if (!refresh) {
		Heriverse.addTopToolbarBtns(Heriverse.MODE);
		Heriverse.HERUI.createTitle(Heriverse.Scene.title);
	}

	if (
		data &&
		data.resource_json &&
		data.resource_json.multigraph &&
		data.resource_json.multigraph.graphs
	) {
		Heriverse.currGraphId = Heriverse.graphToRestore
			? Heriverse.graphToRestore
			: Object.keys(data.resource_json.multigraph.graphs)[0];
		Heriverse.currGraphName = data.resource_json.multigraph.graphs[Heriverse.currGraphId].name;
	}

	if (bReload) {
		Heriverse.currMG.buildContinuity();
		Heriverse.currMG.buildRec();
	}
	$("#idLoader").hide();
	Heriverse.firstSetup = false;
};

Heriverse.goToLoginPage = () => {
	window.location.assign(Utils.baseUrl + "/login");
};

Heriverse.goToScenesPage = () => {
	window.location.assign(Utils.baseUrl + "/scenes");
};

Heriverse.addTopToolbarBtns = () => {
	Heriverse.HERUI.buildTopToolbar({
		mode: Heriverse.MODE,
		modeTypes: Heriverse.MODETYPES,
		isVRSupported: ATON.Utils.isVRsupported(),
		isLogged: !!localStorage.getItem("user_email"),
		userName: localStorage.getItem("user_name") || "",
		userSurname: localStorage.getItem("user_surname") || "",
		handlers: {
			onTogglePeriodPanel: () => {
				$("#periodSectionPanel").toggleClass("hidden contents");
				Heriverse.HERUI.clickToolbarBtn("periodSection");
			},
			onToggleXR: () => ATON.XR.toggle("immersive-vr"),
			onTogglePanel: ({ panel, id }) => {
				ATON.fire(HeriverseEvents.Events.TOGGLE_PANEL, { panel, id });
			},
			onDisableEditor: () => {
				if (Editor && Editor.semanticShapeDrawingActive)
					ATON.fire("SemanticShapeDrawingMode", true);
				window.location.href = Utils.baseUrl + "/?scene=" + Heriverse.paramSID;
			},
			onEnableEditor: () => {
				if (AUTH.canEditScene(Heriverse.paramSID))
					window.location.href = Utils.baseUrl + "/editor/?scene=" + Heriverse.paramSID;
				else window.location.href = Utils.baseUrl + "/login";
			},
			onGoHome: () => {
				Heriverse.goToScenesPage();
			},
		},
	});
};

Heriverse.setupUI = () => {
	Heriverse.setupSearchUI();
};

Heriverse.setupSearchUI = () => {
	Heriverse.HERUI.setupSearchUI({
		handlers: {
			onSearch: (value) => {
				Heriverse.search(value);
			},
			onFocus: () => {
				ATON._bListenKeyboardEvents = false;
				ATON._bPauseQuery = true;
				ATON.SUI.infoNode.visible = false;
			},
			onBlur: () => {
				ATON._bListenKeyboardEvents = true;
				if (ATON.FE._bPopup) ATON._bPauseQuery = false;
			},
		},
	});
};

Heriverse.setState = ({ graphId, tempFilter, selectedNode }) => {
	Heriverse.tempFilterToRestore = tempFilter;
	Heriverse.graphToRestore = graphId;
	Heriverse.selectedNodeToRestore = selectedNode;
};

Heriverse.rm_in_scene = {};

let plcTargetPoint;
Heriverse.mousePosition = new THREE.Vector2();

Heriverse.setupEventHandlers = () => {
	ATON.FE.addBasicLoaderEvents();

	window.addEventListener("pointermove", (e) => {
		Heriverse.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
		Heriverse.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
	});

	window.addEventListener("resize", () => {
		if (Heriverse._orthoCam) {
			const aspect = window.innerWidth / window.innerHeight;
			const frustumSize = 40;
			Heriverse._orthoCam.left = -frustumSize * aspect;
			Heriverse._orthoCam.right = frustumSize * aspect;
			Heriverse._orthoCam.top = frustumSize;
			Heriverse._orthoCam.bottom = -frustumSize;
			Heriverse._orthoCam.updateProjectionMatrix();
		}
	});

	window.addEventListener("keydown", (e) => {
		if (e.key === "Control") Heriverse._ctrlHeld = true;

		// Prevent browser shortuct for Ctrl+1/3/7
		if (e.ctrlKey && /^\d$/.test(e.key)) {
			e.preventDefault();
		}

		ATON.fire("KeyDown", e.key);
	});

	window.addEventListener("keyup", (e) => {
		if (e.key === "Control") Heriverse._ctrlHeld = false;
	});

	ATON.on("Tap", (e) => {
		if (HeriverseGraphDrawer && HeriverseGraphDrawer.proxyActivated) return;
		let node = null;

		if (ATON._hoveredSemNode) {
			let proxy = Heriverse.currMG.proxyNodes[ATON._hoveredSemNode];
			if (Heriverse.ActualProxy && ATON.getSemanticNode(Heriverse.ActualProxy)) {
				ATON.getSemanticNode(Heriverse.ActualProxy).restoreDefaultMaterial();
			}
			if (proxy) {
				Heriverse.ActualProxy = ATON._hoveredSemNode;
				ATON.getSemanticNode(proxy.node.name).highlight();
				node = proxy.node;
			}
		}
		Heriverse.HERUI.createSidebar(node);
	});

	ATON.on("KeyDown", (k) => {
		if (k === "w") {
			if (
				Heriverse.MODE === Heriverse.MODETYPES.SCENE ||
				Heriverse.MODE === Heriverse.MODETYPES.EDITOR
			) {
				if (Heriverse.pointerLockControlsActive) {
					Heriverse.pointerLockControls.getObject().translateZ(-0.25);
				}
			}
		} else if (k === "a") {
			if (
				Heriverse.MODE === Heriverse.MODETYPES.SCENE ||
				Heriverse.MODE === Heriverse.MODETYPES.EDITOR
			) {
				if (Heriverse.pointerLockControlsActive) {
					Heriverse.pointerLockControls.getObject().translateX(-0.25);
				}
			}
		} else if (k === "d") {
			if (
				Heriverse.MODE === Heriverse.MODETYPES.SCENE ||
				Heriverse.MODE === Heriverse.MODETYPES.EDITOR
			) {
				if (Heriverse.pointerLockControlsActive) {
					Heriverse.pointerLockControls.getObject().translateX(0.25);
				}
			}
		} else if (k === "s") {
			if (
				Heriverse.MODE === Heriverse.MODETYPES.SCENE ||
				Heriverse.MODE === Heriverse.MODETYPES.EDITOR
			) {
				if (Heriverse.pointerLockControlsActive) {
					Heriverse.pointerLockControls.getObject().translateZ(0.25);
				}
			}
		}
	});

	ATON.on("KeyPress", (k) => {
		console.log("K", k);
		const d = 40;

		let focusedInputs = document.querySelector("input:focus, textarea:focus");
		if (focusedInputs) return;

		if (k === "m") Heriverse.measure();
		else if (k === "x") ATON._bPauseQuery = !ATON._bPauseQuery;
		else if (k === "l") {
			if (Heriverse._bDirectionalLight) {
				ATON.FE.controlLight(true);
			}
		} else if (k === "Escape") {
			if (document.querySelector(".genSettingsContainer")) {
				Heriverse.HERUI.closeGeneralSettingsPanel();
			}
		} else if (k === "w") {
			if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
				ATON.fire(HeriverseEvents.Events.TOGGLE_PANEL, {
					panel: "#workspace-panel",
					id: "workspace",
				});
			}
		} else if (k === "s") {
			if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
				ATON.fire(HeriverseEvents.Events.TOGGLE_PANEL, { panel: "#shelf-panel", id: "shelf" });
			}
		} else if (k === "t") {
			if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
				ATON.fire(HeriverseEvents.Events.TOGGLE_PANEL, { panel: "#right-panel", id: "tools" });
			}
		} else if (k === "r") {
			if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
				ATON.fire(HeriverseEvents.Events.TOGGLE_PANEL, {
					panel: "#tranPan-panel",
					id: "transform",
				});
			}
		} else if (k === "e") {
			if (
				Heriverse.MODE === Heriverse.MODETYPES.EDITOR ||
				Heriverse.MODE === Heriverse.MODETYPES.SCENE
			) {
				ATON.fire(HeriverseEvents.Events.SET_SHOW_ENV_SETTINGS);
			}
		} else if (k === "v") {
			if (
				Heriverse.MODE === Heriverse.MODETYPES.EDITOR ||
				Heriverse.MODE === Heriverse.MODETYPES.SCENE
			) {
				ATON.fire(HeriverseEvents.Events.SET_SHOW_VIEWPOINTS);
			}
		}

		// Viewpoints
		else if (k === "1") {
			if (Heriverse._ctrlHeld) {
				// ctrl+1: Back
				ATON.Nav.requestPOV(new ATON.POV().setPosition(0, 0, -d).setTarget(0, 0, 0));
			} else {
				// 1: Front
				ATON.Nav.requestPOV(new ATON.POV().setPosition(0, 0, d).setTarget(0, 0, 0));
			}
		} else if (k === "3") {
			if (Heriverse._ctrlHeld) {
				// ctrl+3: Left
				ATON.Nav.requestPOV(new ATON.POV().setPosition(-d, 0, 0).setTarget(0, 0, 0));
			} else {
				// 3: Right
				ATON.Nav.requestPOV(new ATON.POV().setPosition(d, 0, 0).setTarget(0, 0, 0));
			}
		} else if (k === "7") {
			if (Heriverse._ctrlHeld) {
				// ctrl+7: Bottom
				ATON.Nav.requestPOV(new ATON.POV().setPosition(0, -d, 0).setTarget(0, 0, 0));
			} else {
				// 7: Top
				ATON.Nav.requestPOV(new ATON.POV().setPosition(0, d, 0).setTarget(0, 0, 0));
			}
		} else if (k === "2") {
			// 2: Isometrica top-right-front
			ATON.Nav.requestPOV(new ATON.POV().setPosition(d, d, d).setTarget(0, 0, 0));
		} else if (k === "4") {
			// 4: Isometrica top-left-front
			ATON.Nav.requestPOV(new ATON.POV().setPosition(-d, d, d).setTarget(0, 0, 0));
		} else if (k === "6") {
			// 6: Isometrica back-left
			ATON.Nav.requestPOV(new ATON.POV().setPosition(-d, d, -d).setTarget(0, 0, 0));
		} else if (k === "8") {
			// 8: Isometrica back-right
			ATON.Nav.requestPOV(new ATON.POV().setPosition(d, d, -d).setTarget(0, 0, 0));
		} else if (k === "5") {
			// 5: Toggle orthographic / perspective
			Heriverse.toggleOrthographicCamera();
		}
	});

	ATON.on("KeyUp", (k) => {
		if (k === "l") {
			if (Heriverse._bDirectionalLight) {
				ATON.FE.controlLight(false);

				let D = ATON.getMainLightDirection();

				let E = {};
				E.environment = {};
				E.environment.mainlight = {};
				E.environment.mainlight.direction = [D.x, D.y, D.z];
				E.environment.mainlight.shadows = ATON._renderer.shadowMap.enabled;

				ATON.SceneHub.patch(E, ATON.SceneHub.MODE_ADD);
				ATON.Photon.fire("AFE_AddSceneEdit", E);
			}
		}
	});

	ATON.on("AllNodeRequestsCompleted", () => {
		ATON.setNeutralAmbientLight();
	});

	ATON.on("AllNodeRequestsCompleted", () => {
		Heriverse.currMG.buildContinuity();
		Heriverse.currMG.buildRec();
		ATON.SUI.setSelectorRadius(0.1);
	});

	ATON.on("CloseSidebar", () => {
		let S = ATON.getSemanticNode(Heriverse.ActualProxy);

		if (S) {
			Heriverse.ActualProxy = null;
			S.restoreDefaultMaterial();
		}
	});

	ATON.on(HeriverseEvents.Events.SHOW_SEMANTIC_NODE, (semid) => {
		let node = Heriverse.currMG.getNode(semid);
		if (!node) return;
		else if (Heriverse.HERUI.navigateToSidebarNodeIfPresent(node)) {
			return;
		}
		Heriverse.ActualProxy = node.name;
		Heriverse.highlightProxies([node.name]);
		Heriverse.HERUI.populateSideBar(node);
		// HeriverseGraphDrawer.clearAll();
		// HeriverseGraphDrawer.drawGraph(Heriverse.currMG.proxyNodes[node.name]);
		ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
	});

	ATON.on(HeriverseEvents.Events.SHOW_DOCUMENT_LINK, (docId) => {
		if (!ATON.XR.isPresenting()) return;
		let docNode = Heriverse.currMG.getNode(docId);
		let docsRM =
			docNode.neighbors.link &&
			Object.values(docNode.neighbors.link).length &&
			docNode.neighbors.representation_model_doc &&
			Object.values(docNode.neighbors.representation_model_doc).length
				? Object.values(docNode.neighbors.link).concat(
						Object.values(docNode.neighbors.representation_model_doc)
					)
				: docNode.neighbors.link && Object.values(docNode.neighbors.link).length
					? Object.values(docNode.neighbors.link)
					: docNode.neighbors.representation_model_doc &&
						  Object.values(docNode.neighbors.representation_model_doc).length
						? Object.values(docNode.neighbors.representation_model_doc)
						: [];

		if (!docsRM.length) return;

		docsRM.forEach(async (docRM) => {
			const multimedUrl = docRM.data.url;
			let sceneElem;
			if (ATON.Utils.isImage(multimedUrl)) {
				ATON.Utils.textureLoader.setCrossOrigin("anonymous");
				const texture = await ATON.Utils.textureLoader.loadAsync(multimedUrl);
				texture.colorSpace = THREE.SRGBColorSpace;

				const aspect = texture.image.width / texture.image.height;
				const planeHeight = 2;
				const planeWidth = planeHeight * aspect;

				const plGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
				const plMaterial = new THREE.MeshBasicMaterial({
					map: texture,
					transparent: true,
					side: THREE.DoubleSide,
				});

				sceneElem = new THREE.Mesh(plGeometry, plMaterial);
				let sN = ATON.createSceneNode();
				sN.add(sceneElem);

				if (docRM.transform) {
					if (docRM.transform.position) {
						let positionJson = docRM.transform.position;
						sN.position.set(positionJson[0], positionJson[1], positionJson[2]);
					}
					if (docRM.transform.rotation) {
						let rotationJson = docRM.transform.rotation;
						sN.rotation.set(rotationJson[0], rotationJson[1], rotationJson[2]);
					}
					if (docRM.transform.scale) {
						let scaleJson = docRM.transform.scale;
						sN.scale.set(scaleJson[0], scaleJson[1], scaleJson[2]);
					}
				}

				sN.attachToRoot();
			} else {
				let docRMNode = ATON.createSceneNode().load(docRM.data.url, () => {
					let model = docRMNode;
					if (docRM.transform) {
						if (docRM.transform.position) {
							let positionJson = docRM.transform.position;
							model.position.set(positionJson[0], positionJson[1], positionJson[2]);
						}
						if (docRM.transform.rotation) {
							let rotationJson = docRM.transform.rotation;
							model.rotation.set(rotationJson[0], rotationJson[1], rotationJson[2]);
						}
						if (docRM.transform.scale) {
							let scaleJson = docRM.transform.scale;
							model.scale.set(scaleJson[0], scaleJson[1], scaleJson[2]);
						}
					}
				});

				docRMNode.attachToRoot();
				Heriverse.rm_in_scene[docRMNode.id] = docRMNode;
			}
		});
	});

	ATON.on(HeriverseEvents.Events.CHANGE_LIGHT_INTENSITY, (intensity) => {
		let e = parseFloat(intensity);
		ATON.setExposure(e);
		// ATON.ambLight.intensity = intensity;
	});

	ATON.on(HeriverseEvents.Events.OBJECT_POSITION_CHANGE, (objectData) => {
		if (!objectData.objectName && !objectData.objectType)
			throw new Error("Nome e/o tipo di nodo mancanti/e");
		let objectInstance;
		switch (objectData.objectType) {
			case ATON.NTYPES.SCENE:
				objectInstance = ATON._mainRoot.getObjectByName(objectData.objectName);
				break;
			case ATON.NTYPES.SEM:
				objectInstance = ATON._rootSem.getObjectByName(objectData.objectName);
				break;
			case ATON.NTYPES.UI:
				objectInstance = ATON._rootUI.getObjectByName(objectData.objectName);
				break;
		}

		if (objectInstance !== undefined) {
			objectInstance.position.set(
				objectData.position.x,
				objectData.position.y,
				objectData.position.z
			);
			objectInstance.rotation.set(
				objectData.rotation.x,
				objectData.rotation.y,
				objectData.rotation.z
			);
			objectInstance.scale.set(objectData.scale.x, objectData.scale.y, objectData.scale.z);
		}
	});

	ATON.on(HeriverseEvents.Events.NEW_OBJECT_IN_SCENE, (objectData) => {
		let newNode;
		switch (objectData.objectType) {
			case ATON.NTYPES.SCENE:
				newNode = ATON.createSceneNode();
				break;
			case ATON.NTYPES.SEM:
				newNode = ATON.createSemanticNode();
				break;
			case ATON.NTYPES.UI:
				newNode = ATON.createUINode();
				break;
		}

		newNode.attachToRoot();

		newNode.name = objectData.objectName;
		newNode.userData = objectData.objectUserData;
		newNode.position.copy(objectData.position);
		newNode.rotation.copy(objectData.rotation);
		newNode.scale.copy(objectData.scale);
	});

	ATON.on(HeriverseEvents.Events.REMOVE_OBJECT_FROM_SCENE, (object) => {
		let objectInScene;
		switch (object.type) {
			case ATON.NTYPES.SCENE:
				objectInScene = ATON._mainRoot.getObjectByName(object.name);
				break;
			case ATON.NTYPES.SEM:
				objectInScene = ATON._rootSem.getObjectByName(object.name);
				break;
			case ATON.NTYPES.UI:
				objectInScene = ATON._rootUI.getObjectByName(object.name);
				break;
		}

		if (objectInScene) {
			let elemIndex = Editor.shelf_objects_in_scene.indexOf(objectInScene);
			Editor.shelf_objects_in_scene.splice(elemIndex, 1);
			objectInScene.parent.removeChild(objectInScene);
		}
	});

	ATON.on(HeriverseEvents.Events.UPDATE_TEXTS, () => {
		if (window.trad) {
			window.trad.updateTexts();
		}
	});

	ATON.on(HeriverseEvents.Events.TOGGLE_PANEL, ({ panel, id }) => {
		$(panel).toggleClass("d-none d-block");
		Heriverse.HERUI.clickToolbarBtn(id + "icon");
		$(panel + " img[class='icon-base']").toggleClass("d-block d-none");
		$(panel + " img[class='icon-active']").toggleClass("d-none d-block");
	});

	ATON.on("XRmode", (b) => {
		if (b) {
			ATON.FE.popupClose();
		}
	});

	ATON.on("EM loaded", () => {
		if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
			Editor.init();
			Heriverse.HERUI.createSettings();
			Heriverse.HERUI.buildRelationsManagement("#relationsCheckboxSection");
		}
	});

	ATON.on(HeriverseEvents.Events.SET_SHOW_ENV_SETTINGS, setupAndShowEnvSettingsPanel);
	ATON.on(HeriverseEvents.Events.SET_SHOW_VIEWPOINTS, setupAndShowViewpointsPanel);
};

Heriverse.toggleOrthographicCamera = () => {
	const syncComposerCamera = () => {
		if (ATON.FX && ATON.FX.composer) {
			ATON.FX.composer.passes.forEach((pass) => {
				if ("camera" in pass) {
					pass.camera = ATON.Nav._camera;
				}
			});
		}
	};

	if (!Heriverse._orthoCam) {
		const cam = ATON.Nav._camera;
		const aspect = window.innerWidth / window.innerHeight;
		const frustumSize = 40;

		const orthoCam = new THREE.OrthographicCamera(
			-frustumSize * aspect,
			frustumSize * aspect,
			frustumSize,
			-frustumSize,
			0.1,
			10000
		);

		orthoCam.position.copy(cam.position);
		orthoCam.quaternion.copy(cam.quaternion);
		orthoCam.layers.enableAll();
		orthoCam.updateProjectionMatrix();

		Heriverse._perspCam = cam;
		ATON.Nav._camera = orthoCam;
		Heriverse._orthoCam = orthoCam;

		if (ATON.Nav._controls && ATON.Nav._controls.object) {
			ATON.Nav._controls.object = orthoCam;
		}

		syncComposerCamera();

		console.log("[Heriverse] OrthographicCamera attiva");
	} else {
		ATON.Nav._camera = Heriverse._perspCam;

		if (ATON.Nav._controls && ATON.Nav._controls.object) {
			ATON.Nav._controls.object = Heriverse._perspCam;
		}

		syncComposerCamera();

		Heriverse._orthoCam = null;
		console.log("[Heriverse] PerspectiveCamera ripristinata");
	}
};

function plcCamAnimation() {
	requestAnimationFrame(plcCamAnimation);

	if (Heriverse.pointerLockControlsActive) {
		ATON._rcScene.setFromCamera(Heriverse.mousePosition, ATON.Nav._camera);
		const intersects = ATON._rcScene.intersectObjects(ATON.getRootScene().children, true);

		if (intersects.length > 0) {
			plcTargetPoint = intersects[0].point;

			ATON.Nav._camera.lookAt(plcTargetPoint);
		}
	}
}
plcCamAnimation();

Heriverse.measure = () => {
	let P = ATON.getSceneQueriedPoint();
	let M = ATON.SUI.addMeasurementPoint(P);
};

Heriverse.showAllProxies = (b) => {
	Heriverse._bShowAllProxies = b;
	for (let d in Heriverse.currMG.proxyNodes) {
		let proxy = Heriverse.currMG.proxyNodes[d];
		let sem_node = ATON.getSemanticNode(proxy.node.name);
		if (b) {
			sem_node.show();
			sem_node.highlight();
		} else sem_node.restoreDefaultMaterial();
	}
};

Heriverse.highlightProxies = function (idlist) {
	let numHL = idlist.length;

	for (let d in Heriverse.currMG.proxyNodes) {
		let proxy = Heriverse.currMG.proxyNodes[d];
		let sem_node = ATON.getSemanticNode(d);
		if (!Heriverse._bShowAllProxies) sem_node.restoreDefaultMaterial();

		for (let i = 0; i < numHL; i++) {
			if (d === idlist[i]) {
				sem_node.highlight();
			}
		}
	}
};

function isCustomTemporalPeriod(period) {
	return !period?.name || period.id?.includes("custom_");
}

function clearGraphDrawerSelectionIfNeeded() {
	if (
		!HeriverseGraphDrawer ||
		!HeriverseGraphDrawer.stagedSemantic ||
		!HeriverseGraphDrawer.stagedSemantic.length
	)
		return;

	HeriverseGraphDrawer.clearAll();

	const sidebar = document.querySelector(".sidebar");

	if (sidebar?.classList.contains("active")) {
		Heriverse.HERUI.closeSidebar();
	}
}

function getVisibleRepresentationModels(period) {
	if (!Heriverse.currMG?.representationNodes) return [];

	return Object.values(Heriverse.currMG.representationNodes).filter((rmNode) => {
		return (
			rmNode &&
			rmNode.graph &&
			Heriverse.currentGraphs.includes(rmNode.graph) &&
			rmNode.existsInTime(period.min, period.max)
		);
	});
}

function getRepresentationModelEpochs(rmNode) {
	return rmNode.getNeighborsByRelation(
		HeriverseNode.RELATIONS.HAS_REPRESENTATION_MODEL,
		HeriverseNode.DIRECTIONS.FROM
	);
}

function shouldAttachRepresentationModelToEpoch(epochNode, period) {
	if (isCustomTemporalPeriod(period)) return true;

	if (Heriverse.currentGraphs.length !== 1) return true;

	return epochNode?.id === Heriverse.currTemporalFilter?.id;
}

function applyRepresentationModelTransform(sceneNode, representationModelNode) {
	const transform = representationModelNode.data?.transform;

	if (!transform || !sceneNode) return;

	const { rotation, position, scale } = transform;

	if (rotation) {
		sceneNode.setRotation(rotation[0], rotation[1], rotation[2]);
	}

	if (position) {
		sceneNode.setPosition(position[0], position[1], position[2]);
	}

	if (scale) {
		sceneNode.setScale(scale[0], scale[1], scale[2]);
	}
}

function attachRepresentationModelToEpoch(representationModelNode, epochNode) {
	if (!epochNode) return;

	const name = representationModelNode.name;
	const url = Heriverse.getLinkFromRepresentationModel(representationModelNode);
	const resourceUrl = Heriverse.getLinkToResource(url);

	const sceneNode = ATON.createSceneNode(name).load(resourceUrl);

	sceneNode.attachTo(epochNode.id);

	applyRepresentationModelTransform(sceneNode, representationModelNode);
}

function attachVisibleRepresentationModels(period, representationModels) {
	representationModels.forEach((rmNode) => {
		const epochs = getRepresentationModelEpochs(rmNode);

		for (const epochId in epochs) {
			const epochNode = Heriverse.currMG.getNode(epochId);

			if (!shouldAttachRepresentationModelToEpoch(epochNode, period)) continue;

			attachRepresentationModelToEpoch(rmNode, epochNode);
		}
	});
}

function setPanoramaForPeriodIfNeeded(period) {
	if (isCustomTemporalPeriod(period)) return;

	Heriverse.currPeriodName = period.name;

	const panoramaUrl = Heriverse.currMG?.getPanoramaUrlFromPeriod(period.id);

	if (!panoramaUrl) return;

	const normalizedPanoramaUrl = Array.isArray(panoramaUrl) ? panoramaUrl[0] : panoramaUrl;

	ATON.setMainPanorama(Heriverse.getLinkToResource(normalizedPanoramaUrl));
}

function finalizePeriodFilter() {
	if ($("#idLoader")[0]) $("#idLoader").hide();

	Heriverse.HERUI.updateNoModelsInScene();
}

Heriverse.filterByPeriod = function (period) {
	if (!period) return;

	clearGraphDrawerSelectionIfNeeded();

	const visibleRepresentationModels = getVisibleRepresentationModels(period);

	setPanoramaForPeriodIfNeeded(period);

	attachVisibleRepresentationModels(period, visibleRepresentationModels);

	finalizePeriodFilter();
};

Heriverse.goToPeriodById = (id_epoch, mobile = false) => {
	let period;

	if (id_epoch === null) {
		period = new Period(null, "", 0, 1000);
	} else period = Heriverse.currMG.getEpoch(id_epoch);

	if (!period) return;

	Heriverse.currTemporalFilter = period;
	Heriverse.filterByPeriod(period);

	ATON.fire("goToPeriodPerformed", period.id);
};

Heriverse.goToPeriodByValues = ({ start = 0, end = 1000, id = null } = {}) => {
	const period = new Period(id, "", parseInt(start), parseInt(end));

	Heriverse.currTemporalFilter = period;
	Heriverse.filterByPeriod(period);

	ATON.fire("goToPeriodPerformed", period.id);
};

Heriverse.blurProxiesCurrPeriod = function () {
	for (let p in Heriverse.currMG.proxyNodes) {
		let proxy = Heriverse.currMG.proxyNodes[p];
		let EMdata = proxy.userData.EM;
		if (EMdata.periods[Heriverse.currPeriodName] !== undefined) proxy.restoreDefaultMaterial();
	}
};

Heriverse.openDetailSidebarChild = function (e) {
	ATON.fire("ShowSemanticNode", e);
	Heriverse.HERUI.populateSideBar(Heriverse.currMG.getNode(e));
};

Heriverse.search = function (string) {
	if (string.length < 2) {
		Heriverse.blurProxiesCurrPeriod();
		$("#idSearchMatches").hide();
		return;
	}

	string = string.toLowerCase();
	Heriverse.sematches = [];
	let aabbProxies = new THREE.Box3();

	for (let did in Heriverse.currMG.proxyNodes) {
		let bAdd = false;
		let didstr = did.toLowerCase();
		let D = ATON.getSemanticNode(did);
		let proxy = Heriverse.currMG.proxyNodes[did];
		let EMdata = proxy.userData.EM;

		if (EMdata.periods[Heriverse.currPeriodName] !== undefined) {
			if (didstr.startsWith(string)) bAdd = true;

			if (proxy && EMdata.description) {
				let descrKeys = EMdata.description.split(" ");
				for (let k = 0; k < descrKeys.length; k++) {
					let descrK = descrKeys[k].toLowerCase();
					if (descrK.startsWith(string)) bAdd = true;
				}
			}
		}

		if (bAdd) {
			Heriverse.sematches.push(did);
			aabbProxies.expandByObject(D);
		}
	}

	let len = Heriverse.sematches.length;
	if (len > 0) {
		$("#idProxyID").html("");
		Heriverse.highlightProxies(Heriverse.sematches);
		let bsProxies = new THREE.Sphere();
		aabbProxies.getBoundingSphere(bsProxies);
		ATON.Nav.requestPOVbyBound(bsProxies, 0.5);

		$("#idSearchMatches").html(len);
		$("#idSearchMatches").show();
	} else {
		Heriverse.blurProxiesCurrPeriod();
		$("#idSearchMatches").hide();
	}
};

Heriverse.searchClear = function () {
	$("#idSearch").val("");
	$("#idSearchMatches").hide();
	ATON._bPauseQuery = false;
	Heriverse.blurProxiesCurrPeriod();
};

Heriverse.popupMatches = () => {
	let num = Heriverse.sematches.length;
	if (num <= 0) return;
	let htmlcontent = "<div style='height: 50% !important;'>";
	htmlcontent += "<div class='atonPopupTitle'>" + num + " Matches</div>";
	htmlcontent += "<table>";

	htmlcontent +=
		"<thead><tr><th>Proxy ID</th><th>Time</th><th>Description</th><th>URL</th></tr></thead>";
	htmlcontent += "<tbody>";
	for (let d = 0; d < num; d++) {
		let did = Heriverse.sematches[d];
		let proxy = Heriverse.currMG.proxyNodes[did];
		let EMdata = proxy.userData.EM;

		if (proxy) {
			htmlcontent += "<tr>";
			htmlcontent += "<td>" + did + "</td>";
			htmlcontent += "<td>" + EMdata.time.toFixed(2) + "</td>";
			htmlcontent += "<td>" + EMdata.description + "</td>";
			if (EMdata.url) htmlcontent += "<td>" + EMdata.url + "</td>";
			else htmlcontent += "<td>/</td>";
			htmlcontent += "</tr>";
		}
	}
	htmlcontent += "</tbody>";
	htmlcontent += "</table>";
	htmlcontent += "</div>";

	if (!ATON.FE.popupShow(htmlcontent)) return;
};

Heriverse.getLinkToResource = (link) => {
	const externalPattern = /^(https?:\/\/|\/\/)/i;
	if (externalPattern.test(link)) {
		return link;
	} else {
		return Heriverse.ResourceScene.resource_path + link;
	}
};

Heriverse.setupPropertiesRules = async (pr_file) => {
	try {
		const response = await fetch(pr_file);
		const data = await response.json();
		Heriverse.properties_rules["qualia_categories"] = data.qualia_categories;
		return true;
	} catch (error) {
		console.error("Failed fetching JSON: ", error);
		throw error;
	}
};
Heriverse.setupConnectionRules = async (cr_file) => {
	HeriverseNode.RELATIONS = {};
	HeriverseNode.RELATION_LABELS = {};
	try {
		const response = await fetch(cr_file);
		const data = await response.json();
		const cr_from_data = data.edge_types;
		for (let rule_name in cr_from_data) {
			const rule = cr_from_data[rule_name];
			HeriverseNode.RELATIONS[rule_name.toUpperCase()] = rule_name;
			HeriverseNode.RELATION_LABELS[rule_name] = rule.label;
			Heriverse.node_types_by_conn[rule_name] = {};
			const allowed_connections = rule.allowed_connections;
			const sources = allowed_connections.source;
			const targets = allowed_connections.target;
			Heriverse.node_types_by_conn[rule_name]["source"] = sources;
			Heriverse.node_types_by_conn[rule_name]["target"] = targets;
			for (let source of sources) {
				if (!Heriverse.connection_rules[source]) Heriverse.connection_rules[source] = {};
				for (let target of targets) {
					if (!Heriverse.connection_rules[source][target])
						Heriverse.connection_rules[source][target] = [];
					Heriverse.connection_rules[source][target].push({
						type: rule_name,
						label: rule.label,
					});
				}
			}
		}
	} catch (error) {
		console.error("Failed fetching connection rules JSON:", error);
		throw error;
	}
};
Heriverse.setupSemanticShapeMaterial = async (ssc_file) => {
	try {
		const response = await fetch(ssc_file);
		const data = await response.json();
		const nodes_info = data.node_styles;
		for (let nodeType in nodes_info) {
			const type_style = nodes_info[nodeType].style || null;
			if (!type_style?.material?.color) continue;
			const { r, g, b } = type_style.material.color;
			Heriverse.semantic_shapes_materials[nodeType + "_ON"] = new THREE.MeshStandardMaterial({
				color: new THREE.Color(r, g, b),
				transparent: true,
				depthWrite: false,
				depthTest: !Heriverse._bProxiesAlwaysVis,
				opacity: 0.4,
			});
			Heriverse.semantic_shapes_materials[nodeType + "_OFF"] = new THREE.MeshStandardMaterial({
				color: new THREE.Color(r, g, b),
				transparent: true,
				depthWrite: false,
				depthTest: !Heriverse._bProxiesAlwaysVis,
				opacity: 0.0,
			});
		}
	} catch (error) {
		console.error("Failed fetching semantic material JSON:", error);
		throw error;
	}
};

Heriverse.setProxiesAlwaysVisible = (b) => {
	Heriverse._bProxiesAlwaysVis = b;

	for (let sT of HeriverseGraph.stratigraphicTypes) {
		if (Heriverse.semantic_shapes_materials[sT + "_OFF"])
			Heriverse.semantic_shapes_materials[sT + "_OFF"].depthTest = !b;
		if (Heriverse.semantic_shapes_materials[sT + "_ON"])
			Heriverse.semantic_shapes_materials[sT + "_ON"].depthTest = !b;
	}
};

Heriverse.findShortestValidPath = (sourceNodeType, targetNodeType) => {
	if (!Heriverse.connection_rules[sourceNodeType]) {
		return null;
	}

	const queue = [
		{
			node: sourceNodeType,
			path: [],
			connections: [],
		},
	];

	const visited = new Set([sourceNodeType]);
	while (queue.length > 0) {
		const current = queue.shift();
		const currentNode = current.node;

		if (currentNode === targetNodeType) {
			return {
				path: [sourceNodeType, ...current.path],
				connections: current.connections,
			};
		}

		if (Heriverse.connection_rules[currentNode]) {
			Object.entries(Heriverse.connection_rules[currentNode]).forEach(([nextNode, connections]) => {
				if (!visited.has(nextNode)) {
					visited.add(nextNode);

					connections.forEach((connection) => {
						queue.push({
							node: nextNode,
							path: [...current.path, nextNode],
							connections: [
								...current.connections,
								{
									from: currentNode,
									to: nextNode,
									type: connection.type,
									label: connection.label,
								},
							],
						});
					});
				}
			});
		}
	}

	return null;
};

Heriverse._povList = [];

Heriverse.addPovToList = (pov) => {
	if (!pov || !Heriverse.validatePov(pov)) return;
	if (!Heriverse._povList) Heriverse._povList = [];
	Heriverse._povList.push(pov);
	if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) Heriverse.updateViewpoints();
};

Heriverse.removePOVFromList = (i) => {
	if (i === null || i === undefined) return;
	let povIndex;
	if (typeof i === "number") povIndex = i;
	else if (i instanceof ATON.POV) {
		povIndex = Heriverse._povList.find((pov) => pov === i);
		if (povIndex < 0) return;
	}

	Heriverse._povList.splice(povIndex, 1);
	if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) Heriverse.updateViewpoints();
};

Heriverse.validatePov = (pov) => {
	if (!pov) return false;
	if (Heriverse._povList.includes(pov) || !Heriverse._povList.length) return true;
	for (let existingPov of Heriverse._povList) {
		if (equalPovs(existingPov, pov)) return false;
	}
	return true;
};

function equalPovs(pov1, pov2) {
	return pov1.pos.equals(pov2.pos) && pov1.target.equals(pov2.target) && pov1.fov === pov2.fov;
}

Heriverse.updateViewpoints = () => {
	Heriverse.ResourceScene.viewpoints = {};
	Heriverse._povList.forEach((pov) => {
		Heriverse.ResourceScene.viewpoints[pov.name] = {
			pos: pov.pos,
			fov: pov.fov,
			target: pov.target,
		};
	});
};

Heriverse.fillPovList = (viewPointObj) => {
	if (!Object.keys(viewPointObj).length) return;
	Heriverse._povList = [];
	for (let key in viewPointObj) {
		const currVP = viewPointObj[key];
		const newPov = new ATON.POV();
		newPov.name = key;
		newPov.setPosition(currVP.pos.x, currVP.pos.y, currVP.pos.z);
		newPov.setTarget(currVP.target.x, currVP.target.y, currVP.target.z);
		newPov.setFOV(currVP.fov);

		Heriverse._povList.push(newPov);
	}
};

Heriverse.setXRPointerMode = (b) => {
	if (Heriverse._bXRPointerMode !== b) {
		Heriverse._bXRPointerMode = b;
	}
};

Heriverse.comparePeriod = (a, b) => {
	if (a.min < b.min) return -1;
	if (a.min > b.min) return 1;
	return 0;
};
