import Utils from "../../config/Utils.js";
import HeriverseNode from "../HeriverseGraph/HeriverseNode.js";
import SUIButton from "./SUIButton.js";
import { cleanSceneBeforePeriodChange } from "../temporalActions.js";

export const PANELS = {
	SECONDARY: 0,
	MAIN: 1,
	ALL: 2,
};

const welcome_text = "Welcome to Heriverse!";

const MAIN_PANEL_WIDTH = 0.25;
const MAIN_PANEL_HEIGHT = 0.125;
const BUTTON_WIDTH = 12;

const UI_VISUAL_OFFSET = 0.003;
const UI_HIT_OFFSET = -0.003;

const UI_PANEL_CONTENT_OFFSET = 0;
const UI_PANEL_BLOCK_OFFSET = UI_VISUAL_OFFSET;
const UI_PANEL_TEXT_OFFSET = UI_VISUAL_OFFSET * 3;

const UI_FONT_FAMILY = Utils.baseUrl + "/" + "res/fonts/Inter-VariableFont_opsz,wght-msdf.json";

const UI_FONT_TEXTURE = Utils.baseUrl + "/" + "res/fonts/Inter-VariableFontopszwght.png";

const leftSecondaryPanelElements = [];
const leftPanelElements = [];
const uiElements = {};
const elementsToDetachSecondary = [];
const elementsToDetachMain = [];
const textureLoader = new THREE.TextureLoader();

let xrWristPanelsUpdateToken = 0;

function updateXRWristPanels() {
	HeriverseGraphDrawer.wristLeftPanel?.update(true, true, true);
	HeriverseGraphDrawer.wristLeftSecondaryPanel?.update(true, true, true);
	HeriverseGraphDrawer.wristLeftSecondaryContent?.update(true, true, true);

	if (HeriverseGraphDrawer.leftButtonsGroup) {
		HeriverseGraphDrawer.leftButtonsGroup.children.forEach((child) => {
			child.update?.(true, true, true);
		});
	}

	ThreeMeshUI.update();
}

function scheduleXRWristPanelsUpdate() {
	const token = ++xrWristPanelsUpdateToken;

	updateXRWristPanels();

	setTimeout(() => {
		if (token !== xrWristPanelsUpdateToken) return;
		updateXRWristPanels();
	}, 50);

	setTimeout(() => {
		if (token !== xrWristPanelsUpdateToken) return;
		updateXRWristPanels();
	}, 150);

	setTimeout(() => {
		if (token !== xrWristPanelsUpdateToken) return;
		updateXRWristPanels();
	}, 300);
}

export function drawController(controller) {
	if (controller == ATON.XR.HAND_R) {
		return;
	} else if (controller == ATON.XR.HAND_L) {
		if (HeriverseGraphDrawer.wristLeftPanel) {
			while (HeriverseGraphDrawer.wristLeftPanel.children.length > 1) {
				let child = HeriverseGraphDrawer.wristLeftPanel.children[1];
				HeriverseGraphDrawer.wristLeftPanel.remove(child);
			}

			ATON.XR.getSecondaryController().remove(HeriverseGraphDrawer.wristLeftPanel);
		}
		if (HeriverseGraphDrawer.wristLeftSecondaryPanel) {
			while (HeriverseGraphDrawer.wristLeftSecondaryPanel.children.length > 1) {
				let child = HeriverseGraphDrawer.wristLeftSecondaryPanel.children[1];
				HeriverseGraphDrawer.wristLeftSecondaryPanel.remove(child);
			}

			ATON.XR.getSecondaryController().remove(HeriverseGraphDrawer.wristLeftSecondaryPanel);
		}

		[HeriverseGraphDrawer.wristLeftPanel, HeriverseGraphDrawer.wristLeftSecondaryPanel] =
			drawLeftController();

		ATON.XR.getSecondaryController().add(HeriverseGraphDrawer.wristLeftPanel);
		ATON.XR.getSecondaryController().add(HeriverseGraphDrawer.wristLeftSecondaryPanel);

		if (HeriverseGraphDrawer.leftButtonsGroup) {
			ATON.XR.getSecondaryController().remove(HeriverseGraphDrawer.leftButtonsGroup);
			HeriverseGraphDrawer.leftButtonsGroup = null;
		}

		HeriverseGraphDrawer.leftButtonsGroup = otherButtonsGroup();

		ATON.XR.getSecondaryController().add(HeriverseGraphDrawer.leftButtonsGroup);
	}

	scheduleXRWristPanelsUpdate();
}

function drawLeftController() {
	const panel = PANELS.MAIN;
	const border_offset = 0.01;

	clearCarouselInteractiveElements(HeriverseGraphDrawer, panel, PANELS);

	const periods = getLeftControllerPeriods();

	const epochWidth = MAIN_PANEL_WIDTH * 0.65;
	const epochHeight = MAIN_PANEL_HEIGHT * 0.25;
	const arrowSize = epochHeight;
	const gap = 0.006;

	let mainPanel = new ThreeMeshUI.Block({
		padding: 0.02,
		justifyContent: "center",
		alignItems: "center",
		contentDirection: "row",
		backgroundColor: new THREE.Color(0x666666),
		borderRadius: 0.02,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
		backgroundOpacity: 0.2,
	});

	mainPanel.width = epochWidth + arrowSize * 2 + gap * 6 + border_offset * 2;
	mainPanel.height = epochHeight + border_offset * 2;

	mainPanel.position.set(-0.05, 0, 0.15);
	mainPanel.rotation.x = Math.PI / 2;
	mainPanel.rotation.z = -Math.PI / 2;
	mainPanel.rotation.y = -Math.PI / 2;

	const centerSlot = new ThreeMeshUI.Block({
		width: epochWidth,
		height: epochHeight,
		margin: gap,
		justifyContent: "center",
		alignItems: "center",
		backgroundOpacity: 0,
	});

	const carouselState = {
		panel,
		index: 0,
		items: [],
		centerSlot,
		currentItem: null,
	};

	periods.forEach((tp) => {
		const item = epochButtonBuilder(tp, panel, {
			registerInteractive: false,
			returnMeta: true,
		});

		carouselState.items.push(item);
		leftPanelElements.push(item.block);
	});

	const prevArrow = arrowButtonBuilder({
		id: "leftCarouselPrevBtn",
		label: "-",
		panel,
		size: arrowSize,
		onSelect: () => {
			if (carouselState.index === 0) return;
			showCarouselItem(carouselState, carouselState.index - 1);
		},
	});

	const nextArrow = arrowButtonBuilder({
		id: "leftCarouselNextBtn",
		label: "+",
		panel,
		size: arrowSize,
		onSelect: () => {
			if (carouselState.index === carouselState.items.length - 1) return;
			showCarouselItem(carouselState, carouselState.index + 1);
		},
	});

	mainPanel.add(prevArrow.block);
	mainPanel.add(centerSlot);
	mainPanel.add(nextArrow.block);

	if (carouselState.items.length > 0) {
		showCarouselItem(carouselState, 0);
	} else {
		centerSlot.add(
			new ThreeMeshUI.Text({
				content: "Nessun periodo",
				fontSize: 0.014,
			})
		);
	}

	HeriverseGraphDrawer.leftCarousel = carouselState;

	let secondaryPanel = drawLeftSecondaryPanel();

	return [mainPanel, secondaryPanel];
}

