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
import { Archive3tz, Tiles3tzPlugin, archiveBase, httpSource } from "./HeriverseTiles3tz.js";

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
			// uno studio che viene da una stanza: i byte si prendono dal nodo
			Heriverse.nodeStudy = data.study && data.study.node && data.study.room
				? { node: data.study.node, room: data.study.room } : null;
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

// NIGHT-RIM3/D · s3Dgraphy 1.6: un RM ha PIÙ risorse, e a Heriverse ne
// interessa una sola.
//
// Fino alla 1.5 un RM aveva un solo `has_linked_resource`, quindi «prendi il
// primo con url_type 3d_model» era corretto. Dalla 1.6 i livelli sono tre
// (decisione di E.D., 12-09-2026):
//
//   * il GREZZO — un locator `blend://<file>.blend#Object/<nome>`: il
//     datablock dentro un file Blender. Insostituibile, e **illeggibile per
//     un browser**;
//   * la DERIVATA — il glTF/GLB ottimizzato prodotto dal bake;
//   * la PUBBLICATA — la derivata quando il suo locator è un URI
//     raggiungibile e porta checksum.
//
// Tutte e tre portano `url_type: "3d_model"`, perché tutte e tre SONO modelli
// 3D: il tipo non le distingue. Senza questo filtro il ciclo restituiva la
// prima che capitava nell'ordine dei vicini, che può benissimo essere il
// `blend://` — e Heriverse tentava di caricare come glTF un locator che
// descrive un datablock dentro un .blend.
//
// Il contratto è la libreria e il consumatore si adegua: qui si SALTA ciò che
// non è affar nostro, senza rompersi e senza pretendere che la libreria smetta
// di scriverlo.
const HERIVERSE_INTERNAL_SCHEME = "blend://";

Heriverse.isLoadableResourceLocator = (url) => {
	if (!url) return false;
	// un grezzo dentro un .blend non è caricabile da qui: lo si ignora, non lo
	// si tratta come un errore — esiste di proposito e serve a Blender
	return !String(url).toLowerCase().startsWith(HERIVERSE_INTERNAL_SCHEME);
};

// ── NIGHT-RES/R4 · IL CONSUMATORE SCEGLIE PER CAPACITÀ ─────────────────────
//
// L'euristica di ieri notte — due passate, «ha il checksum quindi è la
// pubblicata» — era giusta per caso. Il checksum dice che quei byte sono
// verificabili, non che siano i byte che questo viewer sa aprire: il giorno
// che il bake registra un digest anche per una risorsa di lavoro (e lo fa
// già), quella regola sceglie la cosa sbagliata senza dirlo.
//
// La regola nuova è: **il grafo dichiara fatti, il consumatore sceglie per
// capacità**. Nessun flag per-strumento nel dato — un dato da modificare ogni
// volta che nasce un software è una configurazione travestita, e costringe a
// rimettere le mani nei grafi già scritti. La risorsa dice cosa è (formato,
// `tier`, `packaging`, peso); questo elenco dice cosa Heriverse sa fare.
// ── NIGHT-FIN/T3 · TRE STATI, PERCHÉ «NON SO» NON È «NO» ───────────────────
//
// `tiles3d` era dichiarato `false` con, nella riga accanto, la ragione vera:
// «ATON arriva dal deploy e da qui non si può verificare». Cioè la verità non
// era *falso*, era **sconosciuto** — e scrivere falso dove non si è potuto
// misurare è una bugia piccola della stessa famiglia di quella evitata sul
// packaging, che pure era stata rifiutata per questo motivo esatto.
//
// I tre stati si comportano allo stesso modo nella SCELTA — né `no` né
// `unknown` fanno prendere una risorsa — e diversamente nel MESSAGGIO, che è
// l'unica cosa che li distingue e l'unica che serve: «non so caricare 3D
// Tiles» manda a cercare un loader, «non ho potuto verificare se ATON li
// carica» manda a guardare ATON. Due strade diverse per chi legge.
Heriverse.CAPABILITY = { YES: "yes", NO: "no", UNKNOWN: "unknown" };

//: Dove andare a guardare, quando la risposta è «non so». Il nome del posto
//: viaggia col non-so: un «non verificabile» senza un indirizzo è un vicolo
//: cieco, e chi lo legge non può fare niente di diverso da chi legge «no».
Heriverse.CAPABILITY_SOURCES = {
	tiles3d: "ATON (/dist/ATON.min.js, fuori da questo checkout)",
	tiles3tz: "src/HeriverseTiles3tz.js (il lettore di EMStudio)",
};

