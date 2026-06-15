/*
    Heriverse CNR WebApp
    EditorUI component
    
    authors: 3DResearch s.r.l.

================================================================*/
let EditorUI = {};

const editorUIHandlers = {};

EditorUI.setHandlers = (handlers = {}) => {
	Object.assign(editorUIHandlers, handlers);
};

function getInputValue(id, fallback = "") {
	return document.getElementById(id)?.value || fallback;
}

function getInputFiles(id) {
	return document.getElementById(id)?.files || [];
}

function getHandlerValue(handlerName, fallback = []) {
	const handler = editorUIHandlers[handlerName];

	if (typeof handler !== "function") {
		console.warn(`EditorUI handler "${handlerName}" not registered.`);
		return fallback;
	}

	return handler();
}

function bindCreateNodeModalSubmit(handlerName, getValues, ...args) {
	const saveButton = document.getElementById("createNodeModalSaveButton");

	saveButton.onclick = () => {
		const handler = editorUIHandlers[handlerName];

		if (typeof handler !== "function") {
			console.warn("EditorUI handler " + handlerName + " not registered.");
			return;
		}

		handler(getValues(), ...args);
	};
}

EditorUI.selectAllShapes = (checked) => {
	const modal = document.getElementById("semanticShapeDownloadModal");
	const checkboxes = modal.querySelectorAll(".semShapeCheckbox:not(.selectAllSemanticCheck)");

	checkboxes.forEach((checkbox) => {
		checkbox.checked = checked;
	});
};

EditorUI.selectSemShape = () => {
	const modal = document.getElementById("semanticShapeDownloadModal");
	const selectAllCheckbox = modal.querySelector(".selectAllSemanticCheck");
	const checkboxes = modal.querySelectorAll(".semShapeCheckbox:not(.selectAllSemanticCheck)");

	if (!selectAllCheckbox) return;

	selectAllCheckbox.checked =
		checkboxes.length && Array.from(checkboxes).every((checkbox) => checkbox.checked);
};

EditorUI.getSelectedSemanticShapeIds = () => {
	const modal = document.getElementById("semanticShapeDownloadModal");
	const checkboxes = modal.querySelectorAll(
		".semShapeCheckbox:not(.selectAllSemanticCheck):checked"
	);

	return Array.from(checkboxes).map((checkbox) => checkbox.dataset.id);
};

EditorUI.showExportSemanticShapeModal = (semanticShapes = []) => {
	const modal = document.getElementById("semanticShapeDownloadModal");
	const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
	const modalBody = modal.querySelector(".modal-body");

	let html = `<ul class="list-group">`;
	html += `<li class="list-group-item"><input class="selectAllSemanticCheck semShapeCheckbox" type="checkbox" /> Seleziona tutto </li>`;
	semanticShapes.forEach((shape) => {
		html += `<li class="list-group-item"><input class="semShapeCheckbox" type="checkbox" data-id="${shape.id}" data-name="${shape.name}"/> ${shape.name}</li>`;
	});
	html += "</ul>";

	modalBody.innerHTML = html;

	$(document)
		.off("change", ".selectAllSemanticCheck")
		.on("change", ".selectAllSemanticCheck", (e) => {
			EditorUI.selectAllShapes(e.target.checked);
		});
	$(document)
		.off("change", ".semShapeCheckbox:not(.selectAllSemanticCheck)")
		.on("change", ".semShapeCheckbox:not(.selectAllSemanticCheck)", () => {
			EditorUI.selectSemShape();
		});

	$(document)
		.off("click", "#exportSSBtn")
		.on("click", "#exportSSBtn", () => {
			const handler = editorUIHandlers.finalizeExportSemShape;

			if (typeof handler !== "function") {
				console.warn('EditorUI handler "finalizeExportSemShape" not registered.');
				return;
			}

			handler(EditorUI.getSelectedSemanticShapeIds());

			const modal = document.getElementById("semanticShapeDownloadModal");
			const bsModal = bootstrap.Modal.getOrCreateInstance(modal);

			bsModal.hide();
		});

	bsModal.show();
};