function drawLeftSecondaryPanel() {
	const mainPanel = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH,
		height: MAIN_PANEL_HEIGHT,
		padding: 0.02,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: new THREE.Color(0x666666),
		backgroundOpacity: 0.6,
		borderRadius: 0.02,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	const contentRoot = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH - 0.04,
		height: MAIN_PANEL_HEIGHT - 0.04,
		padding: 0,
		margin: 0,
		justifyContent: "center",
		alignItems: "center",
		contentDirection: "column",
		backgroundColor: new THREE.Color(0xff0000),
		backgroundOpacity: 0,
		offset: UI_PANEL_CONTENT_OFFSET,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	mainPanel.add(contentRoot);

	HeriverseGraphDrawer.wristLeftSecondaryContent = contentRoot;

	const text = new ThreeMeshUI.Text({
		content: welcome_text,
		fontSize: 0.02,
		offset: UI_VISUAL_OFFSET,
	});

	contentRoot.add(text);
	leftSecondaryPanelElements.push(text);

	mainPanel.position.set(0.05, 0, 0.15);
	mainPanel.rotation.set(-Math.PI / 2, Math.PI / 2, Math.PI / 2);

	mainPanel.update(true, true, true);
	contentRoot.update(true, true, true);

	return mainPanel;
}

function otherButtonsGroup() {
	const buttonDim = MAIN_PANEL_HEIGHT;

	const buttonsGroup = new THREE.Group();
	buttonsGroup.position.set(-0.05, 0.06, 0.35);
	buttonsGroup.rotation.x = Math.PI / 2;
	buttonsGroup.rotation.z = -Math.PI / 2;
	buttonsGroup.rotation.y = -Math.PI / 2;

	const quitVRModeBtn = createStdButtonSUI({
		uuid: "quitVRModeBtn",
		widthRatio: 0.45,
		heightRatio: 0.35,
		iconUrl: "/a/heriverse/assets/icons/Vector-4.png",
		bIconBackground: false,
		bgdOpacity: 1,
		baseColor: ATON.MatHub.colors.red,
		containerOptions: { padding: 30, borderRadius: 0.01 },
		onSelect: () => {
			ATON.XR.toggle();
		},
	});

	const switchModeSection = switchModeButtonSectionSUI();
	switchModeSection.position.set(0, 0.05, 0);

	buttonsGroup.add(quitVRModeBtn);
	buttonsGroup.add(switchModeSection);

	return buttonsGroup;
}

function createStdButtonSUI({
	uuid,
	widthRatio = 0.65,
	heightRatio = 0.35,
	iconUrl,
	bIconBackground = false,
	bgdOpacity,
	bSwitched = false,
	switchColor,
	baseColor,
	containerOptions = {},
	onSelect = () => {},
}) {
	const button = new SUIButton(uuid, widthRatio, heightRatio);
	if (iconUrl) button.setIcon(iconUrl, bIconBackground);
	if (bgdOpacity >= 0.0) button.setBackgroundOpacity(bgdOpacity);
	if (bSwitched) {
		button.switch(bSwitched);
	}
	if (switchColor && switchColor instanceof THREE.Color) button.setSwitchColor(switchColor);
	if (baseColor && baseColor instanceof THREE.Color) button.setBaseColor(baseColor);
	if (Object.keys(containerOptions).length) {
		button.container.set(containerOptions);
		button.container.update(true, true, true);
	}
	button.onSelect = onSelect;

	return button;
}

const SWITCH_BACKGROUND_RENDER_ORDER = -100;
const SWITCH_BUTTON_RENDER_ORDER = 100;

function applyRenderLayer(root, renderOrder, { depthWrite = false, depthTest = false } = {}) {
	if (!root) return;

	root.renderOrder = renderOrder;

	root.traverse?.((child) => {
		child.renderOrder = renderOrder;

		if (!child.material) return;

		const materials = Array.isArray(child.material) ? child.material : [child.material];

		materials.forEach((material) => {
			material.transparent = true;
			material.depthWrite = depthWrite;
			material.depthTest = depthTest;
			material.needsUpdate = true;
		});
	});
}

function lockSwitchBackgroundLayer(background) {
	if (!background) return;

	background.renderOrder = SWITCH_BACKGROUND_RENDER_ORDER;

	background.update?.(true, true, true);

	applyRenderLayer(background, SWITCH_BACKGROUND_RENDER_ORDER, {
		depthWrite: false,
		depthTest: false,
	});

	// ThreeMeshUI può rigenerare mesh/materiali dopo update.
	setTimeout(() => {
		applyRenderLayer(background, SWITCH_BACKGROUND_RENDER_ORDER, {
			depthWrite: false,
			depthTest: false,
		});
	}, 50);
}