Heriverse.CAPABILITIES = {
	// ATON carica glTF/GLB: è il formato su cui è costruito il viewer, e
	// questo si vede da qui — `ATON.createSceneNode().load()` è la riga che
	// carica ogni modello di questo viewer.
	gltf: Heriverse.CAPABILITY.YES,
	// 3D TILES: **non lo so.** In questo ramo non c'è nessun loader né in
	// `src/` né in `vendors/`, ma il caricamento vero lo fa ATON, che arriva
	// dal deploy: da qui non è verificabile. Chi apre ATON e trova il loader
	// mette YES; chi apre ATON e non lo trova mette NO. In un posto solo.
	//
	// TEMPLU MARE v2 · C1 (6 ott 2026): ATON aperto, e il loader c'è —
	// `ATON.MRes.loadTileSetFromURL` (ATON.mres.js, 3d-tiles-renderer 0.5.3),
	// al quale `ATON.Node.load()` manda ogni url `.json` (ATON.node.js); misurato
	// sul tileset di Templu Mare v2 da una cartella. Quindi YES.
	tiles3d: Heriverse.CAPABILITY.YES,
	// UN `.3tz` (il tileset in un file solo, letto dalla fine e a pezzi, senza
	// scompattarlo): lo legge `src/HeriverseTiles3tz.js`, che è in questo repo.
	// Non è «scompattare un archivio»: nessuna tessera arriva sul disco.
	tiles3tz: Heriverse.CAPABILITY.YES,
	// SCOMPATTARE UN ARCHIVIO: **no, e questo sì che si vede da qui.**
	// `JSZip` in questo repo c'è, ma serve all'EXPORT
	// (`HeriverseImportExport.exportNodesAsZip`): impacchetta per far
	// scaricare, non spacchetta per caricare. Nessuna riga di questo repo
	// apre un archivio in ingresso, e quello è un fatto locale.
	unpackArchive: Heriverse.CAPABILITY.NO,
};

/** `yes` / `no` / `unknown`, accettando anche i booleani di prima: un ramo che
 *  non è stato aggiornato non deve smettere di funzionare per la forma di un
 *  valore. `true`/`false` continuano a valere YES/NO. */
Heriverse.capabilityState = (nome) => {
	const valore = Heriverse.CAPABILITIES[nome];
	if (valore === true) return Heriverse.CAPABILITY.YES;
	if (valore === false) return Heriverse.CAPABILITY.NO;
	return valore || Heriverse.CAPABILITY.UNKNOWN;
};

/** La frase che accompagna un rifiuto, e che cambia con lo stato. */
const whyNotCapable = (nome, cosa) => {
	const stato = Heriverse.capabilityState(nome);
	if (stato === Heriverse.CAPABILITY.NO) return `this viewer cannot load ${cosa}`;
	const dove = Heriverse.CAPABILITY_SOURCES[nome];
	return `cannot tell whether ${cosa} can be loaded here — not verifiable from `
		+ `this repository, look at ${dove || "the runtime"}`;
};

const HERIVERSE_GLTF_EXTENSIONS = [".gltf", ".glb"];
//: un endpoint per impronta (`…/asset/sha256:…`) non ha estensione: il tipo
//: lo dice il `media_type` che la risorsa dichiara
const HERIVERSE_GLTF_MEDIA_TYPES = ["model/gltf-binary", "model/gltf+json"];

// Il `tier` LETTO, con lo stesso ripiego che fa `ResourceNode.effective_tier`
// in s3Dgraphy: un locator `blend://` è un master, tutto il resto è una
// distribution. Scritto qui per intero perché è la regola di lettura che
// mantiene funzionante un project.json PRE-1.6, dove `tier` non c'è.
const readTier = (data) => {
	if (data.tier) return data.tier;
	return String(data.url || "").startsWith(HERIVERSE_INTERNAL_SCHEME)
		? "master"
		: "distribution";
};

const readPackaging = (data) => {
	if (data.packaging) return data.packaging;
	const url = String(data.url || "").toLowerCase();
	if (url.endsWith(".zip")) return "archive";
	return url.endsWith("/") ? "directory" : "file";
};

//: il media type di un 3D Tiles Archive (s3Dgraphy `MEDIA_TYPE_3TZ`)
Heriverse.MEDIA_TYPE_3TZ = "application/vnd.maxar.archive.3tz+zip";

/** TEMPLU MARE v2 · C1 · che cosa è una risorsa per il lettore di tessere,
 *  letto da ciò che DICHIARA e non solo dal suo indirizzo (un url per
 *  impronta, `…/asset/sha256:…`, non dice niente): `"3tz"` (un archivio letto
 *  dalla fine), `"directory"` (un albero servito com'è: `packaging: directory`
 *  o un locator `tileset.json`), `""` (non è un tileset: uno zip qualunque non
 *  lo è). Lo stesso `tilesKindOf` dello Spazio di EMStudio. */
