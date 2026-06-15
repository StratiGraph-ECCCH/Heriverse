import HeriverseEvents from "./HeriverseEvents.js";
import {
	getPeriodFilterElementsFromRoot,
	getPeriodFilterRootFromEvent,
	getPeriodFilterValuesFromRoot,
	isPeriodPanelRoot,
	updateSelectedPeriodDropdown,
} from "./periodFilterDOM.js";
import * as EnvironmentSettingsActions from "./environmentSettingsActions.js";
import * as PovActions from "./povActions.js";
import * as PovPanelState from "./povPanelState.js";
import * as GraphRelationsActions from "./graphRelationsActions.js";
import * as GraphSelectionActions from "./graphSelectionActions.js";
import * as SidebarViewModel from "./sidebarViewModel.js";
import * as SidebarNavigationState from "./sidebarNavigationState.js";
import * as TemporalActions from "./temporalActions.js";
import * as PeriodFilterViewModel from "./periodFilterViewModel.js";
import * as ModelViewerActions from "./modelViewerActions.js";
import * as AppModeViewModel from "./appModeViewModel.js";

/*
    Heriverse CNR WebApp
    UI component
    
    authors: 3DResearch s.r.l.

================================================================*/
let UI = {};
let transition_time = 1000;
UI.mode = null;

UI.clearTopToolbar = () => {
	$("#toolbar-left").empty();
	$("#toolbar-right").empty();
	$("#mobile-toolbar").empty();
	$("#mobile-menu-list").empty();
	$("#icon-button-menu").empty();
};

function getEditorToolbarPanels() {
	return [
		{
			id: "workspace",
			key: "WORKSPACE",
			title: "Workspace",
			icon: "fa-solid fa-hexagon-nodes",
			panel: "#workspace-panel",
			image: "workspace.png",
			tooltip: "Mostra pannello workspace",
		},
		{
			id: "shelf",
			key: "SHELF",
			title: "Shelf",
			icon: "fa-solid fa-toolbox",
			panel: "#shelf-panel",
			image: "shelf.png",
			tooltip: "Mostra pannello shelf",
		},
		{
			id: "tools",
			key: "TOOLS",
			title: "Tools",
			icon: "fa-solid fa-screwdriver-wrench",
			panel: "#right-panel",
			image: "tools.png",
			tooltip: "Mostra pannello tool",
		},
		{
			id: "transform",
			key: "TRANSFORM",
			title: "Transform",
			icon: "fa-solid fa-screwdriver-wrench",
			panel: "#tranPan-panel",
			image: "transform.png",
			tooltip: "Mostra pannello di trasformazione",
		},
		{
			id: "scene_control",
			key: "SCENE_CONTROLS",
			title: "Scene_Controls",
			icon: "fa-solid fa-screwdriver-wrench",
			panel: "#scene-control-panel",
			image: "scene_control.png",
			tooltip: "Mostra pannello di impostazione delle scene",
		},
	];
}

UI.buildTopToolbar = ({
	mode,
	modeTypes,
	isVRSupported = false,
	isLogged = false,
	userName = "",
	userSurname = "",
	handlers = {},
}) => {
	UI.clearTopToolbar();

	const addToolbarBtnAlt = (id, title, img, section, onClick, label, hasActiveIcon = false) => {
		UI.createButtonToolbar_Alt(id, title, img, section, onClick, label, "bottom", hasActiveIcon);
	};

	UI.hamburger("hamb");

	addToolbarBtnAlt(
		"periodSection",
		"Apri pannello filtro temporale",
		"period_epoch.png",
		"mobile-toolbar",
		handlers.onTogglePeriodPanel,
		"PERIOD_EPOCH",
		true
	);

	if (isVRSupported) {
		["toolbar-right", "mobile-toolbar"].forEach((section) => {
			addToolbarBtnAlt(
				"VR",
				"Attiva modalità VR",
				"vr.png",
				section,
				handlers.onToggleXR,
				"VR",
				true
			);
		});
	}

	if (mode == modeTypes.EDITOR) {
		// Workspace, Shelf, Tools (desktop+mobile)
		getEditorToolbarPanels().forEach(({ id, icon, image, panel, title, tooltip, key }) => {
			["toolbar-left", "mobile-toolbar"].forEach((section) => {
				addToolbarBtnAlt(
					title,
					tooltip,
					image,
					section,
					() => handlers.onTogglePanel?.({ panel, id }),
					key,
					true
				);
			});
		});
		// Disattiva editor (desktop+mobile)
		["toolbar-right", "mobile-toolbar"].forEach((section) => {
			addToolbarBtnAlt(
				"viewer-mode",
				"Disattiva modalità editor",
				"edit_out.png",
				section,
				handlers.onDisableEditor,
				"DISABLE_EDITOR"
			);
		});
	} else {
		// Mostra solo se utente loggato
		if (isLogged) {
			["toolbar-right", "mobile-toolbar"].forEach((section) => {
				addToolbarBtnAlt(
					"editor-mode",
					"Passa all'editor",
					"edit_in.png",
					section,
					handlers.onEnableEditor,
					"ENABLE_EDITOR"
				);
			});
		}
	}

	addToolbarBtnAlt(
		"home",
		"Torna alla home",
		"home_border.png",
		"toolbar-right",
		handlers.onGoHome,
		"HOME"
	);

	UI.buildUserToolbarSection({
		isLogged,
		userName,
		userSurname,
		handlers,
	});

	UI.buildMobileMenu({
		isLogged,
		userName,
		userSurname,
		handlers,
	});
};

function buildLoginLinkHTML({ mobile = false } = {}) {
	const className = mobile ? "btn" : "";
	const style = mobile
		? "font-size: 1.1rem; font-family: 'Lexend'; text-decoration: none; color: white;"
		: "text-decoration: none; color: white; font-family: 'Lexend'; font-size: 1.1rem;";

	return `
		<a href="${Utils.baseUrl}/login"
		onclick = "sessionStorage.setItem('returnUrl', window.location);" class="${className}" style="${style}"> Login </a>
	`;
}

function buildUserDropdownItemsHTML() {
	return `
		<li>
			<a href="${Utils.baseUrl}/dashboard" class="dropdown-item">Dashboard</a>
		</li>
		<li>
			<a href="#" onclick="AUTH.logoutDigilabAction()" class="dropdown-item">Logout</a>
		</li>
	`;
}

function buildFontSizeSelectorHTML({ mobile = false } = {}) {
	const containerClass = mobile ? "font-size-selector d-flex" : "font-size-selector d-flex gap-2";

	const containerStyle = mobile
		? "gap: 5px; justify-content: center; margin: 0 !important; padding: 0 !important;"
		: "";

	const labelStyle = mobile
		? "cursor:pointer; align-self: center; flex-direction: row; margin: 0; padding: 0;"
		: "cursor:pointer; align-self: center;";

	const options = [
		{ value: "small", id: "font-small", label: "A", size: "14px" },
		{ value: "medium", id: "font-medium", label: "A", size: "18px" },
		{ value: "large", id: "font-large", label: "A", size: "22px" },
	];

	return `
		<div
			id="fontSizeSelector"
			class="${containerClass}"
			style="${containerStyle}">
			${options
				.map(
					(option) => `<label style="${labelStyle}">
				<input type="radio" name="fontSize" value="${option.value}" id="${option.id}" />
							<span class="no-resize" style="font-size: ${option.size};">${option.label}</span>
				</label>
			`
				)
				.join("")} </div>
	`;
}

UI.buildUserToolbarSection = ({
	isLogged = false,
	userName = "",
	userSurname = "",
	handlers = {},
} = {}) => {
	let userElement = `<div id="userSection" class="d-flex align-items-center">`;

	userElement += `
			<div class="dropdown">
				<button class="btn dropdown-toggle" style="border-radius: .25rem; margin: 0.5rem; background:none; margin-right: 0px; padding-right: 0px;" type="button" id="languageSelector" data-bs-toggle="dropdown" aria-expanded="false">
					<img width="42px" src="${Utils.baseUrl}/assets/icons/header/Eng.svg" alt="Lingua selezionata" />
				</button>
				<ul class="dropdown-menu" aria-labelledby="languageSelector">
					<li>
						<a class="dropdown-item" href="#" data-lang="it">
							<img width="42px" src="${Utils.baseUrl}/assets/icons/header/Ita.svg" alt="Italiano" /> Italiano
						</a>
					</li>
					<li>
						<a class="dropdown-item" href="#" data-lang="en">
							<img width="42px" src="${Utils.baseUrl}/assets/icons/header/Eng.svg" alt="English"/> English
						</a>
					</li>
				</ul>
			</div>
		`;

	userElement += `
			<div class="dropdown ms-2 d-none d-lg-block">
				<button class="btn btn-accessibility dropdown-toggle d-flex align-items-center" type="button" id="accessibilityMenu" data-bs-toggle="dropdown" aria-expanded="false">
					<img src="${Utils.baseUrl}/assets/icons/header/Accessibility.svg" alt="Accessibilità" width="42" />
				</button>
				<ul class="dropdown-menu p-3" aria-labelledby="accessibilityMenu" style="min-width: 200px;">
					<li>
						<div class="fw-bold mb-2" style="text-align: center;" data-i18n="TEXT_SIZE">Text size</div>
						${buildFontSizeSelectorHTML()}
					</li>
				</ul>
			</div>
		`;

	if (!isLogged) {
		userElement += buildLoginLinkHTML();
	} else {
		userElement += `
				<div class="dropdown">
					<button class="btn dropdown-toggle" style="background: none; color: white; font-family:'Lexend'; font-size: 1.1rem;" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
						${userName} ${userSurname}
					</button>
					<ul class="dropdown-menu" aria-labelledby="userDropdown">
						${buildUserDropdownItemsHTML()}
					</ul>
				</div>
			`;
	}

	userElement += `</div>`;

	$("#toolbar-right").append(userElement);
};

UI.buildMobileMenu = ({
	isLogged = false,
	userName = "",
	userSurname = "",
	handlers = {},
} = {}) => {
	let homeItem = `
			<li class="mobile-menu-item">
				<a href="${Utils.baseUrl}/" style="font-size: 1.1rem; font-family: 'Lexend'; text-decoration: none;">Home</a>
			</li>
		`;

	let userDropdownMobile;

	if (!isLogged) {
		userDropdownMobile = `
				<li class="mobile-menu-item">
					${buildLoginLinkHTML({ mobile: true })}
				</li>
			`;
	} else {
		userDropdownMobile = `
				<li class="mobile-menu-item dropdown">
					<button class="btn dropdown-toggle" type="button" id="userDropdownMobile" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 1.1rem; font-family: 'Lexend'; color: white;">
						${userName} ${userSurname}
					</button>
					<ul class="dropdown-menu" aria-labelledby="userDropdownMobile">
						${buildUserDropdownItemsHTML()}
					</ul>
				</li>
			`;
	}

	let accessibilityDropdownMobile = `
		<li class="mobile-menu-item dropdown">
			<button data-i18n="ACCESSIBILITY" class="btn btn-accessibility dropdown-toggle" type="button" id="accessibilityMenu" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 1.1rem; font-family: 'Lexend'; color: white;">
				Accessibilità
			</button>
			<ul class="dropdown-menu" style="padding: 10px !important;" aria-labelledby="accessibilityMenu">
				<li>
					<div class="fw-bold" style="height: 50px;text-align: center; margin-bottom: 5px !important; margin-top: 0 !important;" data-i18n="TEXT_SIZE">Text size</div>
					${buildFontSizeSelectorHTML({ mobile: true })}
				</li>
			</ul>
		</li>
	`;

	let mobileMenuHtml = homeItem + userDropdownMobile + accessibilityDropdownMobile;
	$("#mobile-menu-list").html(mobileMenuHtml);
};

