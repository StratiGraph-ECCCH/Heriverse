import HeriverseEvents from "../src/HeriverseEvents.js";
import HeriverseNode from "../src/HeriverseGraph/HeriverseNode.js";
import ShelfNode from "../src/ShelfGraph/ShelfNode.js";
import { pathToCreate } from "./pathCreationWizard.js";

function filterShelfResource() {
	const textInputValue = document.getElementById("shelf-panel-searchbar-text").value;
	const activePanel = document.querySelector("#shelf-panel-body > .d-block");
	const activePanelItems = activePanel.querySelectorAll(".shelf-panel-element");

	const linkAsInput = /^(http|https):\/\/([\w-]+(\.[\w-]+)+)(\/[\w-./?%&amp;=]*)?$/.test(
		textInputValue
	);

	const entriesFiltered = [...activePanelItems].filter((htmlElement) =>
		linkAsInput
			? htmlElement.dataset.urlContent === textInputValue
			: htmlElement.dataset.nameContent.toLowerCase().includes(textInputValue.toLowerCase())
	);

	activePanelItems.forEach((elem) => {
		elem.classList.toggle("d-none", !entriesFiltered.includes(elem));
	});
}

export function setupShelf() {
	const searchBarInput = document.getElementById("shelf-panel-searchbar-text");

	searchBarInput.addEventListener("input", filterShelfResource);
}