function lockSwitchButtonLayer(button) {
	if (!button) return;

	button.renderOrder = SWITCH_BUTTON_RENDER_ORDER;
	button.container?.update?.(true, true, true);
	button.update?.(true, true, true);

	applyRenderLayer(button, SWITCH_BUTTON_RENDER_ORDER, {
		depthWrite: false,
		depthTest: false,
	});

	setTimeout(() => {
		applyRenderLayer(button, SWITCH_BUTTON_RENDER_ORDER, {
			depthWrite: false,
			depthTest: false,
		});
	}, 50);
}

function lockSwitchModeSectionLayers(background, pointerModeBtn, nodeInteractionModeBtn) {
	lockSwitchBackgroundLayer(background);
	lockSwitchButtonLayer(pointerModeBtn);
	lockSwitchButtonLayer(nodeInteractionModeBtn);
}

function switchModeButtonSectionSUI() {
	const buttonSection = new THREE.Group();

	const background = new ThreeMeshUI.Block({
		width: 0.065,
		height: 0.09,
		padding: 0.01,
		borderRadius: 0.015,
		backgroundColor: new THREE.Color(0x222222),
		backgroundOpacity: 0.75,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});
	background.position.set(0, 0.02, -0.025);
	// background.renderOrder = -1;

	buttonSection.add(background);

	const pointerModeBtn = createStdButtonSUI({
		uuid: "pointerModeBtn",
		widthRatio: 0.45,
		heightRatio: 0.35,
		iconUrl: "/a/heriverse/assets/icons/pointerMode.png",
		bIconBackground: false,
		bgdOpacity: 1,
		bSwitched: Heriverse._bXRPointerMode,
		switchColor: ATON.MatHub.colors.green,
		baseColor: ATON.MatHub.colors.defUI,
		containerOptions: { padding: 30, borderRadius: 0.01, renderOrder: 1 },
		onSelect: () => {
			if (Heriverse._bXRPointerMode) return;
			Heriverse.setXRPointerMode(true);
			pointerModeBtn.switch(Heriverse._bXRPointerMode);
			nodeInteractionModeBtn.switch(!Heriverse._bXRPointerMode);

			lockSwitchModeSectionLayers(background, pointerModeBtn, nodeInteractionModeBtn);
			scheduleXRWristPanelsUpdate();
		},
	});

	const nodeInteractionModeBtn = createStdButtonSUI({
		uuid: "nodeInteractionModeBtn",
		widthRatio: 0.45,
		heightRatio: 0.35,
		iconUrl: "/a/heriverse/assets/icons/nodeInteractionMode.png",
		bIconBackground: false,
		bgdOpacity: 1,
		bSwitched: !Heriverse._bXRPointerMode,
		switchColor: ATON.MatHub.colors.green,
		baseColor: ATON.MatHub.colors.defUI,
		containerOptions: { padding: 30, borderRadius: 0.01, renderOrder: 1 },
		onSelect: () => {
			if (!Heriverse._bXRPointerMode) return;
			Heriverse.setXRPointerMode(false);
			nodeInteractionModeBtn.switch(!Heriverse._bXRPointerMode);
			pointerModeBtn.switch(Heriverse._bXRPointerMode);

			lockSwitchModeSectionLayers(background, pointerModeBtn, nodeInteractionModeBtn);
			scheduleXRWristPanelsUpdate();
		},
	});
	nodeInteractionModeBtn.position.set(0, 0.04, 0);

	buttonSection.add(pointerModeBtn);
	buttonSection.add(nodeInteractionModeBtn);

	lockSwitchModeSectionLayers(background, pointerModeBtn, nodeInteractionModeBtn);

	return buttonSection;
}

function getLeftControllerPeriods() {
	return Heriverse.currentGraphs.length > 1 ? Heriverse.temporalFilters : Heriverse.timeline;
}

function showCarouselItem(carouselState, newIndex) {
	if (!carouselState.items.length) return;

	const itemsLength = carouselState.items.length;
	const normalizedIndex = ((newIndex % itemsLength) + itemsLength) % itemsLength;

	if (carouselState.currentItem) {
		carouselState.centerSlot.remove(carouselState.currentItem.block);
		unregisterInteractiveElement(
			HeriverseGraphDrawer,
			carouselState.currentItem.button,
			carouselState.panel,
			PANELS
		);
	}

	const nextItem = carouselState.items[normalizedIndex];

	carouselState.centerSlot.add(nextItem.block);
	registerInteractiveElement(HeriverseGraphDrawer, nextItem.button, carouselState.panel, PANELS);

	carouselState.currentItem = nextItem;
	carouselState.index = normalizedIndex;

	nextItem.block.update(true, true, true);
	carouselState.centerSlot.update(true, true, true);
}

function arrowButtonBuilder({ id, label, panel, size, onSelect }) {
	const arrowBlock = new ThreeMeshUI.Block({
		width: size,
		height: size,
		margin: 0.006,
		borderRadius: 0.01,
		textAlign: "center",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: new THREE.Color(0x444444),
		backgroundOpacity: 0,
	});

	// arrowBlock.add(
	// 	new ThreeMeshUI.Text({
	// 		content: label,
	// 		fontSize: 0.025,
	// 	})
	// );

	const buttonBlock = new ThreeMeshUI.Block({
		width: size,
		height: size,
		backgroundOpacity: 0,
	});

	const arrowButton = new SUIButton(id, BUTTON_WIDTH * 0.1);
	// const arrowButton = new SUIButton(id, BUTTON_WIDTH * 0.25);

	arrowButton.setIcon(
		label === "+"
			? "/a/heriverse/res/graphicons/play.png"
			: "/a/heriverse/res/graphicons/play_rev.png"
	);

	arrowButton.onSelect = onSelect;

	arrowButton.onHover = () => {
		arrowBlock.backgroundOpacity = 1;
	};

	arrowButton.onLeave = () => {
		arrowBlock.backgroundOpacity = 0.55;
	};

	arrowButton.setScale(0.2).setBackgroundOpacity(0);

	buttonBlock.add(arrowButton);
	arrowBlock.add(buttonBlock);

	registerInteractiveElement(HeriverseGraphDrawer, arrowButton, panel, PANELS);

	return {
		block: arrowBlock,
		button: arrowButton,
	};
}