UI.setupSearchUI = ({ handlers = {} }) => {
	let searchInput = document.getElementById("idSearch");
	let matchesButton = document.getElementById("idSearchMatches");

	if (!searchInput) return;

	$(searchInput)
		.off("keyup.heriverseSearch")
		.on("keyup.heriverseSearch", () => {
			handlers.onSearch?.(searchInput.value);
		});

	$(searchInput)
		.off("focus.heriverseSearch")
		.on("focus.heriverseSearch", () => {
			handlers.onFocus?.();
		});

	$(searchInput)
		.off("blur.heriverseSearch")
		.on("blur.heriverseSearch", () => {
			handlers.onBlur?.();
		});

	if (matchesButton) $(matchesButton).hide();
};

UI.getPeriodFilterRootFromEvent = getPeriodFilterRootFromEvent;

UI.getPeriodFilterValuesFromRoot = getPeriodFilterValuesFromRoot;

UI.getPeriodFilterElementsFromRoot = getPeriodFilterElementsFromRoot;

UI.isPeriodPanelRoot = isPeriodPanelRoot;

UI.uv = {
	mVSettingsPanelContainer: "mVSettingsPanelContainer",
	mVSettingsPanel: "mVSettingsPanel",
	mVBgrndColorSettingContainer: "mVBgrndColorSettingContainer",
	mVBgrndColorSetting: "mVBgrndColorSetting",
	mVAutoRotateChkContainer: "mVAutoRotateChkContainer",
	mVAutoRotateChk: "mVAutoRotateChk",
	mVCameraControlsChkContainer: "mVCameraControlsChkContainer",
	mVCameraControlsChk: "mVCameraControlsChk",
};

UI.updateNoModelsInScene = () => {
	const banners = [
		document.getElementById("noModelsInScene")?.closest("section"),
		document.getElementById("noModelsInScene-mobile")?.closest("section"),
	].filter(Boolean);

	if (!banners.length) return;

	const hasModelsInScene = ATON._rootVisible.children.some((nodesGroup) => {
		return nodesGroup.children.length > 0;
	});

	banners.forEach((banner) => {
		banner.classList.toggle("hidden", hasModelsInScene);
	});
};

function getNodeIconHTML(node, extraClasses = "accordion-icon-type me-2", width = "50px") {
	return `
		<img
			class="${extraClasses}"
			width="${width}"
			onerror="this.style.display='none';"
			src="${SidebarViewModel.getNodeIconUrl(node)}">
	`;
}

function buildLinkedResourceHTML(node) {
	return SidebarViewModel.getLinkedResources(node)
		.map((linkedResource) => UI.getLinkDiv(linkedResource))
		.join("");
}

function buildRelationAccordionItem(node, count) {
	const eventName = SidebarViewModel.getSidebarNodeEvent(node);

	let html = "";

	html += "<div class='accordion-item custom-btn'>";
	html += `<h2 class='accordion-header' id='accordion-header-${count}'>`;
	html +=
		"<button class='accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target='#cc" +
		count +
		"' aria-expanded='true' aria-controls='collapseOne'>" +
		getNodeIconHTML(node) +
		node.name +
		"</button>";
	html += "</h2>";

	html +=
		"<div id='cc" +
		count +
		`' class='accordion-collapse collapse' aria-labelledby='accordion-header-${count}' data-bs-parent='#accordion-header-${count}'>`;

	html +=
		"<div class='accordion-body' onclick='ATON.fireEvent(`" +
		eventName +
		"`," +
		"`" +
		node.id +
		"`)'>";

	html += `<div style='float:rigth;'>${getNodeIconHTML(node)} ${node.type}</div></div>`;

	if (node.description) html += "<b>Description: </b>" + node.description + "<br><br>";
	if (node.period) html += "<b>Chronology: </b>" + node.period + "<br>";
	if (node.data && node.data.url) {
		html += UI.getLinkDiv(node);
	}

	html += "</div></div>";

	return html;
}

UI.getSourceGraphHTML = (emn) => {
	if (!emn) return "";

	var html = "<div class='accordion' id='accordionLine'>";

	html += buildLinkedResourceHTML(emn);

	var count = 1;

	SidebarViewModel.getRelationGroups(emn).forEach((group) => {
		html += group.label;

		group.nodes.forEach((relationNode) => {
			html += buildRelationAccordionItem(relationNode, count);
			count++;
		});

		count++;
	});

	html += "</div>";

	return html;
};