function makeListItemsDraggable(panelSelector, listElementSelector) {
	const state =
		makeListItemsDraggable._state ||
		(makeListItemsDraggable._state = {
			bindings: new WeakMap(),
			modalInitialized: false,
			modelCache: new Map(),
			preview: null,
		});

	Editor.state.closedSRModal = false;

	const panel = document.querySelector(panelSelector);
	if (!panel) return;

	panel.querySelectorAll(listElementSelector).forEach((item) => {
		item.style.cursor = "grab";
		item.style.touchAction = "none";
	});

	const modal = document.getElementById("insertShelfResourceModal");
	const typeSelector = document.getElementById("insertShelfResourceModalElementType");
	const btnSuccess = document.getElementById("insertShelfResourceModalInsertButton");
	const btnCancel = document.getElementById("insertShelfResourceModalCancel");
	const bsModal = modal ? bootstrap.Modal.getOrCreateInstance(modal) : null;

	if (!state.modalInitialized && modal && typeSelector && btnSuccess && btnCancel) {
		modal.addEventListener("shown.bs.modal", () => {
			if (typeSelector.options[1]) {
				typeSelector.options[1].disabled =
					Editor.state.currShelfElement?.dataset.contentType !== ShelfNode.CONTENT_TYPE.MODEL_3D;
			}

			if (typeSelector.options[3]) {
				typeSelector.options[3].disabled =
					Editor.state.currShelfElement?.dataset.contentType !== ShelfNode.CONTENT_TYPE.MODEL_3D ||
					!(
						Editor.state.currWorkspaceElement &&
						Editor.state.currWorkspaceElement.dataset.bsType === HeriverseNode.STRATIGRAPHIC_TYPE.SF
					);
			}

			ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
		});

		modal.addEventListener("hidden.bs.modal", () => {
			if (!Editor.state.closedSRModal && typeSelector) {
				const typeSelected = typeSelector.value;
				const dynamicModal = document.getElementById("dynamicModalPathCreation");
				const bsDynModal = dynamicModal ? bootstrap.Modal.getOrCreateInstance(dynamicModal) : null;

				if (typeSelected === "representation") {
					Editor.setupModalSteps(
						Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC,
						Heriverse.CONNECTION_RULES_NODETYPES.LINK,
						"representation"
					);

					if (!pathToCreate) return;
					bsDynModal?.show();
				} else if (typeSelected === "document") {
					Editor.setupModalSteps(
						Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC,
						Heriverse.CONNECTION_RULES_NODETYPES.LINK,
						"document"
					);

					if (!pathToCreate) return;
					bsDynModal?.show();
				} else if (typeSelected === "special_find") {
					Editor.setupModalSteps(
						Heriverse.CONNECTION_RULES_NODETYPES.SEMANTIC_SHAPE,
						Heriverse.CONNECTION_RULES_NODETYPES.LINK,
						"special_find"
					);

					if (!pathToCreate) return;
					bsDynModal?.show();
				}

				ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
			}

			if (typeSelector) {
				typeSelector.selectedIndex = 0;
			}
		});

		btnSuccess.addEventListener("click", () => {
			Editor.state.closedSRModal = false;
			bsModal?.hide();
		});

		btnCancel.addEventListener("click", () => {
			Editor.state.closedSRModal = true;

			if (Editor.state.legalSelectedNode) {
				Editor.setSelectedNode(Editor.state.legalSelectedNode, { resetMode: false });
				Editor.state.legalSelectedNode = null;
			}

			bsModal?.hide();
		});

		state.modalInitialized = true;
	}

	let selectors = state.bindings.get(panel);
	if (!selectors) {
		selectors = new Set();
		state.bindings.set(panel, selectors);
	}

	if (selectors.has(listElementSelector)) return;
	selectors.add(listElementSelector);

	const preview = ensurePreviewState();
	const drag = {
		active: false,
		item: null,
		ghost: null,
		offsetX: 0,
		offsetY: 0,
	};

	function getItem(target) {
		if (!target || typeof target.closest !== "function") return null;
		const item = target.closest(listElementSelector);
		return item && panel.contains(item) ? item : null;
	}

	function isInsideRect(x, y, rect) {
		return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
	}

	function getReusableDragGhost() {
		const state = makeListItemsDraggable._state;

		if (state.dragGhost) return state.dragGhost;

		const ghost = document.createElement("li");
		ghost.className = "list-group-item bg-dark text-white d-flex flex-row align-items-center";
		ghost.style.position = "fixed";
		ghost.style.left = "0";
		ghost.style.top = "0";
		ghost.style.zIndex = "1000";
		ghost.style.pointerEvents = "none";
		ghost.style.display = "none";
		ghost.style.opacity = "0.85";
		ghost.style.cursor = "grabbing";
		ghost.style.willChange = "transform";
		ghost.style.minWidth = "180px";
		ghost.style.maxWidth = "280px";
		ghost.style.boxSizing = "border-box";

		document.body.appendChild(ghost);
		state.dragGhost = ghost;

		return ghost;
	}

	function setupGhostFromItem(item, rect) {
		const ghost = getReusableDragGhost();
		const {
			urlContent = "",
			contentType = "",
			nameContent = "",
			descriptionContent = "",
		} = item.dataset;

		ghost.dataset.urlContent = urlContent;
		ghost.dataset.contentType = contentType;
		ghost.dataset.nameContent = nameContent;
		ghost.dataset.descriptionContent = descriptionContent;

		ghost.textContent = nameContent || "Elemento";
		ghost.classList.replace("d-none", "d-flex");
		ghost.style.width = rect.width + "px";
		ghost.style.height = rect.height + "px";

		return ghost;
	}

	function hideGhost() {
		const ghost = makeListItemsDraggable._state?.dragGhost;
		if (!ghost) return;

		ghost.innerHTML = "";
		ghost.classList.replace("d-flex", "d-none");
	}

	function moveGhost(clientX, clientY) {
		if (!drag.ghost) return;
		const x = clientX - drag.offsetX;
		const y = clientY - drag.offsetY;
		drag.ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
	}

	function raycastDropPoint(dropX, dropY) {
		const mouse = new THREE.Vector2();
		mouse.x = (dropX / window.innerWidth) * 2 - 1;
		mouse.y = -(dropY / window.innerHeight) * 2 + 1;

		ATON._rcScene.setFromCamera(mouse, ATON.Nav._camera);
		const intersectsScene = ATON._rcScene.intersectObjects(ATON.getRootScene().children);

		ATON._rcSemantics.setFromCamera(mouse, ATON.Nav._camera);
		const intersectsSemantics = ATON._rcSemantics.intersectObjects(
			ATON.getRootSemantics().children
		);

		const hitPoint = intersectsScene[0]?.point || intersectsSemantics[0]?.point || null;

		const dropPoint = hitPoint || getFallbackDropPoint(dropX, dropY);

		return {
			intersectsScene,
			intersectsSemantics,
			dropPoint,
		};
	}

	function getFallbackDropPoint(dropX, dropY) {
		const mouse = new THREE.Vector2(
			(dropX / window.innerWidth) * 2 - 1,
			-(dropY / window.innerHeight) * 2 + 1
		);

		ATON._rcScene.setFromCamera(mouse, ATON.Nav._camera);
		const ray = ATON._rcScene.ray;

		const point = new THREE.Vector3();

		// First attempt: intersection with a horizontal plane y = 0
		const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
		if (ray.intersectPlane(groundPlane, point)) {
			return point.clone();
		}

		// Final fallback: a point along the ray at a fixed distance from the camera
		return ray.at(4, point).clone();
	}

	function findWorkspaceItemAt(x, y) {
		const workspaceBody = document.getElementById("workspace-panel-body");
		if (!workspaceBody) return null;

		const hit = document
			.elementsFromPoint(x, y)
			.find((node) => node instanceof Element && workspaceBody.contains(node));

		return hit ? hit.closest("li") : null;
	}

	function onDragMove(e) {
		if (!drag.active) return;
		moveGhost(e.clientX, e.clientY);
	}

	function onDragEnd(e) {
		document.removeEventListener("pointermove", onDragMove);
		document.removeEventListener("pointerup", onDragEnd);
		document.removeEventListener("pointercancel", onDragEnd);

		if (!drag.active) return;

		const item = drag.item;
		if (item) item.style.cursor = "grab";

		const dropX = e.clientX;
		const dropY = e.clientY;

		const workspacePanel = document.querySelector("#workspace-panel");
		const rightPanel = document.querySelector("#right-panel");

		const isOverPanel = isInsideRect(dropX, dropY, panel.getBoundingClientRect());
		const isOverWorkspace = workspacePanel
			? isInsideRect(dropX, dropY, workspacePanel.getBoundingClientRect())
			: false;
		const isOverToolPanel = rightPanel
			? isInsideRect(dropX, dropY, rightPanel.getBoundingClientRect())
			: false;

		const contentUrl = item?.getAttribute("data-url-content");
		const contentType = item?.getAttribute("data-content-type");
		const contentName = item?.getAttribute("data-name-content");
		const contentDescription = item?.getAttribute("data-description-content");

		const { intersectsScene, intersectsSemantics, dropPoint } = raycastDropPoint(dropX, dropY);

		const hasRaycastHit = intersectsScene.length > 0 || intersectsSemantics.length > 0;
		const allowFallbackDrop =
			(contentType === ShelfNode.CONTENT_TYPE.MODEL_3D ||
				contentType === ShelfNode.CONTENT_TYPE.IMAGE) &&
			!!dropPoint;

		if (
			!isOverPanel &&
			!isOverWorkspace &&
			!isOverToolPanel &&
			(hasRaycastHit || allowFallbackDrop)
		) {
			addContentToScene(contentName, contentDescription, contentUrl, contentType, dropPoint);
		}

		if (isOverWorkspace) {
			Editor.state.currWorkspaceElement = findWorkspaceItemAt(dropX, dropY);

			if (Editor.state.currWorkspaceElement) {
				const wsElementType = Editor.state.currWorkspaceElement.getAttribute("data-bs-type");
				if (Heriverse.HeriverseGraph.stratigraphicTypes.includes(wsElementType)) {
					Editor.state.lastWorkspaceX = dropX;
					Editor.state.lastWorkspaceY = dropY;
					Editor.state.closedSRModal = false;
					Editor.state.addFromScene = false;
					bsModal?.show();
				}
			}
		}

		hideGhost();
		drag.ghost = null;
		drag.active = false;
		drag.item = null;
	}

	function onPanelPointerDown(e) {
		const item = getItem(e.target);
		if (!item) return;

		e.preventDefault();
		hidePreview();

		Editor.state.currShelfElement = item;
		item.style.cursor = "grabbing";

		const rect = item.getBoundingClientRect();
		drag.active = true;
		drag.item = item;
		drag.offsetX = e.clientX - rect.left;
		drag.offsetY = e.clientY - rect.top;
		drag.ghost = setupGhostFromItem(item, rect);

		moveGhost(e.clientX, e.clientY);

		document.addEventListener("pointermove", onDragMove);
		document.addEventListener("pointerup", onDragEnd);
		document.addEventListener("pointercancel", onDragEnd);
	}

	function positionPreview(clientX, clientY) {
		if (!preview.box || preview.box.style.display === "none") return;

		const offsetX = 12;
		const offsetY = 12;
		const margin = 5;
		const rect = preview.box.getBoundingClientRect();

		let x = clientX + offsetX;
		let y = clientY + offsetY;

		if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - margin;
		if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - margin;
		if (x < margin) x = margin;
		if (y < margin) y = margin;

		preview.box.style.left = x + "px";
		preview.box.style.top = y + "px";
	}

	function ensurePreviewState() {
		if (state.preview) return state.preview;

		const box = document.createElement("div");
		box.className = "previewBox";
		box.style.position = "fixed";
		box.style.left = "0px";
		box.style.top = "0px";
		box.style.pointerEvents = "none";
		box.style.display = "none";
		box.style.zIndex = "1100";

		const img = document.createElement("img");
		img.className = "previewImg";
		img.style.display = "none";
		box.appendChild(img);

		document.body.appendChild(box);

		state.preview = {
			box,
			img,
			canvas: null,
			renderer: null,
			scene: null,
			camera: null,
			model: null,
			animId: 0,
			item: null,
			type: null,
			url: null,
			loadToken: 0,
		};

		return state.preview;
	}

	function ensure3DPreviewRuntime() {
		if (preview.renderer) return;

		const canvas = document.createElement("canvas");
		canvas.className = "previewCanvas";
		canvas.style.display = "none";
		preview.box.insertBefore(canvas, preview.img);

		preview.canvas = canvas;
		preview.renderer = new THREE.WebGLRenderer({
			canvas,
			alpha: false,
			antialias: true,
		});
		preview.renderer.setSize(200, 150, false);
		preview.renderer.setClearColor(0xdddddd);

		preview.scene = new THREE.Scene();

		const previewWidth = 200;
		const previewHeight = 150;
		const aspect = previewWidth / previewHeight;
		const frustumSize = 1.5;

		preview.camera = new THREE.OrthographicCamera(
			(-frustumSize * aspect) / 2,
			(frustumSize * aspect) / 2,
			frustumSize / 2,
			-frustumSize / 2,
			0.1,
			10
		);
		preview.camera.position.set(1, 1, 1);
		preview.camera.lookAt(0, 0, 0);
		preview.camera.updateProjectionMatrix();

		const previewLight = new THREE.DirectionalLight(0xffffff, 1);
		previewLight.position.set(1, 1, 1);
		preview.scene.add(previewLight);
		preview.scene.add(new THREE.AmbientLight(0x404040));
	}

	function clonePreviewScene(scene) {
		if (THREE.SkeletonUtils?.clone) {
			return THREE.SkeletonUtils.clone(scene);
		}
		return scene.clone(true);
	}

	function normalizePreviewModel(model) {
		const box = new THREE.Box3().setFromObject(model);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z) || 1;
		model.scale.multiplyScalar(1 / maxDim);

		box.setFromObject(model);
		const center = box.getCenter(new THREE.Vector3());
		model.position.sub(center);
		return model;
	}

	function clearPreviewModel() {
		if (preview.model && preview.scene) {
			preview.scene.remove(preview.model);
		}
		preview.model = null;
	}

	function stopPreviewAnimation() {
		if (preview.animId) {
			cancelAnimationFrame(preview.animId);
			preview.animId = 0;
		}
	}

	function startPreviewAnimation() {
		if (preview.animId || !preview.renderer || !preview.scene || !preview.camera) return;

		const renderLoop = () => {
			if (!preview.item || preview.type !== ShelfNode.CONTENT_TYPE.MODEL_3D) {
				preview.animId = 0;
				return;
			}

			preview.renderer.render(preview.scene, preview.camera);
			preview.animId = requestAnimationFrame(renderLoop);
		};

		preview.animId = requestAnimationFrame(renderLoop);
	}

	function loadPreviewModel(url) {
		if (!state.modelCache.has(url)) {
			state.modelCache.set(
				url,
				new Promise((resolve, reject) => {
					ATON._aLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
				})
			);
		}

		return state.modelCache
			.get(url)
			.then((scene) => normalizePreviewModel(clonePreviewScene(scene)));
	}

	function hidePreview() {
		preview.loadToken += 1;
		preview.item = null;
		preview.type = null;
		preview.url = null;
		preview.box.style.display = "none";
		preview.box.style.left = "0px";
		preview.box.style.top = "0px";
		preview.img.style.display = "none";
		preview.img.removeAttribute("src");

		if (preview.canvas) preview.canvas.style.display = "none";

		stopPreviewAnimation();
		clearPreviewModel();
	}

	function showPreview(item, e) {
		const contentType = item.getAttribute("data-content-type");
		const contentUrl = item.getAttribute("data-url-content");

		if (!contentUrl) {
			hidePreview();
			return;
		}

		preview.item = item;
		preview.type = contentType;
		preview.url = contentUrl;
		preview.box.style.display = "block";

		if (contentType === ShelfNode.CONTENT_TYPE.IMAGE) {
			stopPreviewAnimation();
			clearPreviewModel();
			if (preview.canvas) preview.canvas.style.display = "none";
			preview.img.style.display = "block";
			preview.img.src = contentUrl;
			positionPreview(e.clientX, e.clientY);
			return;
		}

		if (contentType === ShelfNode.CONTENT_TYPE.MODEL_3D) {
			ensure3DPreviewRuntime();
			preview.img.style.display = "none";
			preview.canvas.style.display = "block";
			clearPreviewModel();
			stopPreviewAnimation();
			positionPreview(e.clientX, e.clientY);

			const token = ++preview.loadToken;
			loadPreviewModel(contentUrl)
				.then((model) => {
					if (
						token !== preview.loadToken ||
						preview.item !== item ||
						preview.type !== ShelfNode.CONTENT_TYPE.MODEL_3D
					) {
						return;
					}

					preview.model = model;
					preview.scene.add(preview.model);
					startPreviewAnimation();
				})
				.catch(() => {
					if (token === preview.loadToken) hidePreview();
				});

			return;
		}

		hidePreview();
	}

	function onPanelPointerOver(e) {
		if (drag.active) return;

		const item = getItem(e.target);
		if (!item) return;

		const relatedItem = getItem(e.relatedTarget);
		if (relatedItem === item) return;

		showPreview(item, e);
	}

	function onPanelPointerMove(e) {
		if (!preview.item || drag.active) return;
		positionPreview(e.clientX, e.clientY);
	}

	function onPanelPointerOut(e) {
		const item = getItem(e.target);
		if (!item || preview.item !== item) return;

		const relatedItem = getItem(e.relatedTarget);
		if (relatedItem === item) return;

		hidePreview();
	}

	panel.addEventListener("pointerdown", onPanelPointerDown);
	panel.addEventListener("pointerover", onPanelPointerOver);
	panel.addEventListener("pointermove", onPanelPointerMove);
	panel.addEventListener("pointerout", onPanelPointerOut);
}