function epochButtonBuilder(tp, panel, options = {}) {
	const registerInteractive = options.registerInteractive ?? true;
	const returnMeta = options.returnMeta ?? false;

	let buttonId = tp.id + "Btn";

	let epochButtonBlock = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH * 0.65,
		height: MAIN_PANEL_HEIGHT * 0.25,
		margin: 0.005,
		borderRadius: 0.01,
		textAlign: "center",
		justifyContent: "center",
		backgroundOpacity: 0.4,

		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
		fontColor: new THREE.Color(0xffffff),
	});

	epochButtonBlock.add(
		new ThreeMeshUI.Text({
			content: tp.name,
			fontSize: 0.015,
		})
	);

	let buttonBlock = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH * 0.65,
		height: MAIN_PANEL_HEIGHT * 0.25,
		backgroundOpacity: 0,
	});

	let epochButton = new SUIButton(buttonId, BUTTON_WIDTH * 0.65);

	if (tp.color) {
		epochButtonBlock.backgroundColor = tp.color;

		if (tp.color.r !== undefined && tp.color.g !== undefined && tp.color.b !== undefined) {
			epochButton.setBaseColor(new THREE.Color().setRGB(tp.color.r, tp.color.g, tp.color.b));
		} else if (tp.r !== undefined && tp.g !== undefined && tp.b !== undefined) {
			epochButton.setBaseColor(new THREE.Color().setRGB(tp.r, tp.g, tp.b));
		}
	}

	epochButton.onSelect = () => {
		selectTemporalPeriod(tp);
	};

	epochButton.onHover = () => {
		epochButtonBlock.backgroundOpacity = 1;
	};

	epochButton.onLeave = () => {
		epochButtonBlock.backgroundOpacity = 0.4;
	};

	epochButton.setScale(0.2).setBackgroundOpacity(0);

	buttonBlock.add(epochButton);
	epochButtonBlock.add(buttonBlock);

	if (registerInteractive) {
		registerInteractiveElement(HeriverseGraphDrawer, epochButton, panel, PANELS);
	}

	if (returnMeta) {
		return {
			block: epochButtonBlock,
			button: epochButton,
			tp,
		};
	}

	return epochButtonBlock;
}

export function getDetachListByPanel(drawer, panel, panels) {
	if (panel === panels.SECONDARY) return elementsToDetachSecondary;
	return elementsToDetachMain;
}

export function registerInteractiveElement(drawer, element, panel, panels) {
	const list = getDetachListByPanel(drawer, panel, panels);

	if (!list.includes(element)) {
		list.push(element);
	}

	// Serve per ripulire solo gli elementi del carosello se ricrei il pannello
	element._carouselPanel = panel;
}

export function unregisterInteractiveElement(drawer, element, panel, panels) {
	const list = getDetachListByPanel(drawer, panel, panels);
	const index = list.indexOf(element);

	if (index !== -1) {
		list.splice(index, 1);
	}

	element.disablePicking?.();

	if (ATON.getRootUI) {
		ATON.getRootUI().remove(element);
	}

	delete element._carouselPanel;
}

export function clearCarouselInteractiveElements(drawer, panel, panels) {
	const list = getDetachListByPanel(drawer, panel, panels);

	for (let i = list.length - 1; i >= 0; i--) {
		const element = list[i];

		if (element._carouselPanel === panel) {
			element.disablePicking?.();

			if (ATON.getRootUI) {
				ATON.getRootUI().remove(element);
			}

			delete element._carouselPanel;
			list.splice(i, 1);
		}
	}
}

export function drawDetailsOnWrist(controller, node) {
	if (controller == ATON.XR.HAND_R) {
		if (node) {
			clearPanel(PANELS.MAIN);

			resetLeftPanelLayout();

			addElementToPanel(PANELS.MAIN, node);
			showNodeOnSecondaryPanel(node);
		} else {
			clearPanel(PANELS.MAIN);
			clearPanel(PANELS.SECONDARY);

			HeriverseGraphDrawer.drawController(ATON.XR.HAND_L);
		}
	} else if (controller == ATON.XR.HAND_L) {
		clearPanel(PANELS.SECONDARY);
	}

	scheduleXRWristPanelsUpdate();
}

