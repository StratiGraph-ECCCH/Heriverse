import HeriverseNode from "../src/HeriverseGraph/HeriverseNode.js";
import HeriverseGraph from "../src/HeriverseGraph/HeriverseGraph.js";
import UI from "../src/ui.js";
import EditorUI from "./editorUI.js";

export function generateFieldHTML(field, lastFieldIndex = 0) {
	let html = `<label for="${field.id}${
		lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
	}" class="form-label fs-6 fw-bold w-100" id="${field.id}Label${
		lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
	}" data-i18n=${field.i18n_label}>${field.label}${field.required ? " *" : ""}</label>`;

	if (field.type === "select") {
		html += `<select class="form-select mb-4 ${
			field.id.includes("TypeSelect") || field.id.includes("Relate") ? "" : "existing-node-selector"
		}" ${
			field.id.includes("TypeSelect") || field.id.includes("Relate")
				? ""
				: 'onchange="Editor.manageOtherInputs"'
		} id="${field.id}${lastFieldIndex > 0 ? "-" + lastFieldIndex : ""}" aria-labelledby="${
			field.id
		}Label${lastFieldIndex > 0 ? "-" + lastFieldIndex : ""}" data-type="${field.element_type}">`;
		html += `<option value="" data-i18n="SELECT_AN_ELEMENT" selected>Seleziona un elemento...</option>`;
		if (field.options) field.options.forEach((o) => (html += `<option value="${o}">${o}</option>`));
		else if (field.element_type) {
			const elements = {};
			Heriverse.currentGraphs.forEach((graphId) => {
				const nodes =
					Heriverse.currMG.json.graphs[graphId].nodes[field.element_type] ||
					Heriverse.currMG.json.graphs[graphId].nodes.stratigraphic[field.element_type];

				if (nodes && Object.values(nodes).length) {
					Object.entries(nodes).forEach(([key, value]) => {
						elements[key] = value;
					});
				}
			});

			if (Object.values(elements).length) {
				if (field.element_type === HeriverseNode.TYPE.STRATIGRAPHIC) {
					Object.values(elements).forEach((sub_section) => {
						Object.entries(sub_section).forEach(([element_key, element_value]) => {
							let graph = Object.values(Heriverse.currMG.nodesByIndex).find((node) =>
								node.id.includes(element_key)
							).graph;
							// graph + "_" + element_key
							html += `<option data-id="${element_key}" data-type="${element_value.type}">${element_value.name}</option>`;
						});
					});
				} else {
					Object.entries(elements).forEach(([element_key, element_value]) => {
						let graph,
							heriNode =
								Heriverse.currMG.nodesByIndex && Object.values(Heriverse.currMG.nodesByIndex).length
									? Object.values(Heriverse.currMG.nodesByIndex).find((node) => {
											if (node) node.id.includes(element_key);
										})
									: null;
						if (heriNode) graph = heriNode.graph;
						else graph = Heriverse.currGraphId;
						// graph + "_" + element_key
						html += `<option data-id="${element_key}" data-type="${element_value.type}">${element_value.name}</option>`;
					});
				}
			}
		}
		html += `</select>`;
	} else if (field.type === "checklist") {
		const elements = field.values || [];
		if (!elements.length) {
			Heriverse.currentGraphs.forEach((graphId) => {
				const nodes =
					Heriverse.currMG.json.graphs[graphId].nodes[field.checklist_type] ||
					Heriverse.currMG.json.graphs[graphId].nodes.stratigraphic[field.checklist_type];

				if (Object.values(nodes).length) {
					Object.entries(nodes).forEach(([key, value]) => {
						elements.push([key, value]);
					});
				}
			});
		}
		html += `<ul id="${field.id}${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" class="list-group" aria-labelledby="${field.id}Label${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}">`;

		if (field.checklist_type === HeriverseNode.TYPE.STRATIGRAPHIC) {
			elements.forEach(([element_subsection_key, element_subsection]) => {
				Object.entries(element_subsection).forEach(([element_key, element_value]) => {
					html += `<li class="list-group-item"><input type="checkbox" data-id="${element_key}" data-type="${field.checklist_type}"/> ${element_value.name}</li>`;
				});
			});
		} else {
			elements.forEach(([element_key, element]) => {
				html += `<li class="list-group-item"><input type="checkbox" data-id="${element_key}" data-type="${
					field.checklist_type || element.type
				}"/> ${element.name}</li>`;
			});
		}
		html += `</ul>`;
	} else if (field.type === "textarea") {
		html += `<textarea id="${field.id}${lastFieldIndex > 0 ? "-" + lastFieldIndex : ""}" name="${
			field.id
		}" class="form-control w-100" aria-labelledby="${field.id}Label${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" rows="2" data-type="${field.element_type}"></textarea>`;
	} else if (field.type === "typeSelector") {
		html += `<select id="${field.id}${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" class="inputTypeSelector" aria-labelledby="${field.id}Label${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" data-type="${field.element_type}">`;
		if (field.values && field.values.length > 0) {
			field.values.forEach((value) => {
				html += `<option value=${value}>${value}</option>`;
			});
		}
		html += `</select>`;
	} else if (field.type === "nodeSelector") {
		html += `<select id="${field.id}${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" class="inputNodeSelector" aria-labelledby="${field.id}Label${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" data-type="${field.element_type}">`;
		if (field.valuesType === HeriverseNode.NODE_TYPE.STRATIGRAPHIC) {
			Object.values(Heriverse.currMG.nodesByIndex).forEach((node) => {
				if (!HeriverseGraph.stratigraphicTypes.includes(node.type)) return;
				html += `<option value=${node.name} data-id=${node.id}>${node.name}</option>`;
			});
		}
		html += `</select>`;
	} else if (field.type === "file") {
		html += `<input class="form-control inputFile" aria-labelledBy="${field.id}Label${
			lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
		}" id="${field.id}${lastFieldIndex > 0 ? "-" + lastFieldIndex : ""}" type="${
			field.type
		}" multiple=${field.multiple} ${field.accept ? "accept=" + field.accept : ""}/>`;
	} else {
		if (field.element_type === HeriverseNode.TYPE.PROPERTIES && field.label === "Informazioni") {
			html += EditorUI.buildPropertyTypeSelector(Heriverse.properties_rules);
		} else {
			html += `<input id="${field.id}${lastFieldIndex > 0 ? "-" + lastFieldIndex : ""}" type="${
				field.type
			}" class="form-controll flex-grow-1 ${
				field.element_type === HeriverseNode.TYPE.PROPERTIES && field.id.includes("Info")
					? ""
					: "w-100"
			}" aria-labelledby="${field.id}Label${
				lastFieldIndex > 0 ? "-" + lastFieldIndex : ""
			}" data-type="${field.element_type}" style="float: left"/>`;
		}
	}

	return html;
}