export function populateShelfPanel() {
	if (
		!Heriverse ||
		!Heriverse.ShelfGraph ||
		Object.values(Heriverse.ShelfGraph.linksByUrlType).length <= 0
	)
		return;
	if (Heriverse.ShelfGraph && Heriverse.ShelfGraph.linksByUrlType) {
		let elemsByUrlType = Heriverse.ShelfGraph.linksByUrlType;
		let all_links_panel = document.querySelector("#shelf-panel-all-links-list ul");
		let model_links_panel = document.querySelector("#shelf-panel-3D-links-list ul");
		let img_links_panel = document.querySelector("#shelf-panel-img-links-list ul");
		let doc_links_panel = document.querySelector("#shelf-panel-doc-links-list ul");

		all_links_panel.innerHTML = "";
		model_links_panel.innerHTML = "";
		img_links_panel.innerHTML = "";
		doc_links_panel.innerHTML = "";

		Object.keys(elemsByUrlType).forEach((urlType) => {
			let elements = elemsByUrlType[urlType];
			Object.keys(elements).forEach((elemId) => {
				let element = elements[elemId];
				let panelElement = Editor.EditorUI.createShelfPanelElement(
					element.name,
					element.description,
					element.data.url,
					urlType
				);
				all_links_panel.innerHTML += panelElement;
				switch (urlType) {
					case "3d_model":
						model_links_panel.innerHTML += panelElement;
						break;
					case "image":
						img_links_panel.innerHTML += panelElement;
						break;
					case "document":
						doc_links_panel.innerHTML += panelElement;
						break;
				}
			});
		});
	}
	$(document).ready(() => {
		makeListItemsDraggable("#shelf-panel", ".shelf-panel-element");
	});
}