EditorUI.setupShelfResManageButtons = () => {
	const saveButton = document.getElementById("saveGraphState");
	const exportGraphButton = document.getElementById("exportGraphState");
	const exportSemShapeButton = document.getElementById("exportSemanticShape");

	if (saveButton) {
		saveButton.addEventListener("click", () => {
			if (!confirm("Vuoi salvare le modifiche sul grafo?")) return;

			const handler = editorUIHandlers.saveGraphState;

			if (typeof handler !== "function") {
				console.warn('EditorUI handler "saveGraphState" not registered.');
				return;
			}

			$("#idLoader").show();
			handler();
			$("#idLoader").hide();
		});
	}
	if (exportGraphButton) {
		exportGraphButton.addEventListener("click", () => {
			const handler = editorUIHandlers.exportGraphState;

			if (typeof handler !== "function") {
				console.warn('EditorUI handler "exportGraphState" not registered.');
				return;
			}

			handler();
		});
	}
	if (exportSemShapeButton) {
		exportSemShapeButton.addEventListener("click", () => {
			const handler = editorUIHandlers.exportSemShape;

			if (typeof handler !== "function") {
				console.warn('EditorUI handler "exportSemShape" not registered.');
				return;
			}

			handler();
		});
	}
};

EditorUI.getCreateGraphFormValues = () => {
	const handler = editorUIHandlers.getCurrentGraphDefaults;

	const defaults =
		typeof handler === "function" ? handler() : { license: "", authors: [], embargo_until: "" };

	const authors = getInputValue("createNewGraphAuthors")
		.split(",")
		.map((author) => author.trim())
		.filter(Boolean);

	return {
		id: crypto.randomUUID(),
		name: getInputValue("createNewGraphName", ""),
		description: getInputValue("createNewGraphDescription", ""),
		license: getInputValue("createNewGraphLicense", defaults.license),
		authors: authors.length ? authors : defaults.authors,
		embargo: getInputValue("createNewGraphEmbargo", defaults.embargo_until),
		panoramaFiles: getInputFiles("createNewGraphPanorama"),
	};
};

EditorUI.saveGraph = () => {
	const newGraphModal = document.getElementById("createNewGraphModal");
	const bsModal = bootstrap.Modal.getOrCreateInstance(newGraphModal);

	bsModal.hide();

	const handler = editorUIHandlers.saveGraph;

	if (typeof handler !== "function") {
		console.warn('EditorUI handler "saveGraph" not registered.');
		return;
	}

	handler(EditorUI.getCreateGraphFormValues());
};

EditorUI.showEdgeModal = () => {
	let edgetypeselect = document.getElementById("edgetypes");

	if (!edgetypeselect) return;

	edgetypeselect.options.length = 0;

	const edgeTypes = getHandlerValue("getAvailableEdgeTypes", []);

	if (!edgeTypes || !edgeTypes.length) return;

	edgeTypes.forEach(({ value, label }) => {
		const relation = value;

		const option = document.createElement("option");

		option.value = relation;
		option.textContent = label;

		edgetypeselect.append(option);
	});

	populateEdgeNodeSelectors(getSelectedEdgeType());

	$(".select2_new_edge").select2({
		dropdownParent: $("#createEdgeModal"),
		width: "100%",
	});

	$("#edgetypes")
		.off("change", setupNewEdgeNodesSelectors)
		.on("change", setupNewEdgeNodesSelectors);

	$("#createEdgeModal").modal("show");
};

EditorUI.getEdgeFormValues = () => {
	return {
		from_id: getInputValue("new-edge-from"),
		to_id: getInputValue("new-edge-to"),
		type: getInputValue("edgetypes"),
	};
};

EditorUI.saveEdge = () => {
	const handler = editorUIHandlers.saveEdge;

	if (typeof handler !== "function") {
		console.warn('EditorUI handler "saveEdge" not registered.');
		return;
	}

	handler(EditorUI.getEdgeFormValues());

	const edgeModal = document.getElementById("createEdgeModal");
	const bsModal = bootstrap.Modal.getOrCreateInstance(edgeModal);
	bsModal.hide();
};

function clearSelectOptions(selectElement) {
	if (!selectElement) return;

	selectElement.options.length = 0;
}

function appendNodeOption(selectElement, node) {
	if (!selectElement || !node) return;

	const option = document.createElement("option");

	option.value = node.id;
	option.textContent = node.name;

	selectElement.append(option);
}

function populateEdgeNodeSelectors(edgeType) {
	const fromSelect = document.getElementById("new-edge-from");
	const toSelect = document.getElementById("new-edge-to");

	clearSelectOptions(fromSelect);
	clearSelectOptions(toSelect);

	if (!edgeType) return;

	const handler = editorUIHandlers.getEdgeCompatibilityOptions;

	if (!handler || typeof handler !== "function") return;

	const { sourceNodes = [], targetNodes = [] } = handler(edgeType);

	sourceNodes.forEach((node) => appendNodeOption(fromSelect, node));
	targetNodes.forEach((node) => appendNodeOption(toSelect, node));
}

function getSelectedEdgeType() {
	return document.getElementById("edgetypes")?.value;
}

function setupNewEdgeNodesSelectors(e) {
	const edgeType = e?.target?.value || getSelectedEdgeType();

	populateEdgeNodeSelectors(edgeType);
}