function escapeHTMLAttribute(value = "") {
	return String(value).replace(/"/g, "&quot;");
}

function createModelViewerId(node) {
	return `mv_${node.id || Math.random().toString(36).slice(2)}`;
}

function buildImageResourceHTML(node) {
	const resourceUrl = SidebarViewModel.getResolvedResourceUrl(node);

	return `
		<div
			data-auto="false"
			class="fotorama"
			data-width="100%"
			data-ratio="16/9"
			data-maxwidth="100%"
			data-allowfullscreen="true">
			<img
				data-caption="${escapeHTMLAttribute(node.description || "")}"
				onerror="UI.hide();"
				id="${node.id}_img"
				alt="${escapeHTMLAttribute(node.data?.description || node.description || "")}"
				class="emviqSGDocImg"
				src="${resourceUrl}">
		</div>
	`;
}

function buildModelViewerResourceHTML(node) {
	const idViewer = createModelViewerId(node);
	const modelUrl = escapeHTMLAttribute(SidebarViewModel.getResolvedResourceUrl(node));

	return `
		<div class="mVContainer mb-2 fs-6" style="position: relative">
			<model-viewer
			id="${idViewer}"
			src="${modelUrl}"
			alt="Anteprima modello"
			camera-controls
			auto-rotate
			interaction-prompt="none"
			shadow-intensity="1"
			exposure="1"
			style="
				width: 100%;
				aspect-ratio: 16 / 9;
				display: block;
				background: #ffffff;
				border: 1px solid #dee2e6;
				border-radius: 8px;
				overflow: hidden;
			">
			</model-viewer>

			<div class="btn-group" role="group" aria-label="Model viewer controls" style="
				position: absolute;
				height: 20%;
				gap: 5%; 
				top: 4%;
				right: 3%;"> 

			<button type="button" class="btn btn-sm btn-light" onclick="openModelFullscreen('${idViewer}')" style="
				width: 10%;
				aspect-ratio: 1;
				z-index: 10;
				padding: 2px 6px;
				line-height: 1;
			"> <img src='/a/heriverse/assets/icons/fullscreen.svg' style='width: 100%; aspect-ratio: 1;' /> </button>

			<button type="button" class="btn btn-sm btn-light" onclick="modelViewerSettings(this)" style="
				width: 10%;
				aspect-ratio: 1;
				z-index: 10;
				padding: 2px 6px;
				line-height: 1;
			"> <img src='/a/heriverse/assets/icons/gear.svg' style='width: 100%; aspect-ratio: 1;' /> </button>

			</div>

			</div>
		`;
}

function buildPlainResourceLinkHTML(node) {
	const resourceUrl = SidebarViewModel.getResolvedResourceUrl(node);

	return `<div class="mb-2 fs-6"><span>${resourceUrl}</span></div>`;
}

UI.getLinkDiv = (E) => {
	const url = SidebarViewModel.getResourceNodeUrl(E);

	if (!url) return "";

	if (SidebarViewModel.isImageResource(url)) {
		return buildImageResourceHTML(E);
	}

	if (SidebarViewModel.isModelResource(url)) {
		return buildModelViewerResourceHTML(E);
	}

	return buildPlainResourceLinkHTML(E);
};

window.openModelFullscreen = ModelViewerActions.toggleFullscreenById;

window.modelViewerSettings = (elem) => {
	const mVElem = ModelViewerActions.getModelViewerFromControlsElement(elem);
	if (!mVElem) return;

	const settingsPanel = modelViewerSettingsModal(mVElem);

	document.body.appendChild(settingsPanel);

	const bsModal = bootstrap.Modal.getOrCreateInstance(settingsPanel);
	bsModal.show();
};

function modelViewerSettingsModal(modelViewerElem = null) {
	function createCheckboxSetting({ containerClass, inputClass, labelText, checked, onChange }) {
		const container = document.createElement("div");
		container.className = containerClass;

		const label = document.createElement("label");
		label.className = inputClass + "Label" + " form-check-label";
		label.textContent = labelText;

		const input = document.createElement("input");
		input.type = "checkbox";
		input.className = inputClass + " form-check-input";
		input.checked = checked;

		$(input).on("input change", (e) => {
			onChange(e.target.checked);
		});

		container.appendChild(label);
		container.appendChild(input);

		return container;
	}

	function backgroundColorSetting(startingColor) {
		const bckGroundColorSetContainer = document.createElement("div");
		bckGroundColorSetContainer.className = UI.uv.mVBgrndColorSettingContainer;

		const bckGroundColorSetLabel = document.createElement("label");
		bckGroundColorSetLabel.className = UI.uv.mVBgrndColorSetting + "Label" + " form-label ms-2";
		bckGroundColorSetLabel.textContent = "Background";

		const bckGroundColorSet = document.createElement("input");
		bckGroundColorSet.type = "color";
		bckGroundColorSet.className = UI.uv.mVBgrndColorSetting + " form-input";
		bckGroundColorSet.value = startingColor;
		$(bckGroundColorSet).on("input change", (e) => {
			const newCol = e.target.value;
			ModelViewerActions.setBackgroundColor(modelViewerElem, newCol);
		});

		bckGroundColorSetContainer.appendChild(bckGroundColorSetLabel);
		bckGroundColorSetContainer.appendChild(bckGroundColorSet);

		return bckGroundColorSetContainer;
	}

	function autoRotateCheck(checkedStatus) {
		return createCheckboxSetting({
			containerClass: UI.uv.mVAutoRotateChkContainer,
			inputClass: UI.uv.mVAutoRotateChk,
			labelText: "Auto-rotate",
			checked: checkedStatus,
			onChange: (checked) => {
				ModelViewerActions.setAutoRotate(modelViewerElem, checked);
			},
		});
	}

	function cameraControlCheck(checkedStatus) {
		return createCheckboxSetting({
			containerClass: UI.uv.mVCameraControlsChkContainer,
			inputClass: UI.uv.mVCameraControlsChk,
			labelText: "Camera-controls",
			checked: checkedStatus,
			onChange: (checked) => {
				ModelViewerActions.setCameraControls(modelViewerElem, checked);
			},
		});
	}

	// --------- PANEL
	const settingsPanel = document.createElement("div");
	settingsPanel.className = UI.uv.mVSettingsPanel + " modal";

	// --------- MODAL DUE COMPONENTS
	const modalDialog = document.createElement("div");
	modalDialog.className = "modal-dialog";
	const modalContent = document.createElement("div");
	modalContent.className = "modal-content";

	modalDialog.appendChild(modalContent);

	// --------- PANEL HEADER
	const settingsPanelHeader = document.createElement("div");
	settingsPanelHeader.className = "mVSettingsPanelHeader modal-header bg-dark";
	const settingsPanelTitle = document.createElement("h5");
	settingsPanelTitle.className = "modal-title flex-grow-1";
	settingsPanelTitle.textContent = "Impostazioni per il Visualizzatore dei modelli";
	const settingsPanelCloseBtn = document.createElement("button");
	settingsPanelCloseBtn.className = "btn-close";
	settingsPanelCloseBtn.dataset.bsDismiss = "modal";

	settingsPanelHeader.appendChild(settingsPanelTitle);
	settingsPanelHeader.appendChild(settingsPanelCloseBtn);

	// --------- PANEL BODY
	const settingsPanelBody = document.createElement("div");
	settingsPanelBody.className = "mVSettingsPanelBody container modal-body bg-dark";

	const firstRow = document.createElement("div");
	firstRow.className = "row row-cols-1 row-cols-md-3 row-cols-lg-5 justify-content-center";

	const bckGroundColorSet = backgroundColorSetting(
		ModelViewerActions.getBackgroundColor(modelViewerElem)
	);

	const autoRotateChk = autoRotateCheck(ModelViewerActions.isAutoRotateEnabled(modelViewerElem));
	const cameraControlsChk = cameraControlCheck(
		ModelViewerActions.areCameraControlsEnabled(modelViewerElem)
	);

	firstRow.appendChild(bckGroundColorSet);
	firstRow.appendChild(autoRotateChk);
	firstRow.appendChild(cameraControlsChk);

	settingsPanelBody.appendChild(firstRow);

	// --------- PANEL COMPOSITION
	modalContent.appendChild(settingsPanelHeader);
	modalContent.appendChild(settingsPanelBody);

	settingsPanel.appendChild(modalDialog);

	return settingsPanel;
}

function getSidebarElements() {
	return {
		sidebar: document.getElementById("sidebar"),
		sidebarBottom: document.getElementById("sidebar-bottom"),
		rightSidebar: document.getElementById("right-sidebar"),
		rightSidebarSeparator: document.querySelector("#right-sidebar vr"),
		bottomToolbar: document.getElementById("idBottomToolbar"),
		rightToolbar: document.getElementById("toolbar-right"),
	};
}

function isSidebarActive() {
	const { sidebar, sidebarBottom } = getSidebarElements();

	return sidebar?.classList.contains("active") || sidebarBottom?.classList.contains("active");
}

function clearSidebarPanels() {
	const { sidebar, sidebarBottom } = getSidebarElements();

	sidebar?.classList.remove("active");
	sidebarBottom?.classList.remove("active");

	if (sidebar) sidebar.innerHTML = "";
	if (sidebarBottom) sidebarBottom.innerHTML = "";
}

function showMainToolbars() {
	const { bottomToolbar, rightToolbar } = getSidebarElements();

	if (bottomToolbar) bottomToolbar.style.display = "block";
	if (rightToolbar) rightToolbar.style.display = "block";
}

function showRightSidebarContainer({ showSeparator = true } = {}) {
	const { rightSidebar, rightSidebarSeparator } = getSidebarElements();

	$(".right-sidebar-class").removeClass("d-none").addClass("d-block");

	if (rightSidebar) {
		$(rightSidebar).removeClass("d-none").addClass("d-flex");
	}

	if (showSeparator && rightSidebarSeparator) {
		$(rightSidebarSeparator).removeClass("d-none").addClass("d-block");
	}
}

function hideRightSidebarContainer({ hideSeparator = true } = {}) {
	const { rightSidebar, rightSidebarSeparator } = getSidebarElements();

	if (rightSidebar) {
		$(rightSidebar).removeClass("d-flex").addClass("d-none");
	}

	if (hideSeparator && rightSidebarSeparator) {
		$(rightSidebarSeparator).removeClass("d-block").addClass("d-none");
	}
}

function closeSidebarPanels({ fireCloseEvent = false } = {}) {
	if (!isSidebarActive()) {
		if (fireCloseEvent) {
			ATON.fireEvent("CloseSidebar");
		}

		return;
	}

	clearSidebarPanels();
	showMainToolbars();
	hideRightSidebarContainer({ hideSeparator: true });

	if (fireCloseEvent) {
		ATON.fireEvent("CloseSidebar");
	}
}

UI.createSidebar = (proxy) => {
	if (isSidebarActive()) {
		closeSidebarPanels();
	}

	if (!proxy) return;

	SidebarNavigationState.reset(proxy);

	showRightSidebarContainer({ showSeparator: true });

	const { sidebar, sidebarBottom } = getSidebarElements();

	sidebar?.classList.toggle("active");
	sidebarBottom?.classList.toggle("active");

	UI.populateSideBar(proxy);
	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
};

UI.closeSidebar = () => {
	closeSidebarPanels({ fireCloseEvent: true });
};

UI.suspendSidebar = () => {
	showMainToolbars();

	hideRightSidebarContainer({ hideSeparator: false });
};

UI.clickSideBar = (index) => {
	if (index >= 0) {
		if (index + 1 == SidebarNavigationState.getStackLength()) return;

		let EMnode = SidebarNavigationState.getNodeAt(index);

		if (!EMnode) return;

		SidebarNavigationState.trimTo(index);

		UI.populateSideBar(EMnode);
		ATON.fire(HeriverseEvents.Events.SHOW_SEMANTIC_NODE, EMnode.id);
	} else {
		const rootNode = SidebarNavigationState.getRootNode();

		SidebarNavigationState.clear();

		if (rootNode) {
			UI.createSidebar(rootNode);
		}
	}

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
};

function clearSidebarContent() {
	document.getElementById("sidebar").innerHTML = "";
	document.getElementById("sidebar-bottom").innerHTML = "";
}

function buildSidebarBreadcrumb() {
	const navigationStack = SidebarNavigationState.getStack();

	if (navigationStack.length <= 1) return null;

	let nav = document.createElement("ul");
	nav.classList.add("breadcrumb");

	navigationStack.forEach((node, index) => {
		const item = document.createElement("li");

		item.innerHTML =
			"<a class='sideitem' style='cursor:pointer' onclick='UI.clickSideBar(" +
			index +
			")'>" +
			node.name +
			"</a>";

		nav.appendChild(item);
	});

	return nav;
}

function buildSidebarHeaderHTML(node) {
	const iconUrl = SidebarViewModel.getNodeIconUrl(node);

	const semanticShapeButton =
		ATON.semnodes && ATON.semnodes[node.name] !== undefined && ATON.semnodes[node.name] !== null
			? "<button data-i18n='SHOW_SEM_SHAPE_BTN' class='btn btn-link' onclick='ATON.semnodes[\"" +
				node.name +
				"\"].highlight();' style='color: lightblue;'></button>"
			: "";

	return (
		"<h4 style='justify-self: center; display: flex; flex-direction: column; align-items: center'>" +
		"<div>" +
		node.name +
		" " +
		"<img onerror=\"this.style.display='none';\" style='width:2rem;height:auto; ' src='" +
		iconUrl +
		"'></img></div>" +
		semanticShapeButton +
		"</h4>"
	);
}

function buildSidebarDescriptionHTML(node) {
	return node.description ? "<h3>" + node.description + "</h3></br>" : "";
}

function buildSidebarMetadataHTML(node, authorsLabel) {
	return (
		`<hr>` +
		`<span> authors: ${authorsLabel}  </span></br>` +
		`<span> embargo: ${node.embargo_until || ""}  </span></br>` +
		`<span> license: ${node.license || ""}  </span>`
	);
}

function buildSidebarGraphHTML(node) {
	const htmlGraph = UI.getSourceGraphHTML(node);

	if (htmlGraph.length <= 1) return "";

	return "<div class='emviqSG'>" + htmlGraph + "</div>";
}

function appendSidebarMainImageIfValid(container, node) {
	const imageUrl = SidebarViewModel.getNodeMainImageUrl(node);

	if (!imageUrl) return;

	loadImage(imageUrl)
		.then((isValid) => {
			if (!isValid) return;

			container.innerHTML +=
				"<div data-auto='false' id ='id' class='fotorama' data-width='100%' data-ratio='16/9' data-maxwidth='100%' data-allowfullscreen='true'><img data-caption='" +
				node.description +
				"' onerror=\"this.setAttribute('style', 'display: none !important;')\" id='" +
				node.url +
				"' alt='" +
				node.url +
				"' class='emviqSGDocImg' src='" +
				imageUrl +
				"'></div>";

			$(".fotorama").fotorama();
		})
		.catch(() => {});
}

UI.navigateToSidebarNodeIfPresent = (node) => {
	const navigationStack = SidebarNavigationState.getStack();
	const index = navigationStack.indexOf(node);

	if (index < 0) return false;

	UI.clickSideBar(index);

	return true;
};

UI.populateSideBar = (EMnode) => {
	clearSidebarContent();

	var block1 = document.createElement("div");
	var block2 = document.createElement("div");

	SidebarNavigationState.addNode(EMnode);

	const authorsLabel = SidebarViewModel.getSidebarAuthorsLabel(EMnode);

	const breadcrumb = buildSidebarBreadcrumb();

	if (breadcrumb) {
		block1.appendChild(breadcrumb);
	}

	block1.innerHTML += buildSidebarHeaderHTML(EMnode);
	block1.innerHTML += buildSidebarDescriptionHTML(EMnode);

	appendSidebarMainImageIfValid(block1, EMnode);

	document.getElementById("sidebar").appendChild(block1);

	block2.innerHTML = buildSidebarGraphHTML(EMnode);
	document.getElementById("sidebar-bottom").appendChild(block2);

	document.getElementById("sidebar-bottom").innerHTML += buildSidebarMetadataHTML(
		EMnode,
		authorsLabel
	);

	$(".fotorama").fotorama();
};

UI.hide = () => {
	var errorElements = document.querySelectorAll(".fotorama__error");
	errorElements.forEach(function (errorElement) {
		var ancestor = errorElement.closest(".fotorama");
		if (ancestor) {
			ancestor.style.display = "none";
		}
	});
};

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			let timer = setTimeout(() => {
				resolve(true);
			}, 500);
			return image;
		};
		image.onerror = () => {
			return;
		};
		image.src = url;
	});
}

UI.createTitle = (title) => {
	var htmlcontent = '<h1 class="scene-title" style="text-align:center">' + title + "</h1>";
	$("#title").append(htmlcontent);
	$("#mobile-title").append(htmlcontent);
};

UI.createButtonToolbar_Alt = (
	icon,
	altText,
	iFileName,
	div,
	onPress,
	tooltip_label,
	tooltip_position,
	hasActiveIcon = false
) => {
	const tooltipAttr =
		tooltip_label && tooltip_position
			? ` data-bs-toggle="tooltip"
            data-bs-placement="${tooltip_position}"
            data-i18n-tooltip="${tooltip_label}"
            aria-label="${tooltip_label}"
            title="${tooltip_label}"`
			: "";

	let imgHtml = "";
	if (hasActiveIcon) {
		imgHtml = `
          <span class="icon-stack">
            <img class="icon-base" src="${
							Utils.baseUrl
						}/assets/icons/${iFileName}" alt="${altText}">
            <img class="icon-active" src="${Utils.baseUrl}/assets/icons/${iFileName.replace(
							".png",
							"-active.png"
						)}" alt="${altText} (attivo)">
          </span>
        `;
	} else {
		imgHtml = `<img src="${Utils.baseUrl}/assets/icons/${iFileName}" alt="${altText}">`;
	}

	const html = `
        <button id="${icon}" class="tbIconButton icon-button"${tooltipAttr} data-btn-name="${icon}">
            ${imgHtml}
        </button>
    `;

	if (onPress) {
		$(document)
			.off("click", "#" + icon)
			.on("click", "#" + icon, function () {
				$(this).toggleClass("active");
				if (onPress) onPress();
			});
	}

	$("#" + div).append(html);
};