function onControllerEvent(e) {
	const controller = e.target;

	if (controller.userData.active === false) return;

	Editor.gizmo.controlInstance.getRaycaster().setFromXRController(controller);

	if (e.type === "selectstart") {
		Editor.gizmo.controlInstance.pointerDown(null);
	} else if (e.type === "selectend") {
		Editor.gizmo.controlInstance.pointerUp(null);
	} else if (e.type === "move") {
		Editor.gizmo.controlInstance.pointerHover(null);
		Editor.gizmo.controlInstance.pointerMove(null);
	} else if (e.type === "squeezestart") {
		const hits = ATON._rcScene.intersectObjects(Editor.shelf_objects_in_scene, true);
		if (hits.length > 0) {
			Editor.gizmo.cycleGizmoMode();
		}
	}
}

function addContentToScene(
	content_name,
	content_description,
	url_content,
	type_content,
	position_drop
) {
	if (type_content === ShelfNode.CONTENT_TYPE.DOCUMENT) {
		alert(
			"I documenti non possono essere aggiunti alla scena. Per aggiungerlo è sufficiente trascinarlo nel Workspace, sulla riga dell'unità stratigrafica desiderata."
		);
		return;
	}

	if (Editor.shelf_objects_in_scene.find((node) => node.name === content_name)) {
		alert("Oggetto già aggiunto in scena.");
		document.querySelector("body > li.list-group-item")?.remove();

		const newTarget = Editor.shelf_objects_in_scene.find((node) => node.name === content_name);
		Editor.setSelectedNode(newTarget);

		return;
	}
	let scene_node = ATON.createSceneNode();

	if (type_content === ShelfNode.CONTENT_TYPE.MODEL_3D) {
		scene_node.load(url_content, () => {
			const box = new THREE.Box3().setFromObject(scene_node.children[0]);
			const center = new THREE.Vector3();
			box.getCenter(center);
			const size = new THREE.Vector3();
			box.getSize(size);

			scene_node.position.copy(position_drop);
			scene_node.position.y += (center.y || size.y) + 0.05;

			scene_node.attachTo(Heriverse.currTemporalFilter.id);

			scene_node.name = content_name;

			scene_node.userData.addedToScene = true;
			scene_node.userData.addedToGraph = false;
			scene_node.userData.urlContent = url_content;
			scene_node.userData.contType = type_content;
			scene_node.userData.contName = content_name;
			scene_node.userData.contDescription = content_description;

			scene_node.updateMatrix();
			scene_node.updateMatrixWorld(true);
			ATON._mainRoot.updateMatrixWorld(true);

			ATON.Utils.updatePickGraph(scene_node, scene_node.type);

			Editor.shelf_objects_in_scene.push(scene_node);

			const objectDataNOIS = {
				objectName: scene_node.name,
				objectType: scene_node.type,
				objectUserData: scene_node.userData,
				position: scene_node.position.clone(),
				rotation: scene_node.rotation.clone(),
				scale: scene_node.scale.clone(),
			};

			const dataNOIS = {
				event: HeriverseEvents.Events.NEW_OBJECT_IN_SCENE,
				object: objectDataNOIS,
			};

			ATON.fireEvent(HeriverseEvents.Events.PHOTON_EVENT, dataNOIS);

			Editor.setupGizmoListeners();

			ATON._renderer.xr.getController(0).addEventListener("squeezestart", onControllerEvent);
			ATON._renderer.xr.getController(1).addEventListener("move", onControllerEvent);
			ATON._renderer.xr.getController(0).addEventListener("selectstart", onControllerEvent);
			ATON._renderer.xr.getController(0).addEventListener("selectend", onControllerEvent);

			updateInScenePanel();
		});
	} else if (type_content === ShelfNode.CONTENT_TYPE.IMAGE) {
		ATON.Utils.loadTexture(url_content, (texture) => {
			// INSERIRE QUI CREAZIONE DEL MODELLO DA METTERE IN SCENA CON L'IMMAGINE
			const aspect =
				texture.image?.width && texture.image?.height
					? texture.image?.width / texture.image?.height
					: 1;

			const planeHeight = 1.0;
			const planeWidth = planeHeight * aspect;

			texture.colorSpace = ATON._stdEncoding;
			texture.anisotropy = ATON.device.isMobile ? 0 : ATON._maxAnisotropy;
			texture.needsUpdate = true;

			const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
			const material = new THREE.MeshBasicMaterial({
				map: texture,
				transparent: true,
				side: THREE.DoubleSide,
			});

			const planeMesh = new THREE.Mesh(geometry, material);

			scene_node.add(planeMesh);

			const box = new THREE.Box3().setFromObject(scene_node.children[0]);
			const center = new THREE.Vector3();
			box.getCenter(center);
			const size = new THREE.Vector3();
			box.getSize(size);

			scene_node.position.copy(position_drop);
			scene_node.position.y += (center.y || size.y) + 0.05;

			scene_node.attachTo(Heriverse.currTemporalFilter.id);

			scene_node.name = content_name;

			scene_node.userData.addedToScene = true;
			scene_node.userData.addedToGraph = false;
			scene_node.userData.urlContent = url_content;
			scene_node.userData.contType = type_content;
			scene_node.userData.contName = content_name;
			scene_node.userData.contDescription = content_description;

			scene_node.updateMatrix();
			scene_node.updateMatrixWorld(true);
			ATON._mainRoot.updateMatrixWorld(true);

			ATON.Utils.updatePickGraph(scene_node, scene_node.type);

			Editor.shelf_objects_in_scene.push(scene_node);

			const objectDataNOIS = {
				objectName: scene_node.name,
				objectType: scene_node.type,
				objectUserData: scene_node.userData,
				position: scene_node.position.clone(),
				rotation: scene_node.rotation.clone(),
				scale: scene_node.scale.clone(),
			};

			const dataNOIS = {
				event: HeriverseEvents.Events.NEW_OBJECT_IN_SCENE,
				object: objectDataNOIS,
			};

			ATON.fireEvent(HeriverseEvents.Events.PHOTON_EVENT, dataNOIS);

			Editor.setupGizmoListeners();

			ATON._renderer.xr.getController(0).addEventListener("squeezestart", onControllerEvent);
			ATON._renderer.xr.getController(1).addEventListener("move", onControllerEvent);
			ATON._renderer.xr.getController(0).addEventListener("selectstart", onControllerEvent);
			ATON._renderer.xr.getController(0).addEventListener("selectend", onControllerEvent);

			updateInScenePanel();
		});
	}
}