EditorUI.showEpochModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(
		inputGroup,
		"name_epoch",
		"Nome epoca",
		"Inserisci il nome dell'epoca",
		"text"
	);
	EditorUI.createInput(
		inputGroup,
		"description_epoch",
		"Descrizione epoca",
		"Inserisci la descrizione dell'epoca",
		"text"
	);
	EditorUI.createInput(
		inputGroup,
		"start_time_epoch",
		"Data inizio epoca",
		"Inserisci la data di inizio dell'eopca",
		"text"
	);
	EditorUI.createInput(
		inputGroup,
		"end_time_epoch",
		"Data fine epoca",
		"Inserisci la data di fine dell'epoca",
		"text"
	);
	EditorUI.createInput(
		inputGroup,
		"color_epoch",
		"Colore epoca",
		"Inserisci il colore dell'epoca",
		"color"
	);
	EditorUI.createInput(
		inputGroup,
		"min_y_epoch",
		"Min Y epoca",
		"Inserisci min_y dell'epoca",
		"text"
	);
	EditorUI.createInput(
		inputGroup,
		"max_y_epoch",
		"Max y epoca",
		"Inserisci max_y dell'epoca",
		"text"
	);
	bindCreateNodeModalSubmit("saveEpoch", EditorUI.getEpochFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getEpochFormValues = () => {
	return {
		id: null,
		name: getInputValue("name_epoch"),
		description: getInputValue("description_epoch"),
		start_time: getInputValue("start_time_epoch"),
		end_time: getInputValue("end_time_epoch"),
		color: getInputValue("color_epoch"),
		min_y: getInputValue("min_y_epoch"),
		max_y: getInputValue("max_y_epoch"),
	};
};

EditorUI.showDocumentModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "docName", "Nome", "Inserisci il nome del documento", "text");
	EditorUI.createInput(
		inputGroup,
		"docDescription",
		"Descrizione",
		"Inserisci la descrizione del documento",
		"text"
	);
	EditorUI.createFileInput(inputGroup, "docUrl", "File documento", "Url esterno");

	bindCreateNodeModalSubmit("saveDocumentShelf", EditorUI.getDocumentShelfFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getDocumentShelfFormValues = () => {
	return {
		id: null,
		name: getInputValue("docName"),
		description: getInputValue("docDescription"),
		url: getInputValue("docUrl"),
		files: getInputFiles("docUrl_file"),
	};
};

EditorUI.showImageModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "imgName", "Nome", "Inserisci il nome dell'immagine", "text");
	EditorUI.createInput(
		inputGroup,
		"imgDescription",
		"Descrizione",
		"Inserisci la descrizione dell'immagine",
		"text"
	);
	EditorUI.createFileInput(inputGroup, "imgUrl", "File immagine", "Url esterno");

	bindCreateNodeModalSubmit("saveImageShelf", EditorUI.getImageShelfFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getImageShelfFormValues = () => {
	return {
		id: null,
		name: getInputValue("imgName"),
		description: getInputValue("imgDescription"),
		url: getInputValue("imgUrl"),
		files: getInputFiles("imgUrl_file"),
	};
};

EditorUI.showRepresentationModelModal = (shelf = false) => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "name_node", "Nome", "Inserisci il nome dell'epoca", "text");
	EditorUI.createInput(
		inputGroup,
		"description_node",
		"Descrizione",
		"Inserisci la descrizione",
		"text"
	);
	EditorUI.createFileInput(inputGroup, "url", "File 3D", "Url esterno");

	bindCreateNodeModalSubmit(
		"saveRepresentationModel",
		EditorUI.getRepresentationModelFormValues,
		shelf
	);
	$("#createNodeModal").modal("show");
};

EditorUI.getRepresentationModelFormValues = () => {
	return {
		id: null,
		name: getInputValue("name_node"),
		description: getInputValue("description_node"),
		url: getInputValue("url"),
		files: getInputFiles("url_file"),
	};
};