export function addElementToPanel(panel, node) {
	if (panel === PANELS.MAIN) {
		HeriverseGraphDrawer.wristLeftPanel.justifyContent = "";
		HeriverseGraphDrawer.wristLeftPanel.alignItems = "start";
		HeriverseGraphDrawer.wristLeftPanel.padding = 0;
		HeriverseGraphDrawer.wristLeftPanel.width = MAIN_PANEL_WIDTH;

		let offset = 0.015;

		const subPanel1 = new ThreeMeshUI.Block({
			width: MAIN_PANEL_WIDTH,
			height: MAIN_PANEL_HEIGHT,
			backgroundColor: new THREE.Color(0x222222),
			backgroundOpacity: 1,
			fontFamily: UI_FONT_FAMILY,
			fontTexture: UI_FONT_TEXTURE,
		});

		const subPanel2 = new ThreeMeshUI.Block({
			width: MAIN_PANEL_WIDTH,
			height: MAIN_PANEL_HEIGHT * 0.65,
			contentDirection: "row",
			alignItems: "start",
			backgroundColor: new THREE.Color(0x222222).toArray(),
			backgroundOpacity: 0.5,
			fontFamily: UI_FONT_FAMILY,
			fontTexture: UI_FONT_TEXTURE,
		});
		leftPanelElements.push(subPanel2);
		HeriverseGraphDrawer.wristLeftPanel.add(subPanel2);

		const subPanel3 = new ThreeMeshUI.Block({
			width: MAIN_PANEL_WIDTH,
			height: MAIN_PANEL_HEIGHT * 0.5,
			contentDirection: "row",
			alignItems: "center",
			justifyContent: "space-evenly",
			backgroundColor: new THREE.Color(0x222222),
			backgroundOpacity: 0.5,
		});
		leftPanelElements.push(subPanel3);
		HeriverseGraphDrawer.wristLeftPanel.add(subPanel3);

		const nameBlock = new ThreeMeshUI.Block({
			width: subPanel1.width,
			height: subPanel1.height * 0.25,
			textAlign: "center",
			backgroundOpacity: 0,
			fontFamily: UI_FONT_FAMILY,
			fontTexture: UI_FONT_TEXTURE,
		});
		subPanel1.add(nameBlock);
		const nodeName = new ThreeMeshUI.Text({
			content: node.name,
			fontSize: 0.02,
		});
		nameBlock.add(nodeName);
		if (node.description) {
			const descriptionBlock = new ThreeMeshUI.Block({
				width: subPanel1.width,
				height: subPanel1.height * 0.75,
				padding: 0.01,
				textAlign: "left",
				backgroundOpacity: 0,
				fontFamily: UI_FONT_FAMILY,
				fontTexture: UI_FONT_TEXTURE,
			});
			subPanel1.add(descriptionBlock);
			const nodeDescr = new ThreeMeshUI.Text({
				content: node.description,
				fontSize: 0.01,
			});
			descriptionBlock.add(nodeDescr);
		}

		const nodes_relation = [];
		let nodes_relation_index = 0;
		for (let relation in node.edges) {
			if (relation !== "from" && relation !== "to") {
				nodes_relation.push(relation);
			}
		}

		const adjacentsPanelCollection = [];
		for (let relation in nodes_relation) {
			let panel = panelAdjacentByRelation(node, nodes_relation[relation]);
			if (!panel) continue;
			panel.visible = false;
			deactivatePanelButtons(panel.children);
			adjacentsPanelCollection.push(panel);
			subPanel2.add(panel);
		}

		if (!adjacentsPanelCollection.length) {
			subPanel2.add(
				new ThreeMeshUI.Text({
					content: "No relation available",
					fontSize: 0.01,
				})
			);

			HeriverseGraphDrawer.wristLeftPanel.height = subPanel2.height + subPanel3.height + offset;
			return;
		}

		let sP2length = Math.max(...adjacentsPanelCollection.map((obj) => obj.height));
		subPanel2.height = sP2length;
		adjacentsPanelCollection[nodes_relation_index].visible = true;
		adjacentsPanelCollection[nodes_relation_index].position.set(0.05, 0, 0);
		activatePanelButtons(adjacentsPanelCollection[nodes_relation_index].children);

		const blockButtonPrev = new ThreeMeshUI.Block({
			width: subPanel3.width * 0.25,
			height: subPanel3.height,
			backgroundOpacity: 0,
		});
		const buttonPrev = new SUIButton("bPrev");
		buttonPrev.setScale(0.35).setIcon(Utils.baseUrl + "/" + "res/graphicons/play_rev.png", true);
		buttonPrev.onSelect = () => {
			if (nodes_relation_index > 0) {
				adjacentsPanelCollection[nodes_relation_index].visible = false;
				deactivatePanelButtons(adjacentsPanelCollection[nodes_relation_index].children);
				nodes_relation_index--;
				adjacentsPanelCollection[nodes_relation_index].visible = true;
				adjacentsPanelCollection[nodes_relation_index].position.set(0, 0, 0);
				activatePanelButtons(adjacentsPanelCollection[nodes_relation_index].children);
				subPanel2.height = adjacentsPanelCollection[nodes_relation_index].height;
			}
		};
		blockButtonPrev.add(buttonPrev);
		elementsToDetachMain.push(buttonPrev);

		const blockButtonNext = new ThreeMeshUI.Block({
			width: subPanel3.width * 0.25,
			height: subPanel3.height,
			backgroundOpacity: 0,
		});
		const buttonNext = new SUIButton("bNext");
		buttonNext.setScale(0.35).setIcon(Utils.baseUrl + "/" + "res/graphicons/play.png", true);
		buttonNext.onSelect = () => {
			if (nodes_relation_index < nodes_relation.length - 1) {
				adjacentsPanelCollection[nodes_relation_index].visible = false;
				deactivatePanelButtons(adjacentsPanelCollection[nodes_relation_index].children);
				nodes_relation_index++;
				adjacentsPanelCollection[nodes_relation_index].visible = true;
				adjacentsPanelCollection[nodes_relation_index].position.set(0, 0, 0);
				activatePanelButtons(adjacentsPanelCollection[nodes_relation_index].children);
				subPanel2.height = adjacentsPanelCollection[nodes_relation_index].height;
			}
		};
		blockButtonNext.add(buttonNext);
		elementsToDetachMain.push(buttonNext);

		subPanel3.add(blockButtonPrev);
		subPanel3.add(blockButtonNext);

		HeriverseGraphDrawer.wristLeftPanel.height = subPanel2.height + subPanel3.height + offset;
	} else if (panel === PANELS.SECONDARY) {
		showNodeOnSecondaryPanel(node);
	}
}

function panelAdjacentByRelation(node, relation) {
	const panel = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH,
		height: MAIN_PANEL_HEIGHT * 0.65,
		alignItems: "center",
		backgroundColor: new THREE.Color(0x222222),
		backgroundOpacity: 0,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	let panelFinalHeight = 0;
	let nodesByRelation = node.getNeighborsByRelationP(relation, HeriverseNode.DIRECTIONS.BOTH) || {};
	if (Object.keys(nodesByRelation).length <= 0) return;
	let relationName = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH,
		height: MAIN_PANEL_HEIGHT * 0.3,
		borderRadius: 0,
		padding: 0.005,
		margin: 0.01,
		backgroundOpacity: 0,
		textAlign: "left",
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	panelFinalHeight = relationName.height + relationName.margin * 2;

	relationName.add(
		new ThreeMeshUI.Text({
			content: HeriverseNode.RELATION_LABELS[relation] || relation,
			fontSize: 0.008,
		})
	);
	panel.add(relationName);
	for (let adjacentIndex in nodesByRelation) {
		let row = buildAdjacentEntry(nodesByRelation[adjacentIndex], panel);
		panel.add(row);
		panelFinalHeight += row.height + row.margin * 2;
	}
	panel.height = panelFinalHeight;

	return panel;
}