export function updateInScenePanel() {
	if (!Editor.shelf_objects_in_scene || !Editor.shelf_objects_in_scene.length) return;

	let in_scene_panel = document.querySelector("#shelf-panel-in-scene-list ul");
	if (!in_scene_panel) return;

	in_scene_panel.innerHTML = "";

	Editor.shelf_objects_in_scene.forEach((node) => {
		let panelElement = Editor.EditorUI.createInScenePanelElement(node, {
			onRemove: removeInSceneFromScene,
			onAddToGraph: addInSceneToGraph,
		});
		in_scene_panel.appendChild(panelElement);
	});

	switchToInSceneSection();

	ATON.fire(HeriverseEvents.Events.UPDATE_TEXTS);
}

function switchToInSceneSection() {
	let shelfPanel = document.querySelector("#shelf-panel");
	if (!shelfPanel) return;

	let shelfInSceneTab = shelfPanel.querySelector(
		"#shelf-panel-tabbar #shelf-panel-in-scene button"
	);
	if (!shelfInSceneTab) return;
	if ($(shelfInSceneTab).hasClass("active")) return;

	shelfInSceneTab.click();
}

function removeInSceneFromScene(e) {
	let relativeEntry = e.target.closest(".in-scene-panel-element");
	let relativeNode = Editor.shelf_objects_in_scene.find(
		(n) => n.uuid === relativeEntry.dataset.nodeId
	);

	if (!relativeNode) {
		alert("Nodo non esistente");
		return;
	}

	if (relativeNode.userData.addedToGraph)
		alert(
			"Impossibile rimuovere l'elemento dalla scena poiché aggiunto al grafo. Rimuovere dal grafo prima di procedere con la rimozione dalla scena."
		);
	else if (confirm("Vuoi rimuovere l'elemento selezionato dalla scena?")) {
		relativeNode.userData.addedToScene = false;

		Editor.gizmo.controlInstance.detach();

		let elemIndex = Editor.shelf_objects_in_scene.indexOf(relativeNode);
		if (elemIndex >= 0) {
			Editor.shelf_objects_in_scene.splice(elemIndex, 1);
			relativeNode.parent.removeChild(relativeNode);

			const dataROFS = {
				event: HeriverseEvents.Events.REMOVE_OBJECT_FROM_SCENE,
				object: relativeNode,
			};
			ATON.fireEvent(HeriverseEvents.Events.PHOTON_EVENT, dataROFS);

			if (relativeNode === Editor.state.currSelectedNode) {
				Editor.setSelectedNode(null);
			}
		}

		relativeEntry.remove();
	}
}

function addInSceneToGraph(e) {
	if (confirm("Vuoi aggiungere l'elemento al grafo?")) {
		let relativeEntry = e.target.closest(".in-scene-panel-element");
		Editor.state.addFromScene = true;
		Editor.state.currShelfElement = relativeEntry;

		let respectiveNode = Editor.shelf_objects_in_scene.find(
			(n) => n.uuid === relativeEntry.dataset.nodeId
		);

		if (Editor.state.currSelectedNode && respectiveNode !== Editor.state.currSelectedNode) {
			Editor.state.legalSelectedNode = Editor.state.currSelectedNode;
		}

		Editor.state.currSelectedNode = respectiveNode;

		$("#insertShelfResourceModal").modal("show");
	}
}