EditorUI.showAuthorModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "name_node", "Nome", "Inserisci il nome del nodo", "text");
	EditorUI.createInput(
		inputGroup,
		"description_node",
		"Descrizione",
		"Inserisci la descrizione",
		"text"
	);
	EditorUI.createInput(inputGroup, "orcid", "ORCID", "Inserisci ORCID", "text");
	EditorUI.createInput(
		inputGroup,
		"author_name",
		"Nome autore",
		"Inserisci il nome dell'autore",
		"text"
	);
	EditorUI.createInput(
		inputGroup,
		"author_surname",
		"Cognome autore",
		"Inserisci il cognome dell'autore",
		"text"
	);

	bindCreateNodeModalSubmit("saveAuthor", EditorUI.getAuthorFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getAuthorFormValues = () => {
	return {
		id: null,
		name: getInputValue("name_node"),
		description: getInputValue("description_node"),
		orcid: getInputValue("orcid"),
		author_name: getInputValue("author_name"),
		author_surname: getInputValue("author_surname"),
	};
};

EditorUI.showLinkModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "name_node", "Nome", "Inserisci il nome del nodo", "text");
	EditorUI.createInput(
		inputGroup,
		"description_node",
		"Descrizione",
		"Inserisci la descrizione",
		"text"
	);
	EditorUI.createInput(inputGroup, "url", "URL", "Inserisci ORCID", "text");
	let link_options = ["External link"];
	EditorUI.createSelect(inputGroup, "url_type", "Tipo link", link_options);
	EditorUI.createInput(
		inputGroup,
		"description_link",
		"Descrizione link",
		"Inserisci la descrizione del link",
		"text"
	);

	bindCreateNodeModalSubmit("saveLink", EditorUI.getLinkFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getLinkFormValues = () => {
	return {
		id: null,
		name: getInputValue("name_node"),
		description: getInputValue("description_node"),
		url: getInputValue("url"),
		url_type: getInputValue("url_type"),
		description_link: getInputValue("description_link"),
	};
};

EditorUI.showSemanticShapeModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "name_node", "Nome", "Inserisci il nome del nodo", "text");
	EditorUI.createInput(
		inputGroup,
		"description_node",
		"Descrizione",
		"Inserisci la descrizione",
		"text"
	);
	EditorUI.createInput(inputGroup, "url", "URL", "Inserisci ORCID", "text");

	bindCreateNodeModalSubmit("saveSemanticShape", EditorUI.getSemanticShapeFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getSemanticShapeFormValues = () => {
	return {
		id: null,
		name: getInputValue("name_node"),
		description: getInputValue("description_node"),
		url: getInputValue("url"),
	};
};

EditorUI.showStratigraphicNodeModal = () => {
	let inputGroup = document.getElementById("inputgroup");
	inputGroup.innerHTML = "";
	EditorUI.createInput(inputGroup, "name_node", "Nome", "Inserisci il nome del nodo", "text");
	EditorUI.createInput(
		inputGroup,
		"description_node",
		"Descrizione",
		"Inserisci la descrizione",
		"text"
	);
	EditorUI.createSelect(
		inputGroup,
		"stratigraphic_type",
		"Tipo",
		getHandlerValue("getStratigraphicNodeTypes")
	);

	bindCreateNodeModalSubmit("saveStratigraphicNode", EditorUI.getStratigraphicNodeFormValues);
	$("#createNodeModal").modal("show");
};

EditorUI.getStratigraphicNodeFormValues = () => {
	return {
		id: null,
		name: getInputValue("name_node"),
		description: getInputValue("description_node"),
		type: getInputValue("stratigraphic_type"),
	};
};

EditorUI.createSelect = (container, id, label, options) => {
	let select = document.createElement("select");
	select.id = id;
	select.className = "form-control";
	const labelElement = document.createElement("label");
	labelElement.setAttribute("for", id);
	labelElement.textContent = label;
	labelElement.classList.add("form-label");

	for (let i = 0; i < options.length; i++) {
		let opt = document.createElement("option");
		opt.value = options[i];
		opt.textContent = options[i];
		select.appendChild(opt);
	}
	container.appendChild(labelElement);
	container.appendChild(select);
};

EditorUI.createInput = (container, id, label, hint, type) => {
	const input = document.createElement("input");
	input.id = id;
	input.name = id;
	input.type = type || "text";
	input.hint = hint;
	input.classList.add("form-control");
	const labelElement = document.createElement("label");
	labelElement.setAttribute("for", id);
	labelElement.textContent = label;
	labelElement.classList.add("form-label");
	container.appendChild(labelElement);
	container.appendChild(input);
};

EditorUI.createFileInput = (container, id, label, hint) => {
	//<label for="new-object-url" class="form-label">URL</label>
	//<input id="new-object-url" class="form-control" name="new-object-url" type="text" hint="URL modello">
	//<input id="new-object-file" class="form-control" name="new-object-file" type="file" multiple>
	const input = document.createElement("input");
	input.id = id;
	input.name = id;
	input.type = "text";
	input.hint = hint;
	input.classList.add("form-control");

	let inputFile = document.createElement("input");
	inputFile.id = id + "_file";
	inputFile.classList.add("form-control");
	inputFile.type = "file";
	inputFile.multiple = true;

	const labelElement = document.createElement("label");
	labelElement.setAttribute("for", id);
	labelElement.textContent = label;
	labelElement.classList.add("form-label");
	container.appendChild(labelElement);
	container.appendChild(input);
	container.appendChild(inputFile);
};

EditorUI.buildPropertyTypeSelector = (propertySchema) => {
	const propertyCRType = editorUIHandlers.getConnectionRuleNodeType("PROPERTY");

	let htmlContent = `<div id=${propertyCRType + "Info"} aria-labelledBy=${
		propertyCRType + "Info" + "Label"
	} class="d-flex align-items-center"><div class="dropdown-center dropdown" style="float: left"><button style="--selected-bg= #aaaaaa" class="btn selector-properties-type dropdown-toggle" type="button" id="propType-dropdownMenu" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> Select property type </button>`;

	let ul = `<ul class="dropdown-menu" style="overflow-y: scroll; height:150px">`;
	let ulContent = "";

	propertySchema["qualia_categories"].forEach((macroProperty) => {
		ulContent += `<p class="w-100" style="border-top: 2px solid black; border-bottom: 2px solid black">${macroProperty.name}</p>`;
		Object.entries(macroProperty.subcategories).forEach(([subCategoryId, subCategory]) => {
			subCategory.qualia.forEach((qualium) => {
				ulContent += `<li onclick="Editor.EditorUI.selectPropertyType(this)" id="${qualium.id}"> <p class="dropdown-item"> ${qualium.name}</p></li>`;
			});
		});
	});

	ulContent += "</ul>";
	ul += ulContent + "</div> <div id='propInput-section' style='float: left'></div></div>";
	htmlContent += ul;

	return htmlContent;
};

EditorUI.selectPropertyType = (listElement) => {
	const propertyTypeSelector = document.getElementById("propType-dropdownMenu");
	if (propertyTypeSelector) {
		propertyTypeSelector.innerHTML = $("#" + listElement.id).text();
	}

	const propertyCRType = editorUIHandlers.getConnectionRuleNodeType("PROPERTY");

	const propertyInputSection = document.getElementById("propInput-section");

	let elementComposition = "";

	const handler = editorUIHandlers.getPropertyQualiumById;

	const listObject = handler(listElement.id);

	if (!listObject) {
		return;
	}

	switch (listObject.data_type) {
		case "float":
			elementComposition +=
				"<input type='number' id='" +
				propertyCRType +
				"MeasureValue" +
				"'/>" +
				"<select id='" +
				propertyCRType +
				"MeasureUnit" +
				"'>";
			listObject.units.forEach((unit) => {
				elementComposition += "<option value='" + unit + "'>" + unit + "</option>";
			});
			elementComposition += "</select>";
			break;
		case "string":
		case "controlled_vocabulary_multiple":
		case "controlled_vocabulary":
			if (listObject.values && listObject.values.length > 0) {
				elementComposition += "<select id='" + propertyCRType + "ControlledValue'>";
				listObject.values.forEach((value) => {
					elementComposition += "<option value='" + value + "'>" + value + "</option>";
				});
				elementComposition += "</select>";
			} else {
				elementComposition += "<input type='text' id='" + propertyCRType + "Value' />";
			}
			break;
		case "percentage":
			elementComposition +=
				"<input type='number' id='" +
				propertyCRType +
				"Percentage' min='" +
				(listObject.range && listObject.range.length === 2 ? listObject.range[0] : 0) +
				"' max='" +
				(listObject.range && listObject.range.length === 2 ? listObject.range[1] : 100) +
				"'>";
			break;
		case "coordinates":
			if (
				listObject.coordinate_system &&
				listObject.coordinate_system.components &&
				listObject.coordinate_system.components.length > 0
			) {
				listObject.coordinate_system.components.forEach((component) => {
					elementComposition +=
						"<label id='" +
						propertyCRType +
						component.toUpperCase() +
						"Label' for='" +
						propertyCRType +
						component.toUpperCase() +
						"'>" +
						component +
						": </label>" +
						"<input type='number' id='" +
						propertyCRType +
						component.toUpperCase() +
						"'>";
				});
			}
			if (
				listObject.coordinate_system &&
				listObject.coordinate_system.units &&
				listObject.coordinate_system.units.length > 0
			) {
				elementComposition += "<select id='" + propertyCRType + "CoordinatesUnit" + "'>";
				listObject.coordinate_system.units.forEach((unit) => {
					elementComposition += "<option value='" + unit + "'>" + unit + "</option>";
				});
				elementComposition += "</select>";
			}
			break;
		case "angles":
			if (listObject.components && listObject.components.length > 0) {
				listObject.components.forEach((component) => {
					elementComposition +=
						"<label id='" +
						propertyCRType +
						component.toUpperCase() +
						"Label' for='" +
						propertyCRType +
						component.toUpperCase() +
						"'>" +
						component +
						": </label>" +
						"<input type='number' id='" +
						propertyCRType +
						component.toUpperCase() +
						"'>";
				});
			}
			if (listObject.units && listObject.units.length > 0) {
				elementComposition += "<select id='" + propertyCRType + "AngleUnit" + "'>";
				listObject.units.forEach((unit) => {
					elementComposition += "<option value='" + unit + "'>" + unit + "</option>";
				});
				elementComposition += "</select>";
			}
			break;
		case "date":
			elementComposition = "<input type='date' id='" + propertyCRType + "DateValue" + "'/>";
			break;
	}

	if (propertyInputSection) propertyInputSection.innerHTML = elementComposition;
};

EditorUI.createWorkspacePanelElement = (node, options = {}) => {
	const nodeVM = node;

	let classes = "list-group-item bg-dark text-white d-flex flex-row align-items-center";
	if (nodeVM.type === "semantic_shape") {
		classes += " workspace-sem-shape";
	} else if (nodeVM.isStratigraphic) {
		classes += " workspace-scene-node";
	}

	let item = `
				<li class="${classes}"
					data-bs-elementId="${nodeVM.id}"
					data-bs-type="${nodeVM.type}"
					data-stratigraphic="${nodeVM.isStratigraphic ? "1" : "0"}"
					data-bs-name="${nodeVM.name || ""}">
					<div class="me-3">
						<img src="${nodeVM.iconUrl}" onerror="this.src = '${nodeVM.fallbackIconUrl}';"
							 alt="Icona ${nodeVM.type}"
							 title="${nodeVM.name}"
							 class="workspace_entry_img">
					</div>
					<div class="flex-grow-1 me-3">
						<div class="fw-bold text-break workspace-element-text">
							${nodeVM.name}
			`;

	if (nodeVM.hasSemanticShape) {
		item += `
					<button style="cursor:pointer" type="button"
						class="badge rounded-pill bg-light text-dark p-1 mx-3 fs-5 semantic-shape-badge"
						data-ssid="${nodeVM.semanticShapeId}">
						<i class="fa-solid fa-cubes"></i>
					</button>
				`;
	}

	item += `</div></div>`;

	if (options && options.isEditor) {
		item += `
					<button style="cursor:pointer" type="button"
						class="badge rounded-pill p-2 mx-2 fs-6 bg-danger text-light workspace-remove-button">
						<i class="fa-solid fa-trash"></i>
					</button>
					<button style="cursor:pointer" type="button"
						class="badge rounded-pill p-2 mx-2 fs-6 bg-light text-dark workspace-edit-button">
						<i class="fa-solid fa-pen-to-square"></i>
					</button>
				`;
	}

	item += `</li>`;

	return item;
};

EditorUI.createShelfPanelElement = (elementName, elementDescription, elementUrl, urlType) => {
	let panelEntry =
		"<li class='list-group-item bg-dark text-white d-flex flex-row align-items-center shelf-panel-element' data-url-content='" +
		elementUrl +
		"' data-content-type='" +
		urlType +
		"' data-name-content='" +
		elementName +
		"' data-description-content='" +
		elementDescription +
		"'>";
	panelEntry += "<div class='me-3'>";
	switch (urlType) {
		case "3d_model":
			panelEntry += "<img src='../res/imgs/model_label.svg' alt='3D logo' class='shelf_entry_img'>";
			break;
		case "image":
			panelEntry +=
				"<img src='../res/imgs/img_label.svg' alt='Image logo' class='shelf_entry_img'>";
			break;
		case "document":
			panelEntry +=
				"<img src='../res/imgs/doc_label.svg' alt='Document logo' class='shelf_entry_img'>";
			break;
	}
	panelEntry += "</div>";
	panelEntry += "<div class='flex-grow-1 me-3'>";
	panelEntry += "<div class='fw-bold'>" + elementName + "</div>";
	panelEntry += "</div>";
	panelEntry += "<div>" + "<i class='fas fa-chevron-right text-light'>" + "</i>" + "</div>";
	panelEntry += "</li>";

	return panelEntry;
};

EditorUI.createInScenePanelElement = (object, actions) => {
	let panelEntry = document.createElement("li");
	panelEntry.className = "list-group-item d-flex align-items-center in-scene-panel-element";
	panelEntry.dataset.nodeId = object.uuid;
	panelEntry.dataset.urlContent = object.userData.urlContent;
	panelEntry.dataset.contentType = object.userData.contType;
	panelEntry.dataset.contentName = object.userData.contName;
	panelEntry.dataset.contentDescription = object.userData.contDescription;

	let panelEntryName = document.createElement("div");
	panelEntryName.className = "me-3 flex-grow-1 fw-bold";
	if (object.name) panelEntryName.textContent = object.name;
	else panelEntryName.textContent = "<No name>";

	let panelEntryBtnSection = document.createElement("div");
	panelEntryBtnSection.className = "d-flex gap-2 align-items-center";

	let removeFromSceneBtn = document.createElement("button");
	removeFromSceneBtn.className = "btn btn-danger in-scene-button";
	removeFromSceneBtn.type = "button";
	removeFromSceneBtn.dataset.i18nTooltip = "REMOVE_FROM_SCENE_LABEL";
	removeFromSceneBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

	let addToGraphBtn = document.createElement("button");
	addToGraphBtn.className = "btn btn-secondary in-scene-button";
	addToGraphBtn.type = "button";
	addToGraphBtn.dataset.i18nTooltip = "ADD_TO_GRAPH_LABEL";
	addToGraphBtn.innerHTML = '<i class="fa-solid fa-file-arrow-up"></i>';

	if (actions && actions.onRemove)
		$(removeFromSceneBtn).off("click", actions.onRemove).on("click", actions.onRemove);
	if (actions && actions.onAddToGraph)
		$(addToGraphBtn).off("click", actions.onAddToGraph).on("click", actions.onAddToGraph);

	panelEntryBtnSection.appendChild(removeFromSceneBtn);
	panelEntryBtnSection.appendChild(addToGraphBtn);

	panelEntry.appendChild(panelEntryName);
	panelEntry.appendChild(panelEntryBtnSection);
	return panelEntry;
};

EditorUI.updateSelectedNodeSection = (nodeName = "") => {
	let section = document.getElementById("selectedNodeInfoSection");
	if (!section) return;

	let nameSpan = document.getElementById("selectedNodeName");
	if (!nameSpan) return;

	if (!nodeName) {
		nameSpan.textContent = "";

		if ($(section).hasClass("d-block")) $(section).toggleClass("d-none d-block");

		return;
	}

	if (!$(section).hasClass("d-block")) $(section).toggleClass("d-none d-block");

	nameSpan.textContent = nodeName;
};

function parseTransformInputValue(rawValue) {
	if (rawValue === null || rawValue === undefined) return null;

	const normalized = String(rawValue).trim().replace(",", ".");
	if (normalized === "") return null;

	const n = Number(normalized);
	return Number.isFinite(n) ? n : null;
}

function setNumericInputValue(input, value, decimals = 4) {
	if (!input) return;

	if (!Number.isFinite(value)) {
		input.value = "";
		return;
	}

	input.value = String(Number(value.toFixed(decimals)));
}

function getTransformInputs() {
	return {
		position: {
			x: document.getElementById("tranPanPosX"),
			y: document.getElementById("tranPanPosY"),
			z: document.getElementById("tranPanPosZ"),
		},
		rotation: {
			x: document.getElementById("tranPanRotX"),
			y: document.getElementById("tranPanRotY"),
			z: document.getElementById("tranPanRotZ"),
		},
		scale: {
			x: document.getElementById("tranPanScaleX"),
			y: document.getElementById("tranPanScaleY"),
			z: document.getElementById("tranPanScaleZ"),
		},
	};
}

EditorUI.setupTransformationInputListeners = () => {
	const inputs = getTransformInputs();

	const bindTransformInput = (input, transformKey, axis) => {
		if (!input) return;

		$(input)
			.off("input.editorTransform")
			.on("input.editorTransform", (e) => {
				const value = parseTransformInputValue(e.target.value);
				if (value === null) return;

				const handler = editorUIHandlers.updateSelectedNodeTransform;

				if (typeof handler !== "function") {
					console.warn('EditorUI handler "updateSelectedNodeTransform" not registered.');
					return;
				}

				handler({
					transformKey,
					axis,
					value,
				});
			});
	};

	bindTransformInput(inputs.position.x, "position", "x");
	bindTransformInput(inputs.position.y, "position", "y");
	bindTransformInput(inputs.position.z, "position", "z");

	bindTransformInput(inputs.rotation.x, "rotation", "x");
	bindTransformInput(inputs.rotation.y, "rotation", "y");
	bindTransformInput(inputs.rotation.z, "rotation", "z");

	bindTransformInput(inputs.scale.x, "scale", "x");
	bindTransformInput(inputs.scale.y, "scale", "y");
	bindTransformInput(inputs.scale.z, "scale", "z");
};

EditorUI.updateTransformationInputs = (node) => {
	if (!node) return;

	const inputs = getTransformInputs();

	setNumericInputValue(inputs.position.x, node.position.x);
	setNumericInputValue(inputs.position.y, node.position.y);
	setNumericInputValue(inputs.position.z, node.position.z);

	setNumericInputValue(inputs.rotation.x, node.rotation.x);
	setNumericInputValue(inputs.rotation.y, node.rotation.y);
	setNumericInputValue(inputs.rotation.z, node.rotation.z);

	setNumericInputValue(inputs.scale.x, node.scale.x);
	setNumericInputValue(inputs.scale.y, node.scale.y);
	setNumericInputValue(inputs.scale.z, node.scale.z);
};

EditorUI.clearTransformationInputs = () => {
	const inputs = getTransformInputs();

	Object.values(inputs).forEach((group) => {
		Object.values(group).forEach((input) => {
			setNumericInputValue(input, Infinity);
		});
	});
};

EditorUI.showSavePeriodModal = ({ start = "", end = "" } = {}) => {
	const savePeriodModal = document.getElementById("savePeriodModal");

	savePeriodModal.dataset.periodId = "";

	if (start) savePeriodModal.querySelector("#savePeriodStart").value = start;
	if (end) savePeriodModal.querySelector("#savePeriodEnd").value = end;

	const bsModal = bootstrap.Modal.getOrCreateInstance(savePeriodModal);
	bsModal.show();
};

EditorUI.showEditPeriodModal = ({ id = "", name = "", start = "", end = "", color = "" } = {}) => {
	const savePeriodModal = document.getElementById("savePeriodModal");
	const bsModal = bootstrap.Modal.getOrCreateInstance(savePeriodModal);

	savePeriodModal.dataset.periodId = id;

	savePeriodModal.querySelector("#savePeriodName").value = name;
	savePeriodModal.querySelector("#savePeriodStart").value = start;
	savePeriodModal.querySelector("#savePeriodEnd").value = end;

	if (color) savePeriodModal.querySelector("#savePeriodColor").value = color;

	bsModal.show();
};

EditorUI.getPeriodFormValues = () => {
	const savePeriodModal = document.getElementById("savePeriodModal");

	return {
		id: savePeriodModal.dataset.periodId || null,
		name: savePeriodModal.querySelector("#savePeriodName")?.value ?? "",
		start: savePeriodModal.querySelector("#savePeriodStart")?.value ?? "",
		end: savePeriodModal.querySelector("#savePeriodEnd")?.value ?? "",
		color: savePeriodModal.querySelector("#savePeriodColor")?.value ?? "#000000",
	};
};

EditorUI.resetPeriodForm = () => {
	const savePeriodModal = document.getElementById("savePeriodModal");

	[...savePeriodModal.querySelectorAll("input[type='text']")].forEach((elem) => {
		elem.value = "";
	});

	[...savePeriodModal.querySelectorAll("input[type='color']")].forEach((elem) => {
		elem.value = "#000000";
	});
};

EditorUI.hideSavePeriodModal = () => {
	const savePeriodModal = document.getElementById("savePeriodModal");
	const bsModal = bootstrap.Modal.getOrCreateInstance(savePeriodModal);

	bsModal.hide();
};

EditorUI.savePeriod = () => {
	const handler = editorUIHandlers.savePeriod;

	handler(EditorUI.getPeriodFormValues());

	EditorUI.hideSavePeriodModal();
	EditorUI.resetPeriodForm();
};

EditorUI.getSemanticShapeDrawingElements = () => {
	return {
		startDrawButton: document.getElementById("startSemanticShapeDrawing"),
		finalizeDrawButton: document.getElementById("finalizeSemanticShapeDrawing"),
	};
};

EditorUI.setSemanticShapeDrawingUI = (active) => {
	const { startDrawButton, finalizeDrawButton } = EditorUI.getSemanticShapeDrawingElements();

	if (!startDrawButton || !finalizeDrawButton) return;

	finalizeDrawButton.disabled = !active;

	if (active) {
		startDrawButton.classList.add("active");
	} else {
		startDrawButton.classList.remove("active");
	}
};

EditorUI.isPointerInsideFinalizeSemanticShapeButton = (pointer) => {
	const { finalizeDrawButton } = EditorUI.getSemanticShapeDrawingElements();

	if (!finalizeDrawButton) return false;

	const buttonBox = finalizeDrawButton.getBoundingClientRect();

	return (
		pointer.x >= buttonBox.left &&
		pointer.x <= buttonBox.right &&
		pointer.y >= buttonBox.top &&
		pointer.y <= buttonBox.bottom
	);
};

export default EditorUI;