UI.hamburger = (icon) => {
	let url = `${Utils.baseUrl}/res/imgs/${icon}.png`;
	let htmlcontent = `<div id="${icon}" class="icon-menu hamb"><img width="42" src="${url}"></div>`;

	// Aggiungi solo se non già presente
	if ($(`#${icon}`).length === 0) {
		$("#icon-button-menu").append(htmlcontent);
	}

	$(document).off("click", ".hamb");
	$(document).on("click", ".hamb", function () {
		$("#mobile-menu").addClass("open").removeClass("close");
	});

	$(document).off("click", "#close-mobile-menu");
	$(document).on("click", "#close-mobile-menu", function () {
		$("#mobile-menu").addClass("close").removeClass("open");
	});
};

UI.setupFontSizeAccessibility = () => {
	const FONT_SIZE_SCALE = { small: 0.85, medium: 1, large: 1.15 };
	const TEXT_TAGS = "div,p, h1, h2, h3, h4, h5, h6, span, li, a, label, button";
	const STORAGE_KEY = "fontSizeChoice";

	function getScale() {
		let val = localStorage.getItem(STORAGE_KEY);
		if (!val || !FONT_SIZE_SCALE[val]) val = "medium";
		return FONT_SIZE_SCALE[val];
	}

	function resetFont() {
		$(TEXT_TAGS).each(function () {
			const $el = $(this);
			if ($el.hasClass("no-resize")) return;
			if ($el.clone().children().remove().end().text().trim() === "") return;
			this.style.fontSize = "";
			$el.removeData("orig-size");
		});
	}
	function snapshotFont() {
		$(TEXT_TAGS).each(function () {
			const $el = $(this);
			if ($el.hasClass("no-resize")) return;
			if ($el.clone().children().remove().end().text().trim() === "") return;
			if (!$el.data("orig-size")) $el.data("orig-size", window.getComputedStyle(this).fontSize);
		});
	}
	function setFont(scale) {
		$(TEXT_TAGS).each(function () {
			const $el = $(this);
			if ($el.hasClass("no-resize")) return;
			if ($el.clone().children().remove().end().text().trim() === "") return;
			const origStr = $el.data("orig-size");
			if (!origStr) return;
			const orig = parseFloat(origStr);
			const unit = origStr.replace(/[0-9.]/g, "").trim() || "px";
			this.style.fontSize = orig * scale + unit;
		});
	}

	function applyFontSize(reason) {
		resetFont();
		snapshotFont();
		setFont(getScale());
	}

	applyFontSize("init");

	let resizeTimer = null;
	$(window).on("resize", function () {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function () {
			applyFontSize("resize");
		}, 100);
	});

	const observer = new MutationObserver(function () {
		applyFontSize("observer");
	});
	observer.observe(document.body, { childList: true, subtree: true });

	$(document).on("change", '#fontSizeSelector input[name="fontSize"]', function () {
		let val = $(this).val();
		localStorage.setItem(STORAGE_KEY, val);
		applyFontSize("cambio radio");
	});

	$(document).on("shown.bs.dropdown", "#accessibilityMenu", function () {
		let val = localStorage.getItem(STORAGE_KEY);
		if (!val || !["small", "medium", "large"].includes(val)) val = "medium";
		const $radios = $('#fontSizeSelector input[name="fontSize"]');
		$radios.prop("checked", false);
		$radios.filter('[value="' + val + '"]').prop("checked", true);
	});
};

UI.buildTimelineSelector = (
	epochs,
	conteinerSelector = "#idTL",
	mobile = false,
	selectedPeriodId = null
) => {
	let htmlcontent = "";
	if (epochs.length) {
		const selectedEpoch =
			epochs.find((epoch) => String(epoch.id) === String(selectedPeriodId)) || epochs[0];

		htmlcontent =
			"<div class='dropup-center dropup'><button style='--selected-bg: rgba(" +
			selectedEpoch.color.r * 255 +
			", " +
			selectedEpoch.color.g * 255 +
			", " +
			selectedEpoch.color.b * 255 +
			", 0.5); background-color: " +
			(mobile ? "rgba(100, 100, 100, 0.5)" : "rgba(255, 255, 255, 0.5)") +
			";" +
			(AppModeViewModel.isEditorMode() ? "border-radius: 12px 0 0 12px;" : "border-radius: 12px;") +
			"' class='btn selector-epochs dropdown-toggle' type='button' id='dropdownMenu2' data-bs-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>" +
			selectedEpoch.name +
			"</button>";
		let ul = "<ul class='dropdown-menu'>";
		let li = "";
		for (let i = 0; i < epochs.length; i++) {
			let tp = epochs[i];
			li +=
				"<li onclick='UI.selectTimelinePeriod(this.id," +
				mobile +
				");' id='tp" +
				tp.id +
				"'><p class='dropdown-item' style='--p-item-bg:" +
				"rgba(" +
				tp.color.r * 255 +
				", " +
				tp.color.g * 255 +
				", " +
				tp.color.b * 255 +
				", 0.5)" +
				"'>" +
				tp.name +
				" </p> </li>";
		}

		ul += li + "</ul>";

		htmlcontent += ul;
	}
	if (AppModeViewModel.isEditorMode()) {
		htmlcontent +=
			'<button type="button" class="btn btn-primary btn-new-epoch" data-bs-toggle="modal" data-bs-target="#createEditNode">' +
			"+" +
			"</button>";
	}
	if (epochs.length) htmlcontent += "</div></div>";

	$(conteinerSelector).html(htmlcontent);

	$(document)
		.off("click", ".selector-epochs ~ .btn-new-epoch", TemporalActions.openCreateEpochModal)
		.on("click", ".selector-epochs ~ .btn-new-epoch", TemporalActions.openCreateEpochModal);
};

UI.clickOnSelectPeriod = (id, mobile = false) => {
	$("#idLoader").show();

	let period_id = id.substring(2);

	updateSelectedPeriodDropdown(period_id, mobile);

	TemporalActions.goToPeriodById(period_id);
};

UI.clickToolbarBtn = (id) => {
	if ($("#" + id).hasClass("clicked-toolbar-btn")) {
		$("#" + id).removeClass("clicked-toolbar-btn");
	} else $("#" + id).addClass("clicked-toolbar-btn");
};

UI.disablePinchToZoom = () => {
	var userAgent = navigator.userAgent.toLowerCase();
	var isIOS = /iphone|ipad|ipod/.test(userAgent);
	if (isIOS) {
		document.addEventListener(
			"touchmove",
			function (event) {
				if (event.scale !== 1) {
					event.preventDefault();
				}
			},
			{ passive: false }
		);
	}
};

const settContainersClasses = {
	envSettingsBtnClass: "envSettingsBtn",
	viewPointMangerBtnClass: "viewPointMangerBtn",
	zoomToGraphSectionClass: "zoomToGraphSection",
	sceneSettingSectionClass: "sceneSettingSection",
	genSettingsContainerClass: "genSettingsContainer",
};

const envSetClasses = {
	lightIntensityInputClass: "lightIntensity",
	allProxyVisibleInputClass: "allProxyVisible",
	showAllProxiesInputClass: "showAllProxies",
	occlusionInputClass: "occlusionOption",
	activateDirectionalLightInputClass: "activateDirLight",
	shadowOptionInputClass: "shadowOption",
	autoLPInputClass: "autoLightProbe",
	ambientOcclusionInputClass: "ambientOcclusion",
	ambientOcclusionIntInputClass: "ambientOcclusionInten",
};

function createSettingsCheckbox({
	containerClass = "",
	labelClass,
	labelI18n,
	labelFor,
	labelText = "SAMPLE_TEXT",
	inputClass,
	inputId = "",
	inputName = "",
	checked = false,
	onChange = () => {},
}) {
	const container = document.createElement("div");

	if (containerClass) {
		container.className = containerClass;
	}

	const label = document.createElement("label");
	label.className = labelClass;
	label.dataset.i18n = labelI18n;
	label.setAttribute("for", labelFor);
	label.textContent = labelText;

	const input = document.createElement("input");
	input.type = "checkbox";
	input.className = inputClass + " form-check-input";
	input.checked = checked;

	if (inputId) input.id = inputId;
	if (inputName) input.name = inputName;

	$(input).on("change", (e) => {
		onChange(e.target.checked);
	});

	container.appendChild(input);
	container.appendChild(label);

	return container;
}

function createSettingsRange({
	containerClass = "d-flex flex-column",
	labelClass,
	labelI18n,
	labelFor,
	labelText = "SAMPLE_TEXT",
	inputId,
	inputClass,
	value = 0,
	min = 0,
	max = 1,
	step = 0.1,
	onChange = () => {},
}) {
	const container = document.createElement("div");
	container.className = containerClass;

	const label = document.createElement("label");
	label.className = labelClass;
	label.dataset.i18n = labelI18n;
	label.setAttribute("for", labelFor);
	label.textContent = labelText;

	const input = document.createElement("input");
	input.id = inputId;
	input.className = inputClass + " form-range";
	input.type = "range";
	input.value = value;
	input.min = min;
	input.max = max;
	input.step = step;

	$(input).on("input change", (e) => {
		onChange(parseFloat(e.target.value), e);
	});

	container.appendChild(label);
	container.appendChild(input);

	return container;
}

/*
	**************************************
	 	ENVIRONMENT SETTINGS PANEL
	**************************************
*/
function envSettingsPanel() {
	const container = document.createElement("div");
	container.classList.add("container", "envSettingsPanel");

	// ======================================
	// 				First Row
	// ======================================
	const firstRow = document.createElement("div");
	firstRow.classList.add("row", "row-cols-1", "row-cols-md-3", "justify-content-center");

	const envLIElem = envLightIntenseElem();
	const aPVElem = allProxyVisibleElem();
	const sAPElem = showAllProxyElem();

	firstRow.appendChild(envLIElem);
	firstRow.appendChild(aPVElem);
	firstRow.appendChild(sAPElem);

	// ======================================
	// 				Second Row
	// ======================================
	const secondRow = document.createElement("div");
	secondRow.classList.add("row", "row-cols-1", "row-cols-md-4", "justify-content-center");

	const occlElem = occlusionElem();
	const dirLightElem = directionalLightElem();
	const autoLPElem = autoLightProbeElem();
	const ambientOcclElem = ambientOcclusionElem();

	secondRow.appendChild(occlElem);
	secondRow.appendChild(dirLightElem);
	secondRow.appendChild(autoLPElem);
	secondRow.appendChild(ambientOcclElem);

	// ======================================
	// 			Final Composition
	// ======================================
	container.appendChild(firstRow);
	container.appendChild(secondRow);

	return container;
}

function envLightIntenseElem() {
	return createSettingsRange({
		labelClass: envSetClasses.lightIntensityInputClass + "Label" + " form-label fs-6",
		labelI18n: "ENV_LIGHT_INTENSITY",
		labelFor: "light-intensity",
		inputId: envSetClasses.lightIntensityInputClass,
		inputClass: envSetClasses.lightIntensityInputClass,
		value: EnvironmentSettingsActions.getLightIntensity(),
		min: 0.05,
		max: 10,
		step: 0.05,
		onChange: (value) => {
			EnvironmentSettingsActions.setLightIntensity(value);
		},
	});
}

function allProxyVisibleElem(E = null) {
	return createSettingsCheckbox({
		labelClass: envSetClasses.allProxyVisibleInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "ALL_PROXY_VISIBLE",
		labelFor: "all-proxy-visible",
		inputClass: envSetClasses.allProxyVisibleInputClass,
		checked: EnvironmentSettingsActions.areProxiesAlwaysVisible(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setProxiesAlwaysVisible(checked);
		},
	});
}

function showAllProxyElem(E = null) {
	return createSettingsCheckbox({
		labelClass: envSetClasses.showAllProxiesInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "SHOW_ALL_PROXIES",
		labelFor: "show-all-proxies",
		inputClass: envSetClasses.showAllProxiesInputClass,
		checked: EnvironmentSettingsActions.shouldShowAllProxies(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setShowAllProxies(checked);
		},
	});
}