Heriverse.tilesKindOf = (data) => {
	const url = String(data?.url || "").toLowerCase().split(/[?#]/)[0];
	if (url.endsWith(".3tz") || String(data?.media_type || "").toLowerCase() === Heriverse.MEDIA_TYPE_3TZ)
		return "3tz";
	if (data?.packaging === "directory" || /(^|\/)tileset\.json$/.test(url)) return "directory";
	return "";
};

/** C1 · la RAPPRESENTAZIONE di una versione che un nodo sa servire. Un nodo
 *  tiene un file per impronta: una cartella di tessere non ce l'ha, il suo
 *  `.3tz` sì. Si cercano le risorse legate da `dtc_derived_from` (nei due
 *  versi, di seguito, dello stesso `url_type`: `pick_representation` di
 *  s3Dgraphy), la più vicina prima e a pari distanza la `preferred`, e si
 *  prende la prima che è un `.3tz` — uno zip qualunque accanto (il master)
 *  non è un tileset. → il nodo, o null. */
Heriverse.servableRepresentation = (node) => {
	if (!node) return null;
	const kind = node.data?.url_type || "";
	const seen = new Set([node.id]);
	let frontier = [node];
	while (frontier.length) {
		const next = [];
		for (const cur of frontier) {
			const near = [...nbrs(cur, "dtc_derived_from", "to"), ...nbrs(cur, "dtc_derived_from", "from")]
				.filter((n) => isResource(n) && !seen.has(n.id)
					&& (!kind || !n.data?.url_type || n.data.url_type === kind))
				.sort(byId);
			for (const n of near) { seen.add(n.id); next.push(n); }
		}
		const hit = next.filter((n) => Heriverse.tilesKindOf(n.data) === "3tz")
			.sort((a, b) => Number(!a.data?.preferred) - Number(!b.data?.preferred))[0];
		if (hit) return hit;
		frontier = next;
	}
	return null;
};

/**
 * Questo viewer sa aprire questa risorsa? → `{ok}` oppure `{ok:false, why}`.
 *
 * La ragione viaggia col no perché un `false` muto è indistinguibile da una
 * risorsa che non c'era: sono due situazioni diverse e chi guarda la console
 * deve poterle separare.
 */
Heriverse.canConsumeResource = (data, { anyTier = false } = {}) => {
	if (!data || data.url_type !== "3d_model") return { ok: false, why: "not a 3d model" };
	const url = String(data.url || "");
	if (!url) return { ok: false, why: "no locator" };
	// i MASTER si ignorano, e non è un errore: esistono di proposito, sono ciò
	// da cui le distribution vengono fatte, e un `blend://` descrive un
	// datablock dentro un file Blender che nessun browser può aprire.
	// `anyTier`: chi sceglie con la regola della versione per un uso chiede
	// solo se il FORMATO si apre — il master è l'ultima risorsa, e la regola
	// lo prende dicendolo (un `blend://` resta fuori lo stesso, sotto)
	if (!anyTier && readTier(data) === "master") return { ok: false, why: "master" };
	if (!Heriverse.isLoadableResourceLocator(url))
		return { ok: false, why: "internal locator" };

	const YES = Heriverse.CAPABILITY.YES;
	// C1 · un `.3tz` è un archivio che NON si scompatta: lo si legge dalla fine
	if (Heriverse.tilesKindOf(data) === "3tz")
		return Heriverse.capabilityState("tiles3tz") === YES
			? { ok: true }
			: { ok: false, why: whyNotCapable("tiles3tz", "a 3D Tiles archive"),
			    capability: "tiles3tz", state: Heriverse.capabilityState("tiles3tz") };
	const packaging = readPackaging(data);
	if (packaging === "archive" && Heriverse.capabilityState("unpackArchive") !== YES)
		return { ok: false, why: whyNotCapable("unpackArchive", "an archive"),
		         capability: "unpackArchive",
		         state: Heriverse.capabilityState("unpackArchive") };

	const lower = url.toLowerCase().split("?")[0];
	const media = String(data.media_type || "").toLowerCase();
	if (HERIVERSE_GLTF_EXTENSIONS.some((ext) => lower.endsWith(ext))
		|| HERIVERSE_GLTF_MEDIA_TYPES.includes(media))
		return Heriverse.capabilityState("gltf") === YES
			? { ok: true }
			: { ok: false, why: whyNotCapable("gltf", "glTF"),
			    capability: "gltf", state: Heriverse.capabilityState("gltf") };
	if (lower.endsWith("tileset.json"))
		// UNKNOWN si comporta come NO nella scelta — non si prende una
		// risorsa sperando che vada — ma lo dice diversamente, e dice dove
		// andare a guardare.
		return Heriverse.capabilityState("tiles3d") === YES
			? { ok: true }
			: { ok: false, why: whyNotCapable("tiles3d", "3D Tiles"),
			    capability: "tiles3d", state: Heriverse.capabilityState("tiles3d") };
	// un MASTER si carica solo in un formato che si SA aprire: è l'ultima
	// risorsa, presa dalla regola dicendolo, e non vale la pena tentare un
	// .obj sperando — quello è un file di lavoro, non un endpoint
	if (anyTier && readTier(data) === "master")
		return { ok: false, why: "master in a format this viewer does not know" };
	// un'estensione che non conosciamo NON si rifiuta: un url senza estensione
	// è un endpoint che serve i byte giusti, e rifiutarlo renderebbe questa
	// funzione un elenco chiuso di nomi di file — cioè la cosa che il
	// principio «si sceglie per capacità» esiste per evitare
	return { ok: true };
};

// ── LA VERSIONE PER UN USO (E.D., 5 ott 2026) ──────────────────────────────
//
// Per Heriverse non si esporta più nulla da Blender: Heriverse legge lo studio
// e, per ogni modello di rappresentazione, sceglie da sé fra le risorse
// agganciate la versione da caricare. La regola NON è di Heriverse: è
// `s3dgraphy.resources.versions.choose_version`, copiata qui riga per riga, e
// la tabella `src/3dgraphy_config_files/version_for_cases.json` (la stessa di
// s3Dgraphy) la prova da tutte e due le parti — `tests/check-version-for.mjs`.
//
//   1. gli usi si provano in ordine (qui: la versione fatta per Heriverse,
//      poi per un'app ATON, poi web, poi realtime — H4);
//   2. candidate sono le VERSIONI (mai il master) che dichiarano quell'uso;
//   3. con un livello preferito, la candidata a quel livello;
//   4. altrimenti la più leggera: il `lod_level` più alto, poi meno byte,
//      poi l'id — la risposta non dipende dall'ordine dei vicini;
//   5. nessuna versione per nessun uso → il MASTER, e lo si dice;
//   6. niente da caricare → null.
Heriverse.USES = ["analysis", "realtime", "web", "mobile_ar", "print", "render", "preview",
                  "heriverse", "aton"];
//: gli usi di questo viewer, nell'ordine in cui li prova (`VIEWER_USES` di
//: s3Dgraphy): una versione fatta per Heriverse — il pacchetto su disco che
//: EM Tools fa con «Prepare for a use…» — viene prima di qualunque versione web
Heriverse.VIEWER_USES = ["heriverse", "aton", "web", "realtime"];
//: il livello che si preferisce, se c'è (null: il più leggero adatto)
Heriverse.preferredLodLevel = null;

const LOD_LEVEL_RE = /^lod(0|[1-9][0-9]*)$/;
const lodOrdinal = (e) => {
	const m = LOD_LEVEL_RE.exec(String(e.lod_level || ""));
	return m ? parseInt(m[1], 10) : -1;
};
const sameLevel = (e, level) => {
	const want = String(level).trim().toLowerCase();
	return want === String(e.lod_level || "").toLowerCase()
		|| want === String(e.level || "").trim().toLowerCase();
};
const byId = (a, b) => (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);

/** La versione da caricare per `use` fra `entries` (master e versioni).
 *  → `{entry, reason, use, note}` oppure null. Copia di `choose_version`. */
Heriverse.chooseVersion = (entries, use, preferLevel = null) => {
	entries = (entries || []).filter(Boolean);
	if (!entries.length) return null;
	const uses = typeof use === "string" ? [use] : Array.from(use || []);
	for (const u of uses) {
		const cands = entries.filter((e) => !e.master && (e.use || []).includes(u));
		if (!cands.length) continue;
		if (preferLevel) {
			const at = cands.filter((e) => sameLevel(e, preferLevel)).sort(byId);
			if (at.length) return { entry: at[0], reason: "level", use: u, note: "" };
		}
		const weight = (e) => {
			const size = e.size_bytes;
			const known = typeof size === "number";
			return [-lodOrdinal(e), known ? 0 : 1, known ? size : 0];
		};
		const best = cands.slice().sort((a, b) => {
			const wa = weight(a), wb = weight(b);
			for (let i = 0; i < wa.length; i++) if (wa[i] !== wb[i]) return wa[i] - wb[i];
			return byId(a, b);
		})[0];
		const note = preferLevel
			? `no ${u} version at ${preferLevel}: the lightest ${u} version instead` : "";
		return { entry: best, reason: "use", use: u, note };
	}
	const master = entries.find((e) => e.master);
	const asked = uses.join(", ") || "no use";
	if (!master)
		return { entry: null, reason: "none", use: null, note: `no version for ${asked} and no master` };
	return { entry: master, reason: "master", use: null,
	         note: `no version for ${asked}: the master is loaded` };
};

// ── le versioni lette dal grafo, come le legge `versions_of` ───────────────
//
// Una versione è una risorsa prodotta da un passo DTC `lod_generation`
// (`dtc_had_output`) che ha in ingresso (`dtc_had_input`) la risorsa da cui è
// fatta; una revisione (`was_revision_of`) prende il posto di quella che
// rivede. Il livello si CALCOLA dalla catena (master: nessuno; lod0 la prima
// versione; un passo in più, un numero in più); se il file ne scrive uno
// diverso, lo si dice nel log, come un checksum che non torna.
const LOD_KIND = "lod_generation";
const nbrs = (node, rel, dir) => Object.values(node?.getNeighborsByRelation?.(rel, dir) || {});
const isResource = (n) => n && n.type === "resource";

const oldestRevision = (node) => {
	const seen = new Set([node.id]);
	let cur = node;
	for (;;) {
		const older = nbrs(cur, "was_revision_of", "to").sort(byId)[0];
		if (!older || seen.has(older.id)) return cur;
		seen.add(older.id);
		cur = older;
	}
};
const currentRevision = (node) => {
	const seen = new Set([node.id]);
	let cur = node;
	for (;;) {
		const newer = nbrs(cur, "was_revision_of", "from").sort(byId)[0];
		if (!newer || seen.has(newer.id)) return cur;
		seen.add(newer.id);
		cur = newer;
	}
};
const revisionChain = (node) => {
	const out = [];
	const seen = new Set();
	let cur = oldestRevision(node);
	while (cur && !seen.has(cur.id)) {
		out.push(cur);
		seen.add(cur.id);
		cur = nbrs(cur, "was_revision_of", "from").sort(byId)[0];
	}
	return out;
};
const lodStepOf = (node) => {
	for (const proc of nbrs(oldestRevision(node), "dtc_had_output", "from")) {
		if (proc.data?.dtc_kind !== LOD_KIND) continue;
		const input = nbrs(proc, "dtc_had_input", "to").filter(isResource).sort(byId)[0];
		return { proc, input: input || null };
	}
	return { proc: null, input: null };
};

/** L'asset (il master) di cui `node` è versione; `node` stesso se non lo è. */
Heriverse.assetOf = (node) => {
	const seen = new Set();
	let cur = node;
	while (cur && !seen.has(cur.id)) {
		seen.add(cur.id);
		const { input } = lodStepOf(cur);
		if (!input) return oldestRevision(cur);
		cur = input;
	}
	return oldestRevision(cur);
};

const usesOf = (data, params) => {
	const use = data?.use ?? params?.use;
	if (Array.isArray(use)) return use.map(String);
	if (typeof use === "string" && use) return [use];
	const purpose = String(params?.purpose || "");
	return Heriverse.USES.includes(purpose) ? [purpose] : [];
};
const entryOf = (node, { master, level, lodLevel, use }) => ({
	id: node.id, name: node.name, master, level: level ?? null,
	lod_level: master ? null : lodLevel, use: master ? [] : use,
	size_bytes: typeof node.data?.size_bytes === "number" ? node.data.size_bytes : undefined,
	checksum: node.data?.checksum || "", url: node.data?.url || "", data: node.data || {},
});

/** Il master e le sue versioni, ciascuna alla revisione corrente. */
Heriverse.versionsOf = (assetNode) => {
	const out = [entryOf(currentRevision(assetNode), { master: true })];
	const seen = new Set([assetNode.id]);
	const walk = (from, depth) => {
		for (const rev of revisionChain(from)) {
			for (const proc of nbrs(rev, "dtc_had_input", "from")) {
				if (proc.data?.dtc_kind !== LOD_KIND) continue;
				const params = proc.data?.parameters || {};
				for (const child of nbrs(proc, "dtc_had_output", "to").filter(isResource)) {
					if (seen.has(child.id)) continue;
					seen.add(child.id);
					const cur = currentRevision(child);
					const lodLevel = `lod${depth}`;
					const written = cur.data?.lod_level || child.data?.lod_level;
					if (written && written !== lodLevel)
						console.log(`[Heriverse] lod_level of ${child.name}: the file says `
							+ `${written}, the chain says ${lodLevel}`);
					out.push(entryOf(cur, { master: false, level: params.level, lodLevel,
					                        use: usesOf(cur.data, params) }));
					walk(child, depth + 1);
				}
			}
		}
	};
	walk(assetNode, 0);
	return out;
};

/** Le voci fra cui scegliere per un RM: master e versioni degli asset delle sue
 *  risorse 3D, tenute solo se questo viewer le sa aprire (il tier non conta
 *  qui: il master è l'ultima risorsa, e si carica se il formato lo permette). */
Heriverse.entriesForRepresentationModel = (node) => {
	const linked = Object.values(node.getNeighborsByRelation(
		HeriverseNode.RELATIONS.HAS_LINKED_RESOURCE, HeriverseNode.DIRECTIONS.TO))
		.filter((n) => n && n.data);
	const models = linked.filter((n) => n.data.url_type === "3d_model");
	const assets = new Map();
	for (const r of models.length ? models : linked) {
		const a = Heriverse.assetOf(r);
		if (a) assets.set(a.id, a);
	}
	const entries = [];
	for (const a of [...assets.values()].sort(byId)) {
		for (const e of Heriverse.versionsOf(a)) {
			const verdict = Heriverse.canConsumeResource(e.data, { anyTier: true });
			if (verdict.ok) entries.push({ ...e, asset_id: a.id });
			else if (verdict.why !== "not a 3d model" && verdict.why !== "internal locator")
				// un master saltato in silenzio quando è un `blend://`; il resto
				// sì: «non l'ho caricato» e «non c'era» devono distinguersi
				console.log(`[Heriverse] skipped ${e.url}: ${verdict.why}`);
		}
	}
	return entries;
};

//: «heriverse, aton, web or realtime»
const saidUses = (uses) => (uses.length > 1
	? `${uses.slice(0, -1).join(", ")} or ${uses[uses.length - 1]}` : String(uses[0] || "no use"));

const shortSum = (checksum) => {
	const hex = String(checksum || "").replace(/^sha256:/, "");
	return hex ? `sha256 ${hex.slice(0, 12)}…` : "no checksum";
};

/** La risorsa da caricare per un RM: `{data, choice}` oppure null. Lascia una
 *  riga nel log per ogni scelta. */
Heriverse.chooseResourceForRepresentationModel = (node) => {
	const entries = Heriverse.entriesForRepresentationModel(node);
	const choice = Heriverse.chooseVersion(entries, Heriverse.VIEWER_USES, Heriverse.preferredLodLevel);
	const label = node.name || node.id;
	if (!choice || !choice.entry) {
		const hung = Object.keys(node.getNeighborsByRelation(
			HeriverseNode.RELATIONS.HAS_LINKED_RESOURCE, HeriverseNode.DIRECTIONS.TO)).length;
		console.log(hung
			? `[Heriverse] RM ${label}: nothing this viewer can load`
				+ (choice?.note ? ` (${choice.note})` : "")
			: `[Heriverse] RM ${label}: no resource hung on it`);
		Heriverse.lastChoices[node.id] = choice;
		return null;
	}
	const e = choice.entry;
	if (choice.reason === "master")
		console.log(`[Heriverse] RM ${label}: no version for ${saidUses(Heriverse.VIEWER_USES)}, `
			+ `loading the master (${shortSum(e.checksum)})`);
	else
		console.log(`[Heriverse] RM ${label} → ${choice.use} version `
			+ `${String(e.lod_level || e.level || "").toUpperCase()}, ${shortSum(e.checksum)}`
			+ (choice.note ? ` (${choice.note})` : ""));
	Heriverse.lastChoices[node.id] = choice;
	return { data: e.data, choice };
};
//: l'ultima scelta per ogni RM, per chi la vuole leggere (test, pannelli)
Heriverse.lastChoices = {};

Heriverse.getLinkFromRepresentationModel = (node) => {
	const chosen = Heriverse.chooseResourceForRepresentationModel(node);
	return chosen ? chosen.data.url : "";
};

// ── I BYTE DAL NODO, PER IMPRONTA (E.D., 5 ott 2026) ───────────────────────
//
// Quando lo studio viene da una stanza, la risorsa scelta si scarica
// dall'indirizzo per impronta del nodo — `<nodo>/v1/rooms/<stanza>/asset/
// sha256:<hex>`, lo stesso che usano EM Tools ed EMStudio — e non da un
// percorso relativo a un export. I byte scaricati si misurano: sha256 uguale a
// quella registrata, si caricano; diversa, lo si dice e NON si caricano, perché
// non sono la versione che lo studio nomina. Uno studio aperto da file tiene
// il suo percorso locale, come prima.
//
// `Heriverse.nodeStudy = {node, room, token}`: la dichiara la scena
// (`study: {node, room}`) o la pagina; il token non viaggia mai in un file né
// in un url — si legge da `sessionStorage["heriverse.node_token"]`.
Heriverse.nodeStudy = null;
const NODE_ASSET_RE = /^(.*)\/v1\/rooms\/([^/]+)\/asset\/(sha256:[0-9a-f]{64})(?:[?#].*)?$/i;

const sha256Hex = (checksum) => {
	const m = /^(?:sha256:)?([0-9a-f]{64})$/i.exec(String(checksum || ""));
	return m ? m[1].toLowerCase() : null;
};

/** Da dove vengono i byte di una risorsa: `{kind: "node", url, sha256}` o
 *  `{kind: "path", url}`. */
Heriverse.sourceOfResource = (data, study = Heriverse.nodeStudy) => {
	const hex = sha256Hex(data?.checksum);
	const url = String(data?.url || "");
	if (study && study.node && study.room && hex)
		return { kind: "node", sha256: hex,
		         url: `${String(study.node).replace(/\/+$/, "")}/v1/rooms/`
		              + `${encodeURIComponent(study.room)}/asset/sha256:${hex}` };
	const m = NODE_ASSET_RE.exec(url);
	if (m) {
		const fromUrl = sha256Hex(m[3]);
		return { kind: "node", url, sha256: hex || fromUrl };
	}
	return { kind: "path", url };
};

Heriverse.nodeToken = () => {
	if (Heriverse.nodeStudy?.token) return Heriverse.nodeStudy.token;
	try {
		return globalThis.sessionStorage?.getItem("heriverse.node_token") || null;
	} catch (e) {
		return null;
	}
};

const hexOf = (buffer) => Array.from(new Uint8Array(buffer))
	.map((b) => b.toString(16).padStart(2, "0")).join("");

/** Scarica dal nodo e misura. → `{ok, buffer, received, expected, line}`. */
Heriverse.fetchVerified = async (source, label, fetchFn = globalThis.fetch) => {
	const token = Heriverse.nodeToken();
	const res = await fetchFn(source.url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
	if (!res.ok) {
		const line = `[Heriverse] RM ${label}: the node answered ${res.status} for ${source.url}`;
		console.log(line);
		return { ok: false, status: res.status, line };
	}
	const buffer = await res.arrayBuffer();
	const received = hexOf(await globalThis.crypto.subtle.digest("SHA-256", buffer));
	const expected = source.sha256;
	const ok = !expected || received === expected;
	const line = !expected
		? `[Heriverse] RM ${label}: ${buffer.byteLength} bytes from the node, sha256 ${received.slice(0, 12)}… (no registered sha256 to compare)`
		: ok
			? `[Heriverse] RM ${label}: ${buffer.byteLength} bytes from the node, sha256 ${received.slice(0, 12)}… = the registered one`
			: `[Heriverse] RM ${label}: the bytes from the node are NOT the registered version — registered sha256 ${expected.slice(0, 12)}…, received ${received.slice(0, 12)}…; not loaded`;
	console.log(line);
	return { ok, buffer, received, expected, line };
};
//: cosa è stato caricato per ogni RM, per chi lo vuole leggere
Heriverse.lastLoads = {};

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

// I byte già misurati entrano in ATON per la stessa via di `load()` — il
// GLTFLoader — senza un url: un `blob:` non passa da
// `resolveCollectionURL`, che lo prenderebbe per un percorso della collezione.
// La richiesta si CONTA come la conta `load()` (`_assetReqNew` alla partenza
// del download, `_assetReqComplete` qui): è quando l'ultima si chiude che
// ATON ricalcola i limiti della scena e inquadra.
Heriverse.loadModelBytes = (sceneNode, buffer, reqKey, onComplete) => {
	ATON._aLoader.parse(buffer, "", (data) => {
		const model = data.scene || data.scenes[0];
		ATON.Utils.modelVisitor(sceneNode, model);
		sceneNode.add(model);
		ATON.Utils.registerAniMixers(sceneNode, data);
		ATON._bqScene = true;
		ATON.Utils.updatePickGraph(undefined, sceneNode.type);
		sceneNode.dirtyBound();
		if (reqKey) ATON._assetReqComplete(reqKey);
		if (onComplete) onComplete();
	}, (err) => {
		console.error("[Heriverse] glTF from the node could not be parsed", err);
		if (reqKey) ATON._assetReqComplete(reqKey);
	});
};

// TEMPLU MARE v2 · C1 · un TILESET (3D Tiles). È Z-up — 3D Tiles, e 3D Survey
// Collection scrive i volumi nel sistema di Blender — mentre le versioni glb
// del dataset sono Y-up (l'export glTF: x, y, z → x, z, −y), e ATON non gira
// un tileset che non è georiferito. Lo si carica quindi in un nodo figlio
// ruotato di −90° attorno a X: la stessa rotazione dello Spazio di EMStudio
// (`tiles3d.ts`), e il tileset cade dove cadono le versioni glb.
//   · da una CARTELLA: l'url del `tileset.json` (o del `.3tz`), accanto all'em.json;
//   · da un NODO: il `.3tz` per impronta, letto a pezzi con `Range` e col token,
//     sotto una base che nessuno serve: il plugin risponde dall'archivio prima
//     della rete. I 199 MB non si misurano interi — si leggerebbero tutti —
//     ma la porta sì: il `tileset.json` dell'archivio deve avere la sha256 che
//     la versione registra per la sua porta, se no il tileset non si carica.
Heriverse.loadTileset = (sceneNode, source, kind, label, expectedDoor = null) => {
	const inner = ATON.createSceneNode(`${sceneNode.nid || label}#tiles`);
	inner.rotation.set(-Math.PI / 2, 0, 0);
	inner.attachTo(sceneNode);
	if (kind !== "3tz") {
		inner.load(Heriverse.getLinkToResource(source.url));
		return Promise.resolve({ kind, url: source.url, line: `[Heriverse] RM ${label}: tileset from ${source.url}` });
	}
	const token = source.kind === "node" ? Heriverse.nodeToken() : null;
	const fetchFn = (u, opts = {}) => globalThis.fetch(u, token
		? { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } } : opts);
	const url = source.kind === "node" ? source.url : Heriverse.getLinkToResource(source.url);
	const archive = Archive3tz.open(httpSource(url, fetchFn));
	return archive.then(async (a) => {
		const door = await a.readEntry("tileset.json");
		const got = door ? hexOf(await globalThis.crypto.subtle.digest("SHA-256", door)) : null;
		const want = sha256Hex(expectedDoor);
		const ok = !!door && (!want || got === want);
		const line = !door
			? `[Heriverse] RM ${label}: the archive has no tileset.json; not loaded`
			: `[Heriverse] RM ${label}: tileset from the archive ${url} (${a.stats.entries} files, read by Range), `
				+ `its tileset.json sha256 ${got.slice(0, 12)}…`
				+ (want ? (ok ? " = the registered door" : ` ≠ the registered ${want.slice(0, 12)}…; not loaded`) : "");
		console.log(line);
		if (ok) {
			const base = archiveBase();
			ATON.MRes.loadTileSetFromURL(`${base}tileset.json`, inner);
			// il renderer ATON è appena nato e non ha ancora chiesto la radice
			// (la chiede al primo update): il plugin arriva prima della rete
			const ts = ATON.MRes._tsets[ATON.MRes._tsets.length - 1];
			ts.registerPlugin(new Tiles3tzPlugin(Promise.resolve(a), base));
		}
		return { kind, url, ok, door: got, expected: want, entries: a.stats.entries, line };
	}, (err) => {
		const line = `[Heriverse] RM ${label}: the archive ${url} could not be opened (${err?.message || err})`;
		console.log(line);
		return { kind, url, ok: false, line };
	});
};

function attachRepresentationModelToEpoch(representationModelNode, epochNode) {
	if (!epochNode) return;

	const name = representationModelNode.name;
	const chosen = Heriverse.chooseResourceForRepresentationModel(representationModelNode);
	if (!chosen) return;
	// C1 · da un nodo, una cartella di tessere non si serve: si prende la sua
	// rappresentazione in un file (il `.3tz`), se lo studio la dichiara
	let data = chosen.data;
	if (Heriverse.nodeStudy && Heriverse.tilesKindOf(data) === "directory") {
		const alt = Heriverse.servableRepresentation(Heriverse.currMG?.getNode?.(chosen.choice.entry.id));
		if (alt) {
			console.log(`[Heriverse] RM ${name}: the tileset folder is not on the node, its archive is (${alt.name})`);
			data = alt.data;
		}
	}
	const source = Heriverse.sourceOfResource(data);
	const tiles = Heriverse.tilesKindOf(data);

	const sceneNode = ATON.createSceneNode(name);
	if (tiles) {
		ATON._assetReqNew(`${name}#tiles`);
		Heriverse.loadTileset(sceneNode, source, tiles, name,
			tiles === "3tz" && data !== chosen.data ? chosen.data.checksum : null).then((got) => {
			Heriverse.lastLoads[representationModelNode.id] = {
				name, url: got.url, tiles, choice: chosen.choice.reason, use: chosen.choice.use,
				lod_level: chosen.choice.entry.lod_level, ok: got.ok !== false, door: got.door,
				registered: got.expected, entries: got.entries, line: got.line };
		}).finally(() => ATON._assetReqComplete(`${name}#tiles`));
	} else if (source.kind === "node") {
		ATON._assetReqNew(source.url);
		Heriverse.fetchVerified(source, name).then((got) => {
			Heriverse.lastLoads[representationModelNode.id] = {
				name, url: source.url, choice: chosen.choice.reason, use: chosen.choice.use,
				lod_level: chosen.choice.entry.lod_level, registered: got.expected,
				received: got.received, ok: got.ok, line: got.line };
			if (got.ok) Heriverse.loadModelBytes(sceneNode, got.buffer, source.url);
			else ATON._assetReqComplete(source.url);
		}).catch((err) => {
			console.error(`[Heriverse] RM ${name}: download failed`, err);
			ATON._assetReqComplete(source.url);
		});
	} else {
		Heriverse.lastLoads[representationModelNode.id] = {
			name, url: source.url, choice: chosen.choice.reason, use: chosen.choice.use,
			lod_level: chosen.choice.entry.lod_level };
		sceneNode.load(Heriverse.getLinkToResource(source.url));
	}

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
			// s3dgraphy unified the material-colour key on `rgba_color` (visual
			// rules 1.6.6); `color` is the legacy spelling the 13 stratigraphic
			// types used to carry. Read the new one first and keep the old as
			// tolerance, so this works against a vendored copy from either side
			// of the rename — and so a re-vendor cannot silently strip the
			// proxies of their material.
			const material_color =
				type_style?.material?.rgba_color ?? type_style?.material?.color;
			if (!material_color) continue;
			const { r, g, b } = material_color;
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

		// `UTR` is the pre-1.6 name of what the Extended Matrix now calls `TSU`
		// (E.D., 2026-08-02). It is still in HeriverseGraph.stratigraphicTypes,
		// and datasets authored before the rename still carry it, but it no
		// longer exists in em_visual_rules — so those proxies would come out
		// with no material at all. Alias the legacy name onto the current one
		// instead of dropping it: old graphs keep rendering, and the day the
		// data is migrated this block simply stops matching anything.
		const LEGACY_TYPE_ALIASES = { UTR: "TSU" };
		for (const [legacy, current] of Object.entries(LEGACY_TYPE_ALIASES)) {
			for (const state of ["_ON", "_OFF"]) {
				if (
					!Heriverse.semantic_shapes_materials[legacy + state] &&
					Heriverse.semantic_shapes_materials[current + state]
				)
					Heriverse.semantic_shapes_materials[legacy + state] =
						Heriverse.semantic_shapes_materials[current + state];
			}
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