function deactivatePanelButtons(panelChildren) {
	for (let childIndex in panelChildren) {
		if (childIndex > 1) {
			panelChildren[childIndex].children[3].children[1].hide();
		}
	}
}

function activatePanelButtons(panelChildren) {
	for (let childIndex in panelChildren) {
		if (childIndex > 1) {
			panelChildren[childIndex].children[3].children[1].show();
		}
	}
}

function buildAdjacentEntry(node, subPanel) {
	let uiNode_index = "rE" + node.name;

	let rowEntry = new ThreeMeshUI.Block({
		contentDirection: "row",
		width: MAIN_PANEL_WIDTH,
		height: MAIN_PANEL_HEIGHT * 0.2,
		margin: 0.01,
		borderRadius: 0,
		backgroundOpacity: 0,
		justifyContent: "center",
		alignItems: "center",
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	let entryButton = new SUIButton(uiNode_index, 12);
	entryButton.baseOpacity = 0;
	entryButton.hoverOpacity = 0;
	entryButton.onSelect = () => {
		showNodeOnSecondaryPanel(node);
	};
	entryButton.setScale(0.2).setBackgroundOpacity(0);

	elementsToDetachMain.push(entryButton);

	let buttonBlock = new ThreeMeshUI.Block({
		width: rowEntry.width,
		height: rowEntry.height,
		margin: rowEntry.margin,
		backgroundOpacity: 0,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
		offset: UI_HIT_OFFSET,
	});
	buttonBlock.add(entryButton);

	let typeImg;
	if (
		node.type === "EpochNode" || // epoch
		node.type === "semantic_shape" ||
		node.type === "ActivityNodeGroup" ||
		node.type === "ParadataNodeGroup" ||
		node.type === "author" ||
		node.type === "link"
	) {
		typeImg = new ThreeMeshUI.InlineBlock({
			height: rowEntry.height * 0.75,
			width: rowEntry.height,
			borderRadius: 0,
			backgroundSize: "stretch",
			offset: UI_VISUAL_OFFSET,
		});
	} else if (node.type === "document") {
		typeImg = new ThreeMeshUI.InlineBlock({
			height: 0.03,
			width: rowEntry.height * 0.75,
			borderRadius: 0,
			backgroundSize: "stretch",
			offset: UI_VISUAL_OFFSET,
		});
	} else {
		typeImg = new ThreeMeshUI.InlineBlock({
			height: rowEntry.height * 0.75,
			width: 0.03,
			borderRadius: 0,
			backgroundSize: "stretch",
			offset: UI_VISUAL_OFFSET,
		});
	}

	rowEntry.add(typeImg);

	textureLoader.load(
		Utils.baseUrl + "/" + "res/graphicons/" + node.type + ".png",
		(texture) => {
			typeImg.set({
				backgroundTexture: texture,
				backgroundOpacity: 1,
				backgroundColor: new THREE.Color(0xffffff),
			});
		},
		undefined,
		() =>
			textureLoader.load(
				Utils.baseUrl + "/" + "res/graphicons/" + "generic_node" + ".png",
				(texture) => {
					typeImg.set({
						backgroundTexture: texture,
						backgroundOpacity: 1,
						backgroundColor: new THREE.Color(0xffffff),
					});
				}
			)
	);

	const name = new ThreeMeshUI.Text({
		content: "\t\t" + node.name,
		fontSize: 0.01,
		offset: UI_VISUAL_OFFSET,
	});

	rowEntry.add(name);
	rowEntry.add(buttonBlock);

	uiElements[uiNode_index] = rowEntry;

	return rowEntry;
}

function removeSecondaryPanelChildren() {
	const contentRoot = HeriverseGraphDrawer.wristLeftSecondaryContent;

	if (!contentRoot) return;

	while (contentRoot.children.length > 1) {
		contentRoot.remove(contentRoot.children[1]);
	}
}

function removeAllPanelChildren(panel) {
	if (panel === PANELS.MAIN) {
		const targetPanel = HeriverseGraphDrawer.wristLeftPanel;

		if (!targetPanel) return;

		while (targetPanel.children.length) {
			targetPanel.remove(targetPanel.children[0]);
		}

		return;
	}

	if (panel === PANELS.SECONDARY) {
		removeSecondaryPanelChildren();
	}
}

function clearPanelInteractivity(panel) {
	const list = getDetachListByPanel(HeriverseGraphDrawer, panel, PANELS);

	list.forEach((element) => {
		element.disablePicking();
		ATON.getRootUI().remove(element);
	});

	list.length = 0;
}

function clearSecondaryContent() {
	const contentRoot = HeriverseGraphDrawer.wristLeftSecondaryContent;
	if (!contentRoot) return;

	while (contentRoot.children.length > 1) {
		contentRoot.remove(contentRoot.children[1]);
	}

	contentRoot.children.length = 1;
}

export function clearPanel(panel) {
	if (panel === PANELS.MAIN) {
		clearPanelInteractivity(PANELS.MAIN);
		removeAllPanelChildren(PANELS.MAIN);

		leftPanelElements.length = 0;
		HeriverseGraphDrawer.leftCarousel = null;
	} else if (panel === PANELS.SECONDARY) {
		clearPanelInteractivity(PANELS.SECONDARY);
		removeAllPanelChildren(PANELS.SECONDARY);

		leftSecondaryPanelElements.length = 0;
	} else if (panel === PANELS.ALL) {
		clearPanel(PANELS.MAIN);
		clearPanel(PANELS.SECONDARY);
	}
}

function resetLeftPanelLayout() {
	const panel = HeriverseGraphDrawer.wristLeftPanel;
	if (!panel) return;

	panel.set({
		justifyContent: "center",
		alignItems: "center",
		padding: 0.02,
		width: MAIN_PANEL_WIDTH,
		height: MAIN_PANEL_HEIGHT,
		contentDirection: "column",
	});

	panel.position.y = 0;
}

function selectTemporalPeriod(tp) {
	cleanSceneBeforePeriodChange();

	if (Heriverse.currentGraphs.length > 1) {
		Heriverse.filterByPeriod(tp);
	} else {
		Heriverse.currMG.proxyNodes = {};
		Heriverse.goToPeriodById(tp.id);
		Heriverse.createSemanticShapeNodes();
	}
}

function copySecondaryPanelTransform(targetPanel, sourcePanel = null) {
	if (sourcePanel) {
		targetPanel.position.copy(sourcePanel.position);
		targetPanel.rotation.copy(sourcePanel.rotation);
		targetPanel.scale.copy(sourcePanel.scale);
		return;
	}

	targetPanel.position.set(0.05, 0, 0.15);
	targetPanel.rotation.set(-Math.PI / 2, Math.PI / 2, Math.PI / 2);
}

function getSecondaryPanelSizeForNode(node) {
	const titleHeight = MAIN_PANEL_HEIGHT * 0.25;
	const descriptionHeight = MAIN_PANEL_HEIGHT * 0.5;
	const descriptionMargin = 0.01;
	const panelPadding = 0.04;

	let contentHeight = titleHeight;

	if (node?.description) {
		contentHeight += descriptionHeight + descriptionMargin * 2;
	}

	const panelHeight = Math.max(MAIN_PANEL_HEIGHT, contentHeight + panelPadding);

	return {
		titleHeight,
		descriptionHeight,
		descriptionMargin,
		contentHeight,
		panelHeight,
	};
}

function createSecondaryPanelShell(height = MAIN_PANEL_HEIGHT) {
	const panel = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH,
		height,
		padding: 0.02,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: new THREE.Color(0x666666),
		backgroundOpacity: 0.6,
		borderRadius: 0.02,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	const contentRoot = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH - 0.04,
		height: Math.max(height - 0.04, 0.01),
		padding: 0,
		margin: 0,
		justifyContent: "start",
		alignItems: "center",
		contentDirection: "column",
		backgroundColor: new THREE.Color(0xff0000),
		backgroundOpacity: 0,
		offset: UI_PANEL_CONTENT_OFFSET,
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	panel.add(contentRoot);

	return { panel, contentRoot };
}

function buildSecondaryPanelForNode(node) {
	const { titleHeight, descriptionHeight, descriptionMargin, contentHeight, panelHeight } =
		getSecondaryPanelSizeForNode(node);

	const { panel, contentRoot } = createSecondaryPanelShell();

	const titleBlock = new ThreeMeshUI.Block({
		width: MAIN_PANEL_WIDTH - 0.04,
		height: titleHeight,
		interLine: 0.01,
		backgroundColor: new THREE.Color(0x222222),
		backgroundOpacity: 0,
		justifyContent: "start",
		offset: UI_PANEL_BLOCK_OFFSET,
		fontColor: new THREE.Color(0xffffff),
		fontFamily: UI_FONT_FAMILY,
		fontTexture: UI_FONT_TEXTURE,
	});

	const nameText = new ThreeMeshUI.Text({
		content: node?.name || "",
		fontSize: 0.015,
		fontColor: new THREE.Color(0xffffff),
		offset: UI_PANEL_TEXT_OFFSET,
	});

	titleBlock.add(nameText);
	contentRoot.add(titleBlock);

	if (node?.description) {
		const descBlock = new ThreeMeshUI.Block({
			width: MAIN_PANEL_WIDTH - 0.04,
			height: descriptionHeight,
			padding: 0.01,
			margin: descriptionMargin,
			alignItems: "center",
			backgroundColor: new THREE.Color(0x222222),
			backgroundOpacity: 0,
			offset: UI_PANEL_BLOCK_OFFSET,
			fontColor: new THREE.Color(0xffffff),
			fontFamily: UI_FONT_FAMILY,
			fontTexture: UI_FONT_TEXTURE,
		});

		const descText = new ThreeMeshUI.Text({
			content: node.description,
			fontSize: 0.01,
			fontColor: new THREE.Color(0xffffff),
			offset: UI_PANEL_TEXT_OFFSET,
		});

		descBlock.add(descText);
		contentRoot.add(descBlock);
	}

	contentRoot.height = contentHeight;
	panel.height = panelHeight;

	return { panel, contentRoot };
}

let secondaryPanelSwapId = 0;

function updateSecondaryPanelMesh(panel, contentRoot) {
	if (!panel || !contentRoot) return;

	contentRoot.update(true, true, true);
	panel.update(true, true, true);
	ThreeMeshUI.update();
}

function replaceSecondaryPanel(nextPanel, nextContentRoot) {
	const controller = ATON.XR.getSecondaryController();
	if (!controller || !nextPanel || !nextContentRoot) return;

	const previousPanel = HeriverseGraphDrawer.wristLeftSecondaryPanel;

	copySecondaryPanelTransform(nextPanel, previousPanel);

	if (previousPanel && previousPanel.parent === controller) {
		controller.remove(previousPanel);
	}

	controller.add(nextPanel);

	HeriverseGraphDrawer.wristLeftSecondaryPanel = nextPanel;
	HeriverseGraphDrawer.wristLeftSecondaryContent = nextContentRoot;

	updateSecondaryPanelMesh(nextPanel, nextContentRoot);

	// Quest 2: forza qualche update successivo perché font/texture MSDF
	// possono arrivare dopo il primo frame.
	setTimeout(() => {
		updateSecondaryPanelMesh(nextPanel, nextContentRoot);
	}, 50);

	setTimeout(() => {
		updateSecondaryPanelMesh(nextPanel, nextContentRoot);
	}, 200);
}

function showNodeOnSecondaryPanel(node) {
	clearPanelInteractivity(PANELS.SECONDARY);

	leftSecondaryPanelElements.length = 0;

	const { panel, contentRoot } = buildSecondaryPanelForNode(node);

	replaceSecondaryPanel(panel, contentRoot);
}

let xrEventHandlersInitialized = false;

function handleXRmode(b) {
	if (b && HeriverseGraphDrawer.wristLeftSecondaryPanel && HeriverseGraphDrawer.wristLeftPanel) {
		ATON.fire("XRcontrollerConnected", ATON.XR.HAND_R);
		ATON.fire("XRcontrollerConnected", ATON.XR.HAND_L);
	}
}

function handleXRcontrollerConnected(c) {
	if (
		c === ATON.XR.HAND_R &&
		ATON.SUI.infoNode &&
		ATON.SUI.infoNode.parent !== undefined &&
		ATON.SUI.infoNode.parent !== null
	)
		ATON.SUI.infoNode.delete();
	drawController(c);
}

function handleXRselectStart(c) {
	if (c == ATON.XR.HAND_R) {
		if (ATON._queryDataUI) return;
		if (ATON._queryDataScene) {
			if (!ATON.Nav._bLocValidator) ATON.Nav.toggleLocomotionValidator(true);
			if (ATON.Nav._bLocValidator) {
				ATON.Nav.locomotionValidator();
			}
			if (ATON.XR._bPresenting && ATON.XR._sessionType === "immersive-vr")
				ATON.XR.teleportOnQueriedPoint();
		}
	} else if (c === ATON.XR.HAND_L) {
	}
}

function handleXRsqueezeEnd(c) {
	if (c === ATON.XR.HAND_L) {
		if (Heriverse._bXRSemanticMode) {
			Heriverse._bXRSemanticMode = false;
			console.log("XR_SEMANTIC_MODE", Heriverse._bXRSemanticMode);
		}
	}
}

function handleXRsqueezeStart(c) {
	if (c == ATON.XR.HAND_R) {
		if (Heriverse._bXRPointerMode) return;
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

				showNodeOnSecondaryPanel(semNode);
				return;
			} else if (proxy) {
				if (
					HeriverseGraphDrawer.proxyActivated ||
					(ATON.XR.isPresenting() && !Heriverse._bXRSemanticMode)
				)
					return;
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
			drawDetailsOnWrist(c, node);
		} else {
			HeriverseGraphDrawer.drawGraph(node, null, null, null, null);
			drawDetailsOnWrist(ATON.XR.HAND_R, node);
			drawDetailsOnWrist(ATON.XR.HAND_L, node);
		}
	} else if (c === ATON.XR.HAND_L) {
		if (HeriverseGraphDrawer.proxyActivated) {
			HeriverseGraphDrawer.proxyActivated = false;
			Heriverse.HERUI.closeSidebar();
			HeriverseGraphDrawer.drawGraph(null, null, null, null, null);
			drawDetailsOnWrist(ATON.XR.HAND_R, null);
			drawDetailsOnWrist(ATON.XR.HAND_L, null);
			return;
		}
		if (!Heriverse._bXRSemanticMode) {
			Heriverse._bXRSemanticMode = true;
			console.log("XR_SEMANTIC_MODE", Heriverse._bXRSemanticMode);
		}
	}
}

let lastXRVerticalMoveTime = performance.now();

function gamepadRoutine() {
	if (ATON.XR.isPresenting()) {
		if (
			ATON.XR.getSecondaryController() &&
			ATON.XR.getSecondaryController().userData &&
			ATON.XR.getSecondaryController().userData.gm
		) {
			const gamepadL = ATON.XR.getSecondaryController().userData.gm;
			const gamepadR = ATON.XR.getPrimaryController().userData.gm;

			const now = performance.now();
			const dt = Math.min((now - lastXRVerticalMoveTime) / 1000, 0.05);
			lastXRVerticalMoveTime = now;

			const verticalSpeed = 1;

			let verticalDirection = 0;

			// if (gamepadL.buttons[0].pressed) {
			// 	console.log("Trigger LEFT 0 pressed");
			// }
			// if (gamepadR.buttons[0].pressed) {
			// 	console.log("Trigger RIGHT 0 pressed");
			// }
			// if (gamepadL.buttons[1].pressed) {
			// 	console.log("Trigger LEFT 1 pressed");
			// }
			// if (gamepadR.buttons[1].pressed) {
			// 	console.log("Trigger RIGHT 1 pressed");
			// }
			// if (gamepadL.buttons[2].pressed) {
			// 	console.log("Trigger LEFT 2 pressed");
			// }
			// if (gamepadR.buttons[2].pressed) {
			// 	console.log("Trigger RIGHT 2 pressed");
			// }
			// if (gamepadR.buttons[3].pressed) {
			// 	console.log("Trigger RIGHT 3 pressed");
			// }
			// if (gamepadL.buttons[3].pressed) {
			// 	console.log("Trigger LEFT 3 pressed");
			// }
			if (gamepadR.buttons[4].pressed) {
				console.log("Trigger RIGHT 4 pressed");
				verticalDirection -= 1;
				// ATON.XR.rig.position.y -= 0.05;
			}
			// if (gamepadL.buttons[4].pressed) {
			// 	console.log("Trigger LEFT 4 pressed");
			// }
			if (gamepadR.buttons[5].pressed) {
				console.log("Trigger RIGHT 5 pressed");
				verticalDirection += 1;
				// ATON.XR.rig.position.y += 0.05;
			}
			// if (gamepadL.buttons[5].pressed) {
			// 	console.log("Trigger LEFT 5 pressed");
			// }
			// if (gamepadR.buttons[6].pressed) {
			// 	console.log("Trigger RIGHT 6 pressed");
			// }
			// if (gamepadL.buttons[6].pressed) {
			// 	console.log("Trigger LEFT 6 pressed");
			// }
			if (verticalDirection !== 0) {
				ATON.XR.rig.position.y += verticalDirection * verticalSpeed * dt;
			}
		}
	}
}

export function setupEventHandlers() {
	if (xrEventHandlersInitialized) return;
	xrEventHandlersInitialized = true;

	ATON.on("XRmode", handleXRmode);

	ATON.on("XRcontrollerConnected", handleXRcontrollerConnected);

	ATON.on("XRselectStart", handleXRselectStart);

	ATON.on("XRsqueezeEnd", handleXRsqueezeEnd);

	ATON.on("XRsqueezeStart", handleXRsqueezeStart);

	ATON.addUpdateRoutine(gamepadRoutine);
}