function occlusionElem(E = null) {
	return createSettingsCheckbox({
		labelClass: envSetClasses.occlusionInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "OCCLUSION_OPTION",
		labelFor: "occlusion-option",
		inputClass: envSetClasses.occlusionInputClass,
		checked: EnvironmentSettingsActions.isSemanticOcclusionEnabled(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setSemanticOcclusion(checked);
		},
	});
}

function setShadowSettingsVisible(container, visible) {
	if (!container) return;

	container.classList.toggle("d-flex", visible);
	container.classList.toggle("d-none", !visible);
}

function directionalLightElem() {
	const aDLContainer = createSettingsCheckbox({
		containerClass: "d-flex",
		labelClass:
			envSetClasses.activateDirectionalLightInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "ACTIVATE_DIR_LIGHT",
		labelFor: "directional-light",
		inputClass: envSetClasses.activateDirectionalLightInputClass,
		checked: EnvironmentSettingsActions.isDirectionalLightEnabled(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setDirectionalLight(checked);
			setShadowSettingsVisible(sOMainContainer, checked);
		},
	});

	const activeDirLightDesc = document.createElement("div");
	activeDirLightDesc.className = "mx-2 mb-2";
	activeDirLightDesc.dataset.i18n = "ACTIVATE_DIR_LIGHT_DESC";

	const aDLMainContainer = document.createElement("div");
	aDLMainContainer.classList.add("d-flex", "flex-column");

	aDLMainContainer.appendChild(aDLContainer);
	aDLMainContainer.appendChild(activeDirLightDesc);

	// 					SHADOWS OPTION
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	const sOContainer = createSettingsCheckbox({
		containerClass: "d-flex",
		labelClass: envSetClasses.shadowOptionInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "SHADOW_OPTION",
		labelFor: "shadow-option",
		inputClass: envSetClasses.shadowOptionInputClass,
		checked: EnvironmentSettingsActions.areShadowsEnabled(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setShadows(checked);
		},
	});

	const shadowOptionDesc = document.createElement("div");
	shadowOptionDesc.className = "mx-2 mb-2";
	shadowOptionDesc.dataset.i18n = "SHADOW_OPTION_DESC";

	const sOMainContainer = document.createElement("div");
	sOMainContainer.classList.add("d-flex", "flex-column");

	setShadowSettingsVisible(sOMainContainer, EnvironmentSettingsActions.shouldShowShadowSettings());

	sOMainContainer.appendChild(sOContainer);
	sOMainContainer.appendChild(shadowOptionDesc);

	aDLMainContainer.appendChild(sOMainContainer);

	return aDLMainContainer;
}

function autoLightProbeElem() {
	const aLPContainer = createSettingsCheckbox({
		labelClass: envSetClasses.autoLPInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "AUTO_LIGHT_PROBE",
		labelFor: "auto-light-probe",
		inputClass: envSetClasses.autoLPInputClass,
		checked: EnvironmentSettingsActions.isAutoLightProbeEnabled(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setAutoLightProbe(checked);
		},
	});

	const autoLightProbeDesc = document.createElement("div");
	autoLightProbeDesc.className = "mx-2 mb-2";
	autoLightProbeDesc.dataset.i18n = "AUTO_LIGHT_PROBE_DESC";

	const aLPMainContainer = document.createElement("div");
	aLPMainContainer.classList.add("d-flex", "flex-column");

	aLPMainContainer.appendChild(aLPContainer);
	aLPMainContainer.append(autoLightProbeDesc);

	return aLPMainContainer;
}

function ambientOcclusionElem() {
	const aOContainer = createSettingsCheckbox({
		labelClass: envSetClasses.ambientOcclusionInputClass + "Label" + " form-check-label fs-6",
		labelI18n: "AMBIENT_OCCLUSION",
		labelFor: "ambient-occlusion",
		inputClass: envSetClasses.ambientOcclusionInputClass,
		checked: EnvironmentSettingsActions.isAmbientOcclusionEnabled(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setAmbientOcclusion(checked);
		},
	});

	const ambientOcclDesc = document.createElement("div");
	ambientOcclDesc.className = "mx-2 mb-2";
	ambientOcclDesc.dataset.i18n = "AMBIENT_OCCLUSION_DESC";

	const aOIContainer = createSettingsRange({
		labelClass: envSetClasses.ambientOcclusionIntInputClass + "Label" + " form-label fs-6",
		labelI18n: "LIGHT_INTENSITY",
		labelFor: "ambient-occlusion-int",
		inputId: envSetClasses.ambientOcclusionIntInputClass,
		inputClass: envSetClasses.ambientOcclusionIntInputClass,
		value: EnvironmentSettingsActions.getAmbientOcclusionIntensity(),
		min: 0.1,
		max: 0.5,
		step: 0.05,
		onChange: (value) => {
			EnvironmentSettingsActions.setAmbientOcclusionIntensity(value);
		},
	});

	const aOMainContainer = document.createElement("div");
	aOMainContainer.classList.add("d-flex", "flex-column");

	aOMainContainer.appendChild(aOContainer);
	aOMainContainer.appendChild(ambientOcclDesc);
	aOMainContainer.appendChild(aOIContainer);

	return aOMainContainer;
}

/*
	**************************************
	 	VIEWPOINT PANEL
	**************************************
*/
function viewPointPanel() {
	const container = document.createElement("div");
	container.className = "viewPointPanel d-flex flex-column flex-md-row";

	const pLS = povListSection();
	const pFS = povFormsSection();

	container.appendChild(pLS);
	container.appendChild(pFS);

	return container;
}

function createPovFormInput({ inputClass, inputName, value = "", i18nLabel, type = "text" }) {
	const section = document.createElement("div");
	section.className = "my-1 w-100";

	const input = document.createElement("input");
	input.className = "form-control w-100 " + inputClass;
	input.type = type;
	input.value = value;
	input.name = inputName;

	const label = document.createElement("label");
	label.className = "form-label w-100 " + inputClass + "Label";
	label.dataset.i18n = i18nLabel;
	label.setAttribute("for", inputName);

	section.appendChild(label);
	section.appendChild(input);

	return section;
}

function formatPovVector(vector) {
	return vector.x.toPrecision(3) + "," + vector.y.toPrecision(3) + "," + vector.z.toPrecision(3);
}

function getPovFormInputs() {
	const inputsContainer = document.querySelector("." + povFormsClasses.povFormsSection);

	if (!inputsContainer) return [];

	return [...inputsContainer.querySelectorAll("input")];
}

function setPovFormInputsDisabled(disabled) {
	getPovFormInputs().forEach((input) => {
		input.disabled = disabled;
	});
}

function setPovFormValues(pov) {
	const inputs = getPovFormInputs();

	if (inputs.length < 4 || !pov) return;

	inputs[0].value = pov.name || "";
	inputs[1].value = formatPovVector(pov.pos);
	inputs[2].value = formatPovVector(pov.target);
	inputs[3].value = pov.fov;
}

function clearPovFormValues() {
	clearPovInputs();
	getPovFormInputs().forEach((input) => {
		input.disabled = false;
	});
}

function selectPovListEntry(entry) {
	const lastSelected = document.querySelector("." + povListClasses.povListEntry + ".selected");

	if (lastSelected) {
		lastSelected.classList.remove("selected");
	}

	entry.classList.add("selected");
}

function getPovFormContainerFromEvent(e) {
	return e.target.closest("." + povFormsClasses.povFormsSection);
}

function getPovFormValuesFromContainer(container) {
	if (!container) return null;

	const inputs = [...container.querySelectorAll("input")];
	const values = inputs.map((input) => input.value.trim());

	if (values.length < 4 || values.some((value) => value === "")) {
		return null;
	}

	return {
		name: values[0],
		pos: parsePovVectorInput(values[1]),
		target: parsePovVectorInput(values[2]),
		fov: parseFloat(values[3]),
		inputs,
	};
}

function parsePovVectorInput(value) {
	return value.split(",").map((component) => parseFloat(component.trim()));
}

function clearPovInputs(inputs = getPovFormInputs()) {
	inputs.forEach((input) => {
		input.value = "";
	});
}

function createPovActionButton({ className, i18nLabel, onClick }) {
	const button = document.createElement("button");
	button.className = "btn btn-light mx-2 my-1 " + className;

	if (typeof onClick === "function") {
		$(button).on("click", onClick);
	}

	const label = document.createElement("span");
	label.dataset.i18n = i18nLabel;

	button.appendChild(label);

	return button;
}

function setPovCreateSaveMode({ createVisible, saveVisible }) {
	const createBtn = document.querySelector("." + povFormsClasses.createBtnClass);
	const saveBtn = document.querySelector("." + povFormsClasses.saveBtnClass);

	if (createBtn) {
		createBtn.classList.toggle("d-block", createVisible);
		createBtn.classList.toggle("d-none", !createVisible);
	}

	if (saveBtn) {
		saveBtn.classList.toggle("d-block", saveVisible);
		saveBtn.classList.toggle("d-none", !saveVisible);
	}
}

const povListClasses = {
	panelPovListSection: "vPPanelPovListSection",
	panelPovList: "vPPanelPovList",
	povListEntry: "povListEntry",
};

function povListSection() {
	const povListContainer = document.createElement("div");
	povListContainer.className = "d-flex flex-column mx-md-2 " + povListClasses.panelPovListSection;

	const newPovBtn = document.createElement("button");
	newPovBtn.className = "btn btn-light w-100";
	$(newPovBtn).on("click", () => {
		if (PovPanelState.isCreateMode()) return;

		PovPanelState.startCreate();

		clearPovFormValues();

		const createBtn = document.querySelector("." + povFormsClasses.createBtnClass);
		const saveBtn = document.querySelector("." + povFormsClasses.saveBtnClass);

		saveBtn.classList.replace("d-block", "d-none");
		createBtn.classList.replace("d-none", "d-block");
	});

	const newPovBtnLabel = document.createElement("span");
	newPovBtnLabel.dataset.i18n = "NEW_POV_BTN_LABEL";

	newPovBtn.appendChild(newPovBtnLabel);

	povListContainer.appendChild(povListElem());
	povListContainer.appendChild(newPovBtn);

	return povListContainer;
}

function povListElem(container = null, povsList = PovActions.getPovList()) {
	let listContainer;
	if (container) {
		listContainer = container;
		listContainer.innerHTML = "";
	} else {
		const listElem = document.querySelector("." + povListClasses.panelPovList);
		if (listElem) {
			listContainer = listElem;
			listContainer.innerHTML = "";
		} else {
			listContainer = document.createElement("div");
			listContainer.className = povListClasses.panelPovList;
		}
	}

	if (!povsList.length) {
		const noContent = document.createElement("span");
		noContent.className =
			"w-100 h-100 text-center align-content-center fs-5 " +
			(povsList.length ? "d-none" : "d-block");
		noContent.dataset.i18n = "NO_CONTENT_LABEL";

		listContainer.appendChild(noContent);
	}

	povsList.forEach((pov, index) => {
		let listEntryElem = povListEntryElem(pov, index);
		listContainer.appendChild(listEntryElem);
	});

	return !container ? listContainer : null;
}

function povListEntryElem(pov, povIndex) {
	const listEntry = document.createElement("div");
	listEntry.className = povListClasses.povListEntry + " d-flex";
	listEntry.dataset.index = povIndex;
	$(listEntry).on("click", (e) => {
		PovPanelState.startView();

		const entry = e.target.classList.contains(povListClasses.povListEntry)
			? e.target
			: e.target.closest("." + povListClasses.povListEntry);

		if (!entry) return;

		selectPovListEntry(entry);

		const selectedPov = PovActions.getPovAtIndex(entry.dataset.index);

		setPovFormInputsDisabled(true);
		setPovFormValues(selectedPov);
	});

	const listEntryLabel = document.createElement("span");
	listEntryLabel.className = "h-100 flex-grow-1 text-break";
	listEntryLabel.textContent = pov.name;

	const lEDelBtn = document.createElement("button");
	lEDelBtn.className = "btn h-100";
	$(lEDelBtn).on("click", (e) => {
		if (confirm("Delete POV?")) {
			const entry = e.target.closest("." + povListClasses.povListEntry);
			const povIdx = Number(entry.dataset.index);
			PovActions.removePovAtIndex(povIdx);
			povListElem();
		}
	});
	const lEDelBtnIcon = document.createElement("img");
	lEDelBtnIcon.src = "/a/heriverse/assets/icons/delete-button-icon.svg";

	lEDelBtn.appendChild(lEDelBtnIcon);

	listEntry.appendChild(listEntryLabel);
	listEntry.appendChild(lEDelBtn);

	return listEntry;
}

const povFormsClasses = {
	povFormsSection: "vPPanelPovFormsSection",
	nameFormClass: "namePovForm",
	posFormClass: "posPovForm",
	targetFormClass: "targetPovForm",
	fovFormClass: "fovPovForm",
	goToBtnClass: "goToPovBtn",
	editBtnClass: "editPovBtn",
	createBtnClass: "createPovBtn",
	saveBtnClass: "savePovBtn",
};

function povFormsSection() {
	PovPanelState.reset();

	const currPov = PovActions.getCurrentPov();
	const startPos = formatPovVector(currPov.pos);
	const startTarg = formatPovVector(currPov.target);

	const povFormsContainer = document.createElement("div");
	povFormsContainer.className = "d-flex flex-column mx-md-2 " + povFormsClasses.povFormsSection;

	// =========================
	// 		NAME FORM
	// =========================
	const nameSection = createPovFormInput({
		inputClass: povFormsClasses.nameFormClass,
		inputName: "pov-name-form",
		value: currPov.name || "",
		i18nLabel: "POV_NAME_FORM_LABEL",
	});

	// =========================
	// 		POS FORM
	// =========================
	const posSection = createPovFormInput({
		inputClass: povFormsClasses.posFormClass,
		inputName: "pov-pos-form",
		value: startPos,
		i18nLabel: "POV_POS_FORM_LABEL",
	});

	// =========================
	// 		TARGET FORM
	// =========================
	const targSection = createPovFormInput({
		inputClass: povFormsClasses.targetFormClass,
		inputName: "pov-targ-form",
		value: startTarg,
		i18nLabel: "POV_TARG_FORM_LABEL",
	});

	// =========================
	// 		FOV FORM
	// =========================
	const fovSection = createPovFormInput({
		inputClass: povFormsClasses.fovFormClass,
		inputName: "pov-fov-form",
		value: currPov.fov,
		i18nLabel: "POV_FOV_FORM_LABEL",
	});

	// =========================
	// 		BUTTONS SECTION
	// =========================
	const buttonsSection = document.createElement("div");
	buttonsSection.className = "my-1 w-100 d-flex flex-column flex-md-row";

	// ~~~~~~~~~~~~~~~~~~~~~~~~~
	// 		GO TO BUTTON
	// ~~~~~~~~~~~~~~~~~~~~~~~~~
	const goToBtn = createPovActionButton({
		className: povFormsClasses.goToBtnClass,
		i18nLabel: "GO_TO_BTN_LABEL",
		onClick: (e) => {
			const genContainer = e.target.closest("." + settContainersClasses.genSettingsContainerClass);
			const values = getPovFormValuesFromContainer(getPovFormContainerFromEvent(e));

			if (!values) {
				alert("Empty fields!");
				return;
			}

			genContainer?.remove();

			PovActions.requestPovFromValues(values);
		},
	});

	// ~~~~~~~~~~~~~~~~~~~~~~~~~
	// 		EDIT BUTTON
	// ~~~~~~~~~~~~~~~~~~~~~~~~~
	const editBtn = createPovActionButton({
		className: povFormsClasses.editBtnClass,
		i18nLabel: "EDIT_BTN_LABEL",
		onClick: () => {
			if (PovPanelState.isEditMode() || PovPanelState.isCreateMode()) return;

			const selectedEntry = document.querySelector("." + povListClasses.povListEntry + ".selected");

			if (!selectedEntry) return;

			PovPanelState.startEdit(selectedEntry.dataset.index);

			setPovCreateSaveMode({
				createVisible: false,
				saveVisible: true,
			});

			setPovFormInputsDisabled(false);
		},
	});

	// ~~~~~~~~~~~~~~~~~~~~~~~~~
	// 	  CREATE/SAVE BUTTON
	// ~~~~~~~~~~~~~~~~~~~~~~~~~
	const createBtn = createPovActionButton({
		className:
			(PovPanelState.isCreateMode() ? "d-block" : "d-none") + " " + povFormsClasses.createBtnClass,
		i18nLabel: "CREATE_BTN_LABEL",
		onClick: (e) => {
			const values = getPovFormValuesFromContainer(getPovFormContainerFromEvent(e));

			if (!values) {
				alert("Empty fields!");
				return;
			}

			PovActions.addPovFromValues(values);
			povListElem();

			clearPovInputs(values.inputs);
			PovPanelState.finishCreate();
		},
	});

	const saveBtn = createPovActionButton({
		className:
			(PovPanelState.isEditMode() ? "d-block" : "d-none") + " " + povFormsClasses.saveBtnClass,
		i18nLabel: "SAVE_BTN_LABEL",
		onClick: (e) => {
			const values = getPovFormValuesFromContainer(getPovFormContainerFromEvent(e));

			if (!values) {
				alert("Empty fields!");
				return;
			}

			PovActions.updatePovAtIndex(PovPanelState.getSelectedIndex(), values);
			povListElem();

			clearPovInputs(values.inputs);
			PovPanelState.finishEdit();

			setPovCreateSaveMode({
				createVisible: true,
				saveVisible: false,
			});
		},
	});

	buttonsSection.appendChild(goToBtn);
	buttonsSection.appendChild(editBtn);
	buttonsSection.appendChild(createBtn);
	buttonsSection.appendChild(saveBtn);

	// =========================
	// 		COMPOSITION
	// =========================
	povFormsContainer.appendChild(nameSection);
	povFormsContainer.appendChild(posSection);
	povFormsContainer.appendChild(targSection);
	povFormsContainer.appendChild(fovSection);
	povFormsContainer.appendChild(buttonsSection);

	return povFormsContainer;
}

/*
	**************************************
	 		ZOOM TO GRAPH SETTING
	**************************************
*/
const zoomToGraphClasses = {
	zoomToGraphChkClass: "zTGCheck",
};

function zoomToGraphSectionElem() {
	const zTGSecElem = document.createElement("div");
	zTGSecElem.className =
		settContainersClasses.zoomToGraphSectionClass + " d-flex flex-column justify-content-center";

	const zTGCheckSection = createSettingsCheckbox({
		containerClass: "d-flex justify-content-start",
		labelClass: zoomToGraphClasses.zoomToGraphChkClass + "Label" + " fs-6 m-2 form-check-label",
		labelI18n: "ZOOM_TO_GRAPH_CHK_LABEL",
		labelFor: "zoom-to-graph",
		inputClass: zoomToGraphClasses.zoomToGraphChkClass,
		inputId: "zoom-to-graph",
		inputName: "zoom-to-graph",
		checked: EnvironmentSettingsActions.isZoomToGraphEnabled(),
		onChange: (checked) => {
			EnvironmentSettingsActions.setZoomToGraph(checked);
		},
	});

	const zTGCheckDesc = document.createElement("div");
	zTGCheckDesc.className = "mx-2 mb-2";
	zTGCheckDesc.dataset.i18n = "ZOOM_TO_GRAPH_CHK_DESC";

	zTGSecElem.appendChild(document.createElement("hr"));
	zTGSecElem.appendChild(zTGCheckSection);
	zTGSecElem.appendChild(zTGCheckDesc);
	zTGSecElem.appendChild(document.createElement("hr"));

	return zTGSecElem;
}

function createSettingsPanelButton({
	className,
	i18nLabel,
	onClick,
	buttonClass = "btn btn-light w-100 my-1",
}) {
	const button = document.createElement("button");
	button.className = `${buttonClass} ${className}`;

	if (typeof onClick === "function") {
		$(button).on("click", onClick);
	}

	const label = document.createElement("span");
	label.dataset.i18n = i18nLabel;

	button.appendChild(label);

	return button;
}

UI.createSettings = (containerSelector = "") => {
	const container = document.querySelector(
		containerSelector ? containerSelector : "." + settContainersClasses.sceneSettingSectionClass
	);
	if (!container) return;

	// container.style.height = "25vh";
	// container.style.overflowY = "auto";
	container.innerHTML = "";

	// ====================================================
	// 					ENV SETTINGS BUTTON
	// ====================================================
	const envSettingsBtn = createSettingsPanelButton({
		className: settContainersClasses.envSettingsBtnClass,
		i18nLabel: "ENV_SETTINGS_BTN",
		onClick: setupAndShowEnvSettingsPanel,
	});

	// ====================================================
	// 				VIEWPOINT MANAGER BUTTON
	// ====================================================
	const viewPointManagerBtn = createSettingsPanelButton({
		className: settContainersClasses.viewPointMangerBtnClass,
		i18nLabel: "VIEW_POINT_MANAGER_BTN",
		onClick: setupAndShowViewpointsPanel,
	});

	// ====================================================
	// 				ZOOM TO GRAPH OPTION
	// ====================================================
	const zoomToGraphSection = zoomToGraphSectionElem();

	// ====================================================
	// 					COMPOSITION
	// ====================================================
	container.appendChild(envSettingsBtn);
	container.appendChild(viewPointManagerBtn);
	container.appendChild(zoomToGraphSection);

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
};

function createGeneralSettingsContainer() {
	const genSettingsContainer = document.createElement("div");

	genSettingsContainer.classList.add(
		"w-100",
		"h-100",
		"d-flex",
		"justify-content-center",
		"align-items-center",
		settContainersClasses.genSettingsContainerClass
	);

	return genSettingsContainer;
}

function showGeneralSettingsPanel(contentFactory) {
	if (document.querySelector("." + settContainersClasses.genSettingsContainerClass)) return;

	const genSettingsContainer = createGeneralSettingsContainer();
	const contentContainer = contentFactory();

	$(genSettingsContainer).on("click", (e) => {
		if (contentContainer.contains(e.target)) return;

		UI.closeGeneralSettingsPanel();
	});

	genSettingsContainer.appendChild(contentContainer);

	document.body.prepend(genSettingsContainer);

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
}

export function setupAndShowEnvSettingsPanel() {
	showGeneralSettingsPanel(envSettingsPanel);
}

export function setupAndShowViewpointsPanel() {
	showGeneralSettingsPanel(viewPointPanel);
}

function toggleAllRelations() {
	const inputsContainer = document.getElementById("scene-controls-relations");
	if (!inputsContainer) return;

	const relationCheckers = inputsContainer.querySelectorAll(
		".relationCheckbox:not(.check-all-relations)"
	);

	const checked = this.checked;

	GraphRelationsActions.setAllRelationsActive(checked);

	relationCheckers.forEach((checker) => {
		checker.checked = checked;
	});
}

function toggleRelation() {
	const relationValue = this.dataset.relname;
	const inputsContainer = document.getElementById("scene-controls-relations");
	const selectAllRelations = inputsContainer?.querySelector(".check-all-relations");

	if (!relationValue) return;

	GraphRelationsActions.toggleRelation(relationValue);

	if (selectAllRelations) {
		selectAllRelations.checked = GraphRelationsActions.areAllRelationsActive();
	}
}

function buildRelationCheckboxHTML(relation, index) {
	const inputId = `relationCheckbox-${index + 1}`;
	const labelId = `${inputId}-label`;
	const checked = GraphRelationsActions.isRelationActive(relation.value) ? " checked" : "";

	return `
		<label id="${labelId}" for="${inputId}" class="fs-6 text-wrap">
			<input
				class="my-1 relationCheckbox"
				id="${inputId}"
				aria-labelledby="${labelId}"
				type="checkbox"
				data-relname="${relation.value}"${checked}>
			${relation.label}
		</label>
	`;
}

UI.buildRelationsManagement = (containerSelector) => {
	const container = document.querySelector(containerSelector);

	const relationsCollection = GraphRelationsActions.getAvailableRelations();

	const presets = GraphRelationsActions.getRelationPresets();

	let html = `
		<h5 id="toggle-relations-btn"
			class='mt-2 mb-1 p-1 text-center scene-controls-panel-subtitle position-relative'
			data-i18n='RELATIONS_CHECK_SECTION_TITLE'
			style="user-select:none; cursor:pointer;">
			Relazioni da disegnare
			<span
				class="position-absolute end-0 top-50 translate-middle-y me-2"
				style="pointer-events:none;">
				<i class="fas fa-chevron-up"></i>
			</span>
		</h5>
		<div class="border-bottom mb-2"></div>
		<div class="relations-presets-bar mb-2">
			${presets
				.map(
					(preset, i) => `
				<button
					class="relations-preset-btn"
					data-preset-index="${i}"
					data-relations="${preset.relations.join(",")}">
					${preset.label}
				</button>`
				)
				.join("")}
		</div>
		<div id="scene-controls-relations" class="d-flex flex-column align-items-start" style="display:flex;">
	`;

	html += `<label id="relationCheckbox-0-label" for="relationCheckbox-0" class="fs-6 text-wrap">`;
	html += `<input class='my-1 relationCheckbox check-all-relations' id='relationCheckbox-0' aria-labelledby='relationCheckbox-0-label' type='checkbox' ${
		GraphRelationsActions.areAllRelationsActive() ? " checked" : ""
	}>`;
	html += "</input>";
	html += `Seleziona tutto</label>`;

	relationsCollection.forEach((relation, index) => {
		html += buildRelationCheckboxHTML(relation, index);
	});
	html += "</div>";
	container.innerHTML = html;

	// Toggle
	const btn = container.querySelector("#toggle-relations-btn");
	const icon = btn.querySelector("i");
	const relDiv = container.querySelector("#scene-controls-relations");
	btn.addEventListener("click", () => {
		const isHidden = relDiv.style.display === "none";
		relDiv.style.display = isHidden ? "flex" : "none";
		if (icon) icon.classList.toggle("fa-chevron-down", !isHidden);
		if (icon) icon.classList.toggle("fa-chevron-up", isHidden);
	});

	$(document)
		.off("change", ".relationCheckbox:not(.check-all-relations)", toggleRelation)
		.on("change", ".relationCheckbox:not(.check-all-relations)", toggleRelation);
	$(document)
		.off("change", ".check-all-relations", toggleAllRelations)
		.on("change", ".check-all-relations", toggleAllRelations);

	// Preset buttons
	$(document)
		.off("click", ".relations-preset-btn")
		.on("click", ".relations-preset-btn", function () {
			const presetRelations = $(this).attr("data-relations").split(",");

			GraphRelationsActions.setActiveRelations(presetRelations);

			const inputsContainer = document.getElementById("scene-controls-relations");
			inputsContainer
				.querySelectorAll(".relationCheckbox:not(.check-all-relations)")
				.forEach((chk) => {
					chk.checked = presetRelations.includes(chk.dataset.relname);
				});

			const allChecked = GraphRelationsActions.areAllRelationsActive();
			inputsContainer.querySelector(".check-all-relations").checked = allChecked;

			document
				.querySelectorAll(".relations-preset-btn")
				.forEach((b) => b.classList.remove("active"));
			$(this).addClass("active");
		});
};

function graphOptionCheckActions(e, graphsCollection = []) {
	$("#idLoader").show();

	const targetInput = e.target;
	const graphId = targetInput.dataset.id;

	const graphItem = targetInput.closest(".graph-selector-item");
	const graphName = graphItem?.querySelector(".graph-selector-label")?.textContent?.trim() || "";

	const result = GraphSelectionActions.applyGraphSelection({
		graphId,
		graphName,
		graphsCollection,
	});

	const buttonText = document.querySelector("#graphDropdown .button-text");

	if (buttonText) {
		buttonText.textContent = result.label;
	}

	GraphSelectionActions.refreshSceneAfterGraphSelection();

	GraphSelectionActions.refreshWorkspaceAfterGraphSelection();
}

UI.buildGraphSelector = (containerSelector, graphsCollection) => {
	const container = document.querySelector(containerSelector);
	if (!container) return;

	const buttonText = GraphSelectionActions.getGraphSelectorButtonText(graphsCollection);

	let html = `
		<div id="graphCollectionSelector" class="graph-selector-container">
			<button type="button" id="graphDropdown" class="graph-selector-btn">
				<span class="button-text">${buttonText}</span>
				<svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
					<path d="M6 8L2 4h8L6 8z" fill="currentColor"/>
				</svg>
			</button>
			<div class="graph-selector-menu" id="graphSelectorMenu">
				<div class="graph-selector-header">
					<h6 class="graph-selector-title">Select Graphs</h6>
				</div>
				<div class="graph-selector-list">
					${graphsCollection
						.filter((graph) => graph.id !== "shelf")
						.map((graph, idx) => {
							let isChecked = GraphSelectionActions.isGraphSelected(graph.id);
							let isDisabled = !GraphSelectionActions.canDeselectGraph(graph.id);
							return `
								<div class="graph-selector-item ${isDisabled ? "disabled" : ""}" data-index="${idx}" data-id="${
									graph.id
								}">
									<div class="checkbox-container">
										<input class="graph-selector-checkbox" 
											id="graphCollectionName-${idx}"
											data-index="${idx}"
											data-id="${graph.id}"
											type="checkbox"
											${isChecked ? "checked" : ""}
											${isDisabled ? "disabled" : ""}
											autocomplete="off" aria-labelledby="graphCollectionName-${idx}-label"/>
										<div class="checkbox-custom"></div>
									</div>
									<label class="graph-selector-label" for="graphCollectionName-${idx}" id="graphCollectionName-${idx}-label">
										${graph.name ? graph.name : "GRAPH " + (idx + 1)}
									</label>
								</div>
							`;
						})
						.join("")}
						${
							AppModeViewModel.isEditorMode()
								? `
							<button id="createNewGraph" class="btn btn-new-graph w-100 fs-5"> + </button>
							`
								: ""
						}
				</div>
			</div>
		</div>
	`;

	container.innerHTML = html;

	const dropdown = document.getElementById("graphDropdown");
	const menu = document.getElementById("graphSelectorMenu");
	const arrow = dropdown.querySelector(".dropdown-arrow");
	let isOpen = false;

	dropdown.addEventListener("click", (e) => {
		e.stopPropagation();
		toggleDropdown();
	});

	document.addEventListener("click", (e) => {
		if (!container.contains(e.target)) {
			closeDropdown();
		}
	});

	menu.addEventListener("click", (e) => {
		e.stopPropagation();
	});

	if (AppModeViewModel.isEditorMode()) {
		const newGraph = document.getElementById("createNewGraph");
		newGraph.addEventListener("click", (e) => {
			const newGraphModal = document.getElementById("createNewGraphModal");
			const bsModal = bootstrap.Modal.getOrCreateInstance(newGraphModal);

			bsModal.show();
		});
	}

	function toggleDropdown() {
		isOpen = !isOpen;
		menu.classList.toggle("open", isOpen);
		arrow.classList.toggle("rotated", isOpen);
		dropdown.classList.toggle("active", isOpen);
	}

	function closeDropdown() {
		isOpen = false;
		menu.classList.remove("open");
		arrow.classList.remove("rotated");
		dropdown.classList.remove("active");
	}

	$(document)
		.off("change", "input[id^=graphCollectionName]")
		.on("change", "input[id^=graphCollectionName]", (e) =>
			graphOptionCheckActions(e, graphsCollection)
		);
};

export let filterSelected;

function activeAutoTemporalFiltersMode(e) {
	const root = UI.getPeriodFilterRootFromEvent(e);
	if (!root) return;

	const autoTemporalFiltersSelector = root.querySelector(".auto-temporal-filters-dropdown");
	const autoTemporalFiltersButton = root.querySelector(".auto-temporal-filters-dropdown-toggle");
	const autoTemporalFiltersDropdown = root.querySelector(
		".auto-temporal-filters-dropdown-menu-scroll"
	);
	const periodFiltersSection = root.querySelector(
		".temporal-filters-section, .temporal-filters-section-mobile"
	);
	const periodFiltersButton = periodFiltersSection?.querySelector(".period-dropdown-toggle");
	const periodFiltersDropdown = periodFiltersSection?.querySelector(".period-dropdown-menu-scroll");

	if (!autoTemporalFiltersSelector || !periodFiltersSection) return;

	autoTemporalFiltersButton?.classList.remove("open");
	autoTemporalFiltersDropdown?.classList.remove("show");

	periodFiltersButton?.classList.remove("open");
	periodFiltersDropdown?.classList.remove("show");

	autoTemporalFiltersSelector?.classList.toggle("hidden");
	periodFiltersSection.style.display =
		periodFiltersSection?.style.display === "contents" ? "none" : "contents";
}

function toggleTemporalFiltersDropdownAM(e) {
	e?.stopPropagation();

	const dropdown = this.closest(".auto-temporal-filters-dropdown");
	const menu = dropdown?.querySelector(".auto-temporal-filters-dropdown-menu-scroll");

	if (!menu) return;

	const isOpen = menu.classList.contains("show");

	this.classList.toggle("open", !isOpen);
	menu.classList.toggle("show", !isOpen);
}

function selectTemporalFilterAM(e) {
	e.stopPropagation();
	$("#idLoader").show();

	this.closest("#periodSectionPanel, #idTL")
		.querySelector(".autoTemporalFilters")
		.classList.remove("open");
	this.closest("#periodSectionPanel, #idTL")
		.querySelector(".autoTemporalFilters")
		.closest(".auto-temporal-filters-dropdown")
		.querySelector(".auto-temporal-filters-dropdown-menu-scroll")
		.classList.remove("show");

	const selectButton = this.closest(".auto-temporal-filters-dropdown").querySelector(
		".autoTemporalFilters"
	);
	const options = document.querySelectorAll(".autoTemporalFilterOption");

	options.forEach((option) => option.classList.remove("selected"));
	this.classList.add("selected");

	selectButton.textContent = this.textContent;
	selectButton.style.background = this.style.background;

	TemporalActions.applyPeriodFilterValues({
		id: this.dataset.id,
		start: this.dataset.start,
		end: this.dataset.end,
	});
}

function selectExistingPeriod(e) {
	const selectedOption = e.target.closest(".periodSelectorFilterOption");
	if (!selectedOption) return;

	filterSelected = selectedOption;

	const root = UI.getPeriodFilterRootFromEvent(e);
	const { periodSelectButton, startPeriodForm, endPeriodForm, editFilterButton } =
		UI.getPeriodFilterElementsFromRoot(root);

	if (!periodSelectButton || !startPeriodForm || !endPeriodForm) return;

	root
		.querySelectorAll(".periodSelectorFilterOption.selected")
		.forEach((option) => option.classList.remove("selected"));

	selectedOption.classList.add("selected");

	periodSelectButton.textContent = selectedOption.textContent;
	periodSelectButton.style.setProperty(
		"--p-item-bg",
		selectedOption.style.getPropertyValue("--p-item-bg")
	);

	if (selectedOption.dataset.index !== "0") {
		startPeriodForm.value = selectedOption.dataset.start;
		endPeriodForm.value = selectedOption.dataset.end;

		if (editFilterButton) editFilterButton.disabled = false;

		return;
	}

	startPeriodForm.value = "";
	endPeriodForm.value = "";

	if (editFilterButton) editFilterButton.disabled = true;
}

function changePeriodFormFilter(e) {
	const root = UI.getPeriodFilterRootFromEvent(e);
	const { periodSelectButton, resetOption, selectedOption, editFilterButton } =
		UI.getPeriodFilterElementsFromRoot(root);

	if (!periodSelectButton || !resetOption) return;

	periodSelectButton.textContent = resetOption.textContent;
	periodSelectButton.style.background = resetOption.style.borderLeftColor;

	if (selectedOption) selectedOption.classList.remove("selected");

	resetOption.classList.add("selected");

	if (editFilterButton) editFilterButton.disabled = true;
}

function useFilterButton(e) {
	const root = UI.getPeriodFilterRootFromEvent(e);
	const periodValues = UI.getPeriodFilterValuesFromRoot(root);

	if (!periodValues.hasStart || !periodValues.hasEnd) {
		alert("One of the values miss!");
		return;
	}

	TemporalActions.applyPeriodFilterValues(periodValues);
}

UI.selectTimelinePeriod = (periodDomId, mobile = false) => {
	$("#idLoader").show();

	const periodId = periodDomId.substring(2);

	TemporalActions.cleanSceneBeforePeriodChange();

	updateSelectedPeriodDropdown(periodDomId, mobile);

	TemporalActions.applyTimelinePeriodById(periodId);
};

UI.buildPeriodFilter = (containerSelector, mobile = false) => {
	const container = document.querySelector(containerSelector);

	const epochs = PeriodFilterViewModel.getPeriodFilterEpochOptions();
	const temporalFilters = PeriodFilterViewModel.getAutoTemporalFilterOptions();

	const labelClass = mobile ? "fs-5 my-2 text-dark" : "fs-6 mx-3";

	let html = `<label id="autoTemporalFiltersSwitchLabel" for="autoTemporalFiltersSwitch" style="font-size: 1rem">Auto-filters Mode</label><input id="autoTemporalFiltersSwitch${
		mobile ? "-mobile" : ""
	}" class="autoTemporalFiltersSwitch" type="checkbox" aria-labelledby="autoTemporalFiltersSwitchLabel" />
	<div class="auto-temporal-filters-dropdown hidden">
	<button type="button" class="autoTemporalFilters auto-temporal-filters-dropdown-toggle">Seleziona un filtro</button>
	<ul class="auto-temporal-filters-dropdown-menu-scroll p-3">
		${
			temporalFilters.length
				? temporalFilters
						.map(
							(filter) => `
					<li>
						<p class='autoTemporalFilterOption'
							data-id='${filter.id}'
							data-index='${filter.index}'
							data-start='${filter.start}'
							data-end='${filter.end}'
							style='border-left-color:${filter.color};color: black;'>
							${filter.name}
						</p>
					</li>
				`
						)
						.join("")
				: ""
		}
	</ul></div>`;
	html += `<div class="temporal-filters-section${
		mobile ? "-mobile" : ""
	}" style="display: contents"><div class="period-dropdown">
			<button type='button' id='periodSelectorFilter' class='period-dropdown-toggle'>
				Seleziona un periodo
			</button>
			<ul class='period-dropdown-menu-scroll p-3' aria-labelledby='periodSelectorFilter'>
				<li>
					<p class='periodSelectorFilterOption selected' data-index='0'>
						Seleziona un periodo
					</p>
				</li>
				${
					epochs.length
						? epochs
								.map(
									(epoch) => `
					<li>
						<p class='periodSelectorFilterOption'
							data-id='${epoch.id}'
							data-index='${epoch.index}'
							data-start='${epoch.start}'
							data-end='${epoch.end}'
							style='border-left-color:${epoch.color};color: black;'>
							${epoch.name}
						</p>
					</li>
				`
								)
								.join("")
						: ""
				}
			</ul>
		</div>
		<label class='${labelClass}' data-i18n='START_PERIOD_FILTER'>
			Start 
		</label><input id='startPeriodFilterForm' type='text'>
		<label class='${labelClass.replace("mx-3", "")}' data-i18n='END_PERIOD_FILTER'>
			End 
		</label><input id='endPeriodFilterForm' type='text'>
		<button type='button' id='periodFilterButton' class='filter-button mx-3'
			data-i18n='PERIOD_FILTER_BUTTON'>Filter
		</button>
	`;

	if (AppModeViewModel.isEditorMode()) {
		html += `
			<button type='button' id='periodEditButton' class='btn btn-secondary edit-filter-button' data-i18n='PERIOD_EDIT_BUTTON'
				disabled>Edit period</button>
			<button type='button' id='periodSaveButton' class='btn btn-secondary save-filter-button' data-i18n='PERIOD_SAVE_BUTTON'>Save period</button>
		`;
	}
	html += "</div>";

	container.innerHTML = html;

	const toggle = container.querySelector("#periodSelectorFilter");
	const menu = container.querySelector(".period-dropdown-menu-scroll");
	const options = container.querySelectorAll(".periodSelectorFilterOption");

	toggle.addEventListener("click", (e) => {
		e.stopPropagation();
		const isOpen = menu.classList.contains("show");
		if (isOpen) {
			toggle.classList.remove("open");
			menu.classList.remove("show");
		} else {
			toggle.classList.add("open");
			menu.classList.add("show");
		}
	});

	document.addEventListener("click", (e) => {
		if (!container.contains(e.target)) {
			toggle.classList.remove("open");
			menu.classList.remove("show");
		}
	});

	options.forEach((option) => {
		option.addEventListener("click", (e) => {
			e.stopPropagation();

			options.forEach((opt) => opt.classList.remove("selected"));
			option.classList.add("selected");

			toggle.textContent = option.textContent;

			const computedColor = window.getComputedStyle(option).borderLeftColor;
			toggle.style.background = computedColor;

			const startInput = container.querySelector("#startPeriodFilterForm");
			const endInput = container.querySelector("#endPeriodFilterForm");
			if (option.dataset.start && option.dataset.end) {
				startInput.value = option.dataset.start;
				endInput.value = option.dataset.end;
			} else {
				startInput.value = "";
				endInput.value = "";
			}

			const editBtn = container.querySelector("#periodEditButton");
			if (editBtn) editBtn.disabled = !(option.dataset.start && option.dataset.end);

			toggle.classList.remove("open");
			menu.classList.remove("show");
		});
	});

	$(document)
		.off(
			"change",
			"#autoTemporalFiltersSwitch, #autoTemporalFiltersSwitch-mobile",
			activeAutoTemporalFiltersMode
		)
		.on(
			"change",
			"#autoTemporalFiltersSwitch, #autoTemporalFiltersSwitch-mobile",
			activeAutoTemporalFiltersMode
		);

	$(document)
		.off("click", ".autoTemporalFilters", toggleTemporalFiltersDropdownAM)
		.on("click", ".autoTemporalFilters", toggleTemporalFiltersDropdownAM);

	$(document)
		.off("click", ".autoTemporalFilterOption", selectTemporalFilterAM)
		.on("click", ".autoTemporalFilterOption", selectTemporalFilterAM);

	$(document)
		.off("click", "#idTL #periodSelectorFilter ~ ul > li", selectExistingPeriod)
		.on("click", "#idTL #periodSelectorFilter ~ ul > li", selectExistingPeriod);
	$(document)
		.off("click", "#periodSectionPanel #periodSelectorFilter ~ ul > li", selectExistingPeriod)
		.on("click", "#periodSectionPanel #periodSelectorFilter ~ ul > li", selectExistingPeriod);

	$(document)
		.off(
			"input",
			"#idTL #startPeriodFilterForm, #idTL #endPeriodFilterForm",
			changePeriodFormFilter
		)
		.on(
			"input",
			"#idTL #startPeriodFilterForm, #idTL #endPeriodFilterForm",
			changePeriodFormFilter
		);
	$(document)
		.off(
			"input",
			"#periodSectionPanel #startPeriodFilterForm, #periodSectionPanel #endPeriodFilterForm",
			changePeriodFormFilter
		)
		.on(
			"input",
			"#periodSectionPanel #startPeriodFilterForm, #periodSectionPanel #endPeriodFilterForm",
			changePeriodFormFilter
		);

	$(document)
		.off("click", "#idTL #periodFilterButton", useFilterButton)
		.on("click", "#idTL #periodFilterButton", useFilterButton);
	$(document)
		.off("click", "#periodSectionPanel #periodFilterButton", useFilterButton)
		.on("click", "#periodSectionPanel #periodFilterButton", useFilterButton);

	if (AppModeViewModel.isEditorMode()) {
		$(document)
			.off("click", "#idTL #periodEditButton", TemporalActions.editTemporalFilter)
			.on("click", "#idTL #periodEditButton", TemporalActions.editTemporalFilter);
		$(document)
			.off("click", "#periodSectionPanel #periodEditButton", TemporalActions.editTemporalFilter)
			.on("click", "#periodSectionPanel #periodEditButton", TemporalActions.editTemporalFilter);

		$(document)
			.off("click", "#idTL #periodSaveButton", TemporalActions.saveTemporalFilter)
			.on("click", "#idTL #periodSaveButton", TemporalActions.saveTemporalFilter);
		$(document)
			.off("click", "#periodSectionPanel #periodSaveButton", TemporalActions.saveTemporalFilter)
			.on("click", "#periodSectionPanel #periodSaveButton", TemporalActions.saveTemporalFilter);
	}

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
};

UI.showPointerLabel = ({ text = "", x = 0, y = 0, yOffset = 0, cursor = "crosshair" } = {}) => {
	const label = document.getElementById("idPovLabel");
	const view = document.getElementById("idView3D");

	if (!label) return;

	label.innerHTML = text;
	label.style.transform = "translate(" + x + "px, " + (y - yOffset) + "px)";
	label.style.display = "block";

	if (view) {
		view.style.cursor = cursor;
	}
};

UI.hidePointerLabel = ({ cursor = "grab" } = {}) => {
	const label = document.getElementById("idPovLabel");
	const view = document.getElementById("idView3D");

	if (label) {
		label.style.display = "none";
	}

	if (view) {
		view.style.cursor = cursor;
	}
};

function restoreSceneControlsPanel() {
	const sceneControls = document.querySelector("#scene-controls-panel");

	if (!sceneControls) return;

	const interactiveElements = sceneControls.querySelectorAll("input, button");

	interactiveElements.forEach((element) => {
		element.disabled = false;
	});

	sceneControls.style.opacity = "1";
}

UI.closeGeneralSettingsPanel = () => {
	const generalSettingsPanel = document.querySelector(
		"." + settContainersClasses.genSettingsContainerClass
	);

	if (!generalSettingsPanel) return false;

	generalSettingsPanel.remove();

	restoreSceneControlsPanel();

	return true;
};

export default UI;
