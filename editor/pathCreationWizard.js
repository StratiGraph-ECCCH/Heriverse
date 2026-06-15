import HeriverseGraph from "../src/HeriverseGraph/HeriverseGraph.js";
import HeriverseNode from "../src/HeriverseGraph/HeriverseNode.js";
import ShelfNode from "../src/ShelfGraph/ShelfNode.js";
import { generateFieldHTML } from "./modalFieldRenderer.js";

let currentStep,
	setupSteps = [];
let currentSubPathCount = 0,
	lastSubPathCount = 0;
let combinerSwitchActive = false;
export let actualStartType, actualEndType, pathToCreate, currentLinkId;
const wizardModal = document.getElementById("dynamicModalPathCreation");
const wizardTitle = wizardModal?.querySelector("#wizardTitle");
const wizardGraph = wizardModal?.querySelector("#wizardGraph");
const connector =
	'<div class="d-flex align-items-center step-line mb-2"><img src="' +
	(window.location.href.includes("heriverse-wapp")
		? "/a/heriverse-wapp/assets/progress_bar/"
		: "/a/heriverse/assets/progress_bar/") +
	"arrow down.svg" +
	'"></div>';
const wizardContent = wizardModal?.querySelector("#wizardContent");
const pageSubPath = wizardModal?.querySelector(".modal-footer > div");
const backBtn = wizardModal?.querySelector("#prevBtn");
const nextBtn = wizardModal?.querySelector("#nextBtn");

function getRandomColor() {
	let letters = "0123456789ABCDEF";
	let color = "#";
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function buildProgressBar() {
	wizardGraph.innerHTML = "";

	let combinerIndex = -1;

	pathToCreate.path.forEach((pathComponentType, index) => {
		const graphNodeType = Heriverse.getNodeTypeByCRNodeType(pathComponentType);

		let graphNode = `<div class="step-circle step-empty ${
			index === pathToCreate.path.length - 1 ? "selected-step" : ""
		} mb-2" data-step=${pathToCreate.path.length - 1 - index} ${
			combinerIndex !== -1 ? 'data-sp="0"' : ""
		}>`;
		if (graphNodeType === HeriverseNode.NODE_TYPE.STRATIGRAPHIC) {
			graphNode += "SU";
		} else if (graphNodeType === HeriverseNode.STRATIGRAPHIC_TYPE.SF) {
			graphNode += "SF";
		} else {
			graphNode += `<img src="${
				(window.location.href.includes("heriverse-wapp")
					? "/a/heriverse-wapp/res/graphicons/"
					: "/a/heriverse/res/graphicons/") +
				graphNodeType +
				".svg"
			}" alt="${pathComponentType}">`;
		}
		graphNode += "</div>";

		if (combinerSwitchActive && combinerIndex !== -1 && index > combinerIndex) {
			document.querySelector("#combinerSubPaths .combinerSubPath").innerHTML += graphNode;
			if (index < pathToCreate.path.length - 1)
				document.querySelector("#combinerSubPaths .combinerSubPath").innerHTML += connector;
		} else {
			wizardGraph.innerHTML += graphNode;
			if (index < pathToCreate.path.length - 1) wizardGraph.innerHTML += connector;
		}

		if (graphNodeType === HeriverseNode.NODE_TYPE.COMBINER) {
			combinerIndex = index;
			wizardGraph.innerHTML += `<div id="combinerSubPaths"><div class="combinerSubPath active flex-column align-items-center justify-content-center" data-sp="0">`;
		}
	});

	document.querySelectorAll("#dynamicModalPathCreation .step-circle > img").forEach((img) => {
		function tag() {
			if (img.naturalWidth && img.naturalHeight) {
				img.classList.toggle("orizontalIcon", img.naturalWidth > img.naturalHeight);
				img.classList.toggle("verticalIcon", img.naturalHeight >= img.naturalWidth);
			}
		}

		if (img.complete) tag();
		else img.addEventListener("load", tag, { once: true });
	});
}

function buildSteps() {
	wizardContent.innerHTML = "";
	const totalStepsCount = pathToCreate.path.length;

	document
		.querySelector("#dynamicModalPathCreation #combinerToggle")
		.classList.toggle(
			"d-none",
			!pathToCreate.path.includes(Heriverse.CONNECTION_RULES_NODETYPES.EXTRACTOR) &&
				!pathToCreate.path.includes(Heriverse.CONNECTION_RULES_NODETYPES.COMBINER)
		);
	document
		.querySelector("#dynamicModalPathCreation div.modal-footer > div")
		.classList.toggle("d-none", !combinerSwitchActive);

	setupSteps = [];
	for (let i = totalStepsCount - 1; i >= 0; i--) {
		setupSteps.push(
			Editor.modal_steps.find((single_step) => single_step.node_type === pathToCreate.path[i])
		);
	}

	let combinerIndex = -1;

	setupSteps.forEach((step, index) => {
		if (step.node_type === Heriverse.CONNECTION_RULES_NODETYPES.COMBINER) {
			combinerIndex = index;
		}

		const singleStep = document.createElement("div");
		singleStep.className = index === 0 ? "wizard-step active" : "wizard-step";
		singleStep.dataset.step = index;
		if (combinerSwitchActive && combinerIndex === -1) singleStep.dataset.subPath = lastSubPathCount;
		singleStep.dataset.type = step.node_type;
		let stepContent = "";
		step.fields.forEach((field) => {
			stepContent += generateFieldHTML(field);
		});
		if (step.node_type === Heriverse.CONNECTION_RULES_NODETYPES.COMBINER)
			stepContent += `<button id="extractorAdder" type="button" class="btn btn-info mt-5">Aggiungi un contributo</button>`;
		singleStep.innerHTML = stepContent;
		wizardContent.innerHTML += singleStep.outerHTML;
	});

	setupWizardEventListeners();
}

function combinerSwitch() {
	const switchInput = document.querySelector("#dynamicModalPathCreation #combinerOption");
	if (switchInput.checked) {
		combinerSwitchActive = true;
		if (
			Editor.state.currShelfElement &&
			(Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.IMAGE ||
				Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.DOCUMENT)
		) {
			let path1 = Heriverse.findShortestValidPath(
				actualStartType,
				Heriverse.CONNECTION_RULES_NODETYPES.COMBINER
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.COMBINER,
				Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT
			);
			let path3 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT,
				actualEndType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections, ...path3.connections],
				path: [...path1.path, ...path2.path.splice(1), ...path3.path.splice(1)],
			};
		} else {
			let path1 = Heriverse.findShortestValidPath(
				actualStartType,
				Heriverse.CONNECTION_RULES_NODETYPES.COMBINER
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.COMBINER,
				actualEndType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections],
				path: [...path1.path, ...path2.path.splice(1)],
			};
		}
		buildSteps();
		buildProgressBar();
		updateButtons();
		setupPredefinedSteps();
	} else {
		lastSubPathCount = 0;
		currentSubPathCount = 0;
		combinerSwitchActive = false;
		if (
			Editor.state.currShelfElement &&
			(Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.IMAGE ||
				Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.DOCUMENT)
		) {
			let path1 = Heriverse.findShortestValidPath(
				actualStartType,
				Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT,
				actualEndType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections],
				path: [...path1.path, ...path2.path.splice(1)],
			};
		} else {
			pathToCreate = Heriverse.findShortestValidPath(actualStartType, actualEndType);
		}
		buildSteps();
		buildProgressBar();
		updateButtons();
		setupPredefinedSteps();
	}
}

function prevBtnAction() {
	if (currentStep > 0) {
		$("#dynamicModalPathCreation .step-circle[data-step].selected-step").removeClass(
			"selected-step"
		);
		currentStep--;
		if (
			combinerSwitchActive &&
			$("#dynamicModalPathCreation .step-circle[data-step='" + currentStep + "'][data-sp]").length >
				0
		)
			renderStep(currentStep, currentSubPathCount);
		else renderStep(currentStep);
	}
}

function prevBtnPathAction() {
	if (currentSubPathCount > 0) {
		currentSubPathCount--;

		$("#dynamicModalPathCreation #combinerSubPaths .combinerSubPath.active").removeClass("active");
		$(
			"#dynamicModalPathCreation #combinerSubPaths .combinerSubPath[data-sp='" +
				currentSubPathCount +
				"']"
		).addClass("active");
		renderStep(currentStep, currentSubPathCount);
		updateButtons();
	}
}

function nextBtnAction() {
	if (currentStep < pathToCreate.path.length - 1) {
		$("#dynamicModalPathCreation .step-circle[data-step].selected-step").removeClass(
			"selected-step"
		);
		currentStep++;
		if (
			combinerSwitchActive &&
			$("#dynamicModalPathCreation .step-circle[data-step='" + currentStep + "'][data-sp]").length >
				0
		)
			renderStep(currentStep, currentSubPathCount);
		else renderStep(currentStep);
	} else {
		if (!validateCreation()) alert("Creazione non valida");
		else finalizePathCreation();
	}
}

function nextBtnPathAction() {
	if (currentSubPathCount < lastSubPathCount) {
		currentSubPathCount++;

		$("#dynamicModalPathCreation #combinerSubPaths .combinerSubPath.active").removeClass("active");
		$(
			"#dynamicModalPathCreation #combinerSubPaths .combinerSubPath[data-sp='" +
				currentSubPathCount +
				"']"
		).addClass("active");
		renderStep(currentStep, currentSubPathCount);
		updateButtons();
	}
}

function graphNodeInteraction(e) {
	const targetCircle = e.target.tagName === "DIV" ? e.target : e.target.parentElement;
	currentStep = parseInt(targetCircle.dataset.step);
	if (combinerSwitchActive && targetCircle.getAttribute("data-sp"))
		currentSubPathCount = parseInt(targetCircle.getAttribute("data-sp"));
	$("#dynamicModalPathCreation .step-circle[data-step]").removeClass("selected-step");
	if (combinerSwitchActive && targetCircle.dataset.sp) renderStep(currentStep, currentSubPathCount);
	else renderStep(currentStep);
}

function updateProgressState() {
	document.querySelectorAll("#dynamicModalPathCreation .step-circle[data-step]").forEach((btn) => {
		const idx = btn.dataset.step;
		const subPathIdx = combinerSwitchActive && btn.dataset.sp ? btn.dataset.sp : "-1";
		const status =
			combinerSwitchActive && subPathIdx !== "-1"
				? evaluateStep(idx, subPathIdx)
				: evaluateStep(idx);
		btn.classList.remove("step-empty", "step-partial", "step-complete");
		if (status === "complete") btn.classList.add("step-complete");
		else if (status === "partial") btn.classList.add("step-partial");
		else btn.classList.add("step-empty");
	});

	function evaluateStep(index, subpathIndex = "-1") {
		const currStep =
			combinerSwitchActive && subpathIndex !== "-1"
				? document.querySelector(
						"#dynamicModalPathCreation .wizard-step[data-step='" +
							index +
							"'][data-sub-path='" +
							subpathIndex +
							"']"
					)
				: document.querySelector(
						"#dynamicModalPathCreation .wizard-step[data-step='" + index + "']"
					);

		if (!currStep) return "empty";

		const existingSelector = currStep.querySelector("select.existing-node-selector");
		const typeSelector = currStep.querySelector("select.inputTypeSelector");

		// 1) If an existing node is selected, the step is complete.
		if (existingSelector && existingSelector.selectedIndex !== 0) {
			return "complete";
		}

		// 2) Individual if it is a step Link
		const isLinkStep =
			currStep.dataset.type === Heriverse.CONNECTION_RULES_NODETYPES.LINK ||
			(!!currStep.querySelector("input[id$='Files']") &&
				!!currStep.querySelector("input[id$='FileText']"));

		// 3) Special case: step Link
		if (isLinkStep) {
			const nameInput = currStep.querySelector("input[id*='Name']");
			const descriptionInput = currStep.querySelector("textarea[id*='Description']");
			const fileInput = currStep.querySelector("input[id$='Files']");
			const remoteInput = currStep.querySelector("input[id$='FileText']");

			const nameFilled = !!nameInput && nameInput.value.trim() !== "";
			const descriptionFilled = !!descriptionInput && descriptionInput.value.trim() !== "";
			const typeSelected = !!typeSelector && typeSelector.value && typeSelector.value.trim() !== "";

			const hasFiles = !!fileInput && fileInput.files && fileInput.files.length > 0;
			const hasRemote = !!remoteInput && remoteInput.value.trim() !== "";

			const anyFilled = nameFilled || descriptionFilled || typeSelected || hasFiles || hasRemote;

			if (!anyFilled) return "empty";

			return nameFilled && descriptionFilled && typeSelected && (hasFiles || hasRemote)
				? "complete"
				: "partial";
		}

		// 4) Generic case: I always exclude the final 3 fields
		const currStepInputs = [
			...currStep.querySelectorAll(
				"input:not([id*='License']):not([id*='Authors']):not([id*='Embargo']), textarea, select.inputTypeSelector"
			),
		];

		if (currStepInputs.length === 0) return "empty";

		const filled = currStepInputs.filter((el) => {
			if (el.type === "checkbox" || el.type === "radio") return el.checked;
			if (el.tagName === "SELECT") return el.value.trim() !== "";
			if (el.type === "file") return el.files && el.files.length > 0;
			return el.value.trim() !== "";
		});

		if (filled.length === 0) return "empty";

		return filled.length === currStepInputs.length ? "complete" : "partial";
	}
}

function addNewExtractor() {
	const subPathsSection = wizardGraph.querySelector("#combinerSubPaths");

	let newSubPath = `<div class="combinerSubPath flex-column align-items-center justify-content-center" data-sp="${++lastSubPathCount}">`;

	let combinerIndex = -1;

	pathToCreate.path.forEach((pathComponentType, index) => {
		const graphNodeType = Heriverse.getNodeTypeByCRNodeType(pathComponentType);

		if (graphNodeType !== HeriverseNode.NODE_TYPE.COMBINER && combinerIndex === -1) return;
		else if (graphNodeType === HeriverseNode.NODE_TYPE.COMBINER) {
			combinerIndex = index;
			return;
		}
		let graphNode = `<div class="step-circle step-empty mb-2" data-step=${
			pathToCreate.path.length - 1 - index
		} data-sp=${lastSubPathCount}>`;
		if (graphNodeType === HeriverseNode.NODE_TYPE.STRATIGRAPHIC) {
			graphNode += "SU";
		} else if (graphNodeType === HeriverseNode.STRATIGRAPHIC_TYPE.SF) {
			graphNode += "SF";
		} else {
			graphNode += `<img src="${
				(window.location.href.includes("heriverse-wapp")
					? "/a/heriverse-wapp/res/graphicons/"
					: "/a/heriverse/res/graphicons/") +
				graphNodeType +
				".svg"
			}" alt="${pathComponentType}">`;
		}
		graphNode += "</div>";

		newSubPath += graphNode;
		if (index < pathToCreate.path.length - 1) newSubPath += connector;

		let stepFromPath = Editor.modal_steps.find((elem) => elem.node_type === pathComponentType);

		const singleStep = document.createElement("div");
		singleStep.className = index === 0 ? "wizard-step active" : "wizard-step";
		singleStep.dataset.step = pathToCreate.path.length - 1 - index;
		if (combinerSwitchActive && index > combinerIndex)
			singleStep.dataset.subPath = lastSubPathCount;
		singleStep.dataset.type = stepFromPath.node_type;
		let stepContent = "";
		stepFromPath.fields.forEach((field) => {
			stepContent += generateFieldHTML(field, lastSubPathCount);
		});
		singleStep.innerHTML = stepContent;
		wizardContent.innerHTML += singleStep.outerHTML;
	});

	newSubPath += "</div>";

	subPathsSection.innerHTML += newSubPath;

	document.querySelectorAll("#dynamicModalPathCreation .step-circle > img").forEach((img) => {
		function tag() {
			if (img.naturalWidth && img.naturalHeight) {
				img.classList.toggle("orizontalIcon", img.naturalWidth > img.naturalHeight);
				img.classList.toggle("verticalIcon", img.naturalHeight >= img.naturalWidth);
			}
		}

		if (img.complete) tag();
		else img.addEventListener("load", tag, { once: true });
	});

	setupPredefinedSteps();
	updateButtons();
}

function resetModalContent() {
	currentStep = 0;
	Editor.state.currWorkspaceElement = null;

	if (Editor.state.legalSelectedNode && Editor.state.currSelectedNode) {
		Editor.state.currSelectedNode = Editor.state.legalSelectedNode;
		Editor.state.legalSelectedNode = null;
	}

	wizardContent
		.querySelectorAll("input[type=text], input[type=number], input[type=date], textarea")
		.forEach((singleInput) => (singleInput.value = ""));

	wizardContent
		.querySelectorAll("input[type=checkbox]")
		.forEach((singleInput) => (singleInput.checked = false));

	wizardContent
		.querySelectorAll("select")
		.forEach((singleSelect) => (singleSelect.selectedIndex = 0));
}

function setupPredefinedSteps() {
	const firstStep = wizardContent.querySelector(
		".wizard-step[data-type^=Link]" + (combinerSwitchActive ? "[data-sub-path='0']" : "")
	);
	const firstStepElements = firstStep.querySelectorAll("input, select, textarea");
	const repModStep = wizardContent.querySelector(
		".wizard-step[data-type^='RepresentationModel']" +
			(combinerSwitchActive ? "[data-sub-path='0']" : "")
	);
	const lastStep = wizardContent.querySelector(".wizard-step[data-type^='Stratigraphic']");
	const lastStepElements = lastStep.querySelectorAll("input, select, textarea");

	if (Editor.state.currShelfElement) {
		if (Editor.state.currShelfElement.dataset.urlContent)
			[...firstStepElements].find((element) => element.id.includes("FileText")).value =
				Editor.state.currShelfElement.dataset.urlContent;
		if (Editor.state.currShelfElement.dataset.contentType) {
			let typeSelector = [...firstStepElements].find((element) =>
				element.id.includes("TypeSelect")
			);
			typeSelector.selectedIndex = [...typeSelector.options].findIndex(
				(element) => element.value === Editor.state.currShelfElement.dataset.contentType
			);
		}
		if (Editor.state.currShelfElement.dataset.nameContent)
			[...firstStepElements].find((element) => element.id.includes("Name")).value =
				Editor.state.currShelfElement.dataset.nameContent;
		if (Editor.state.currShelfElement.dataset.descriptionContent)
			[...firstStepElements].find((element) => element.id.includes("Description")).textContent =
				Editor.state.currShelfElement.dataset.descriptionContent;
	}

	if (Editor.state.currWorkspaceElement) {
		if (
			HeriverseGraph.stratigraphicTypes.includes(Editor.state.currWorkspaceElement.dataset.bsType)
		) {
			let nodeSelector = [...lastStepElements].find(
				(element) => element.id.includes("Select") && !element.id.includes("TypeSelect")
			);
			nodeSelector.selectedIndex = [...nodeSelector.options].findIndex(
				(element) => element.textContent === Editor.state.currWorkspaceElement.dataset.bsName
			);
			$("select#" + nodeSelector.id + ".existing-node-selector").trigger("change");
		}
	}

	renderStep(0);
	updateProgressState();
}

function setupWizardEventListeners() {
	$(document)
		.off("change", "#dynamicModalPathCreation #combinerOption", combinerSwitch)
		.on("change", "#dynamicModalPathCreation #combinerOption", combinerSwitch);

	$(document)
		.off(
			"change",
			"#dynamicModalPathCreation #wizardContent .wizard-step select.existing-node-selector",
			manageOtherInputs
		)
		.on(
			"change",
			"#dynamicModalPathCreation #wizardContent .wizard-step select.existing-node-selector",
			manageOtherInputs
		);

	$(document)
		.off("click", "#dynamicModalPathCreation .modal-footer #prevBtn", prevBtnAction)
		.on("click", "#dynamicModalPathCreation .modal-footer #prevBtn", prevBtnAction);

	$(document)
		.off("click", "#dynamicModalPathCreation .modal-footer #prevPathBtn", prevBtnPathAction)
		.on("click", "#dynamicModalPathCreation .modal-footer #prevPathBtn", prevBtnPathAction);

	$(document)
		.off("click", "#dynamicModalPathCreation .modal-footer #nextBtn", nextBtnAction)
		.on("click", "#dynamicModalPathCreation .modal-footer #nextBtn", nextBtnAction);

	$(document)
		.off("click", "#dynamicModalPathCreation .modal-footer #nextPathBtn", nextBtnPathAction)
		.on("click", "#dynamicModalPathCreation .modal-footer #nextPathBtn", nextBtnPathAction);

	$(document)
		.off("click", "#dynamicModalPathCreation #extractorAdder", addNewExtractor)
		.on("click", "#dynamicModalPathCreation #extractorAdder", addNewExtractor);

	$(document)
		.off("click", "#dynamicModalPathCreation .step-circle[data-step]", graphNodeInteraction)
		.on("click", "#dynamicModalPathCreation .step-circle[data-step]", graphNodeInteraction);

	$(document)
		.off(
			"input change",
			"#dynamicModalPathCreation input, #dynamicModalPathCreation select, #dynamicModalPathCreation textarea",
			updateProgressState
		)
		.on(
			"input change",
			"#dynamicModalPathCreation input, #dynamicModalPathCreation select, #dynamicModalPathCreation textarea",
			updateProgressState
		);

	$(document)
		.off("show.bs.modal", "#dynamicModalPathCreation", setupPredefinedSteps)
		.on("show.bs.modal", "#dynamicModalPathCreation", setupPredefinedSteps);

	$(document)
		.off("hidden.bs.modal", "#dynamicModalPathCreation", resetModalContent)
		.on("hidden.bs.modal", "#dynamicModalPathCreation", resetModalContent);
}

function renderStep(idx = currentStep, subpathIndex = -1) {
	const step = setupSteps[idx];
	const stepToactive =
		combinerSwitchActive && subpathIndex !== -1
			? wizardContent.querySelector(
					".wizard-step[data-step='" + idx + "'][data-sub-path='" + subpathIndex + "']"
				)
			: wizardContent.querySelector(".wizard-step[data-step='" + idx + "']");
	const relatedCircle =
		combinerSwitchActive && subpathIndex !== -1
			? wizardGraph.querySelector(
					".step-circle[data-step='" + idx + "'][data-sp='" + subpathIndex + "']"
				)
			: wizardGraph.querySelector(".step-circle[data-step='" + idx + "']");
	if (!stepToactive && !relatedCircle) return;

	wizardTitle.textContent = `${step && step.title ? step.title : "Resoconto"} (${idx + 1}/${
		pathToCreate.path.length
	})`;

	const activeStep = wizardContent.querySelector(".wizard-step.active");
	if (activeStep) activeStep.classList.remove("active");

	if (stepToactive) stepToactive.classList.add("active");
	if (relatedCircle) relatedCircle.classList.add("selected-step");

	updateButtons();
}

function manageOtherInputs(e) {
	const currentSelectElement = this;
	currentSelectElement
		.closest(".wizard-step[data-step]")
		.querySelectorAll(
			"input[type=text], textarea, input[type=checkbox], input[type=number], input[type=color], select.inputTypeSelector"
		)
		.forEach((singleInput) => {
			singleInput.disabled = currentSelectElement.selectedIndex !== 0;
			if (document.querySelector(`label[for='${singleInput.id}']`))
				document.querySelector(`label[for='${singleInput.id}']`).style.opacity =
					currentSelectElement.selectedIndex !== 0 ? 0.3 : 1;
			else
				document.querySelector(
					`label[for='${singleInput.parentElement.parentElement.id}']`
				).style.opacity = currentSelectElement.selectedIndex !== 0 ? 0.3 : 10;
			singleInput.style.opacity = currentSelectElement.selectedIndex !== 0 ? 0.3 : 1;
		});
}

function updateButtons() {
	pageSubPath.querySelector("span").textContent = `${currentSubPathCount + 1} / ${
		lastSubPathCount + 1
	}`;
	pageSubPath.querySelector("#prevPathBtn").disabled = currentSubPathCount === 0;
	pageSubPath.querySelector("#nextPathBtn").disabled = currentSubPathCount === lastSubPathCount;
	backBtn.classList.toggle("d-none", currentStep === 0);
	nextBtn.textContent = currentStep === pathToCreate.path.length + 1 ? "Finish" : "Next";
}

function validateCreation() {
	const selectors = Object.values(wizardContent.querySelectorAll("select"));
	if (
		selectors.filter((selector) => selector.selectedIndex !== 0).length === pathToCreate.path.length
	)
		return true;

	const inputsBySteps = [];
	const actualSteps = wizardContent.querySelectorAll(
		".wizard-step[data-step]:not([data-step='" + pathToCreate.path.length + "'])"
	);

	actualSteps.forEach((actualStep, index) => {
		inputsBySteps.push({
			stepIndex: actualStep.dataset.step,
			stepType: actualStep.dataset.type,
			selector: actualStep.querySelector("select.existing-node-selector"),
			inputList: actualStep.querySelectorAll(
				'input:not([id*="License"]):not([id*="Authors"]):not([id*="Embargo"]) , textarea'
			),
			propertyDesc: actualStep.querySelectorAll(
				"div#" +
					Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY +
					"Info #propInput-section input, div#" +
					Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY +
					"Info #propInput-section select, div#" +
					Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY +
					"Info #propInput-section label"
			),
			checkedList: actualStep.querySelectorAll("input[type=checkbox]:checked"),
		});
	});
	let completedSteps = 0;

	inputsBySteps.forEach((singleStep) => {
		if (
			singleStep.selector &&
			singleStep.stepType === Heriverse.getCRNodeTypeByNodeType(singleStep.selector.dataset.type) &&
			singleStep.selector.selectedIndex !== 0
		) {
			completedSteps++;
		} else if (singleStep.inputList.length > 0) {
			let fieldCount = 0;
			singleStep.inputList.forEach((input) => {
				if (!input.value) return;
				else fieldCount++;
			});
			if (fieldCount > 0) {
				completedSteps++;
			}
		}

		if (singleStep.checkedList.length > 0) {
		}
	});

	return completedSteps === inputsBySteps.length;
}

function finalizePathCreation() {
	$("#idLoader").show();
	let default_authors = Heriverse.currMG.json.graphs[Heriverse.currGraphId].defaults.authors;
	let default_license = Heriverse.currMG.json.graphs[Heriverse.currGraphId].defaults.license;
	let default_embargo_until =
		Heriverse.currMG.json.graphs[Heriverse.currGraphId].defaults.embargo_until;

	let stratigraphicWithChecklist;

	const inputsBySteps = [];
	const subPathsDone = [];
	const actualSteps = wizardContent.querySelectorAll(
		".wizard-step[data-step]:not([data-step='" + pathToCreate.path.length + "'])"
	);
	actualSteps.forEach((actualStep) => {
		inputsBySteps.push({
			stepIndex: actualStep.dataset.step,
			subPath: actualStep.dataset.subPath ? actualStep.dataset.subPath : -1,
			stepType: actualStep.dataset.type,
			nodeSelector: actualStep.querySelector(
				"select[id*='NodeSelect']:not(select.inputNodeSelector)"
			),
			inputList: actualStep.querySelectorAll(
				"input[type=text], input[type=color], input[type=number], input[type=file], textarea, select.inputTypeSelector, select.inputNodeSelector"
			),
			propertyDesc: actualStep.querySelectorAll(
				"div#" +
					Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY +
					"Info #propInput-section input, div#" +
					Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY +
					"Info #propInput-section select, div#" +
					Heriverse.CONNECTION_RULES_NODETYPES.PROPERTY +
					"Info #propInput-section label"
			),
			checkedList: actualStep.querySelectorAll("ul input[type=checkbox]:checked"),
			license: actualStep.querySelector("input[id$=License]"),
			authors: actualStep.querySelector("input[id$=Authors]"),
			embargo: actualStep.querySelector("input[id$=Embargo]"),
		});
	});

	const nodesInvolved = [];

	inputsBySteps.forEach((singleStep) => {
		if (singleStep.subPath !== -1 && subPathsDone.includes(singleStep.subPath)) {
			$("#idLoader").hide();
			return;
		} else if (singleStep.subPath !== -1) {
			subPathsDone.push(singleStep.subPath);
			const subPathNodesInvolved = [];
			inputsBySteps
				.filter((element) => element.subPath === singleStep.subPath)
				.forEach((otherStep) => {
					let concreteNode;
					const graphNodeType = Heriverse.getNodeTypeByCRNodeType(otherStep.stepType);
					if (otherStep.nodeSelector && otherStep.nodeSelector.selectedIndex !== 0) {
						let selectedOption =
							otherStep.nodeSelector.options[otherStep.nodeSelector.selectedIndex];
						concreteNode = Heriverse.currMG.nodesByIndex[selectedOption.dataset.id];
					} else if (otherStep.inputList.length > 0) {
						const effctiveLicense =
							otherStep.license && otherStep.license.value
								? otherStep.license.value
								: default_license;
						const effctiveAuthors =
							otherStep.authors && otherStep.authors.value
								? otherStep.authors.value.split(",")
								: default_authors;
						const effctiveEmbargo =
							otherStep.embargo && otherStep.embargo.value
								? otherStep.embargo.value
								: default_embargo_until;

						if (otherStep.propertyDesc.length > 0) {
							concreteNode = new HeriverseNode();
							let propertyDescription = "",
								propertyName = document.querySelector("#propType-dropdownMenu").textContent;

							otherStep.propertyDesc.forEach((singleElem) => {
								switch (singleElem.tagName) {
									case "LABEL":
										propertyDescription += singleElem.textContent + " ";
										break;
									case "INPUT":
										propertyDescription += singleElem.value + " ";
										break;
									case "SELECT":
										propertyDescription += singleElem.options[singleElem.selectedIndex].value + " ";
										break;
								}
							});

							concreteNode.setNodeInfo(
								null,
								graphNodeType,
								propertyName,
								propertyDescription,
								{},
								effctiveLicense,
								effctiveAuthors,
								effctiveEmbargo,
								Heriverse.currGraphId
							);

							Heriverse.currMG.newNode(concreteNode);
						} else {
							let nodeType =
								otherStep.inputList.length > 2 &&
								otherStep.inputList[2].tagName === "SELECT" &&
								graphNodeType === HeriverseNode.TYPE.STRATIGRAPHIC
									? otherStep.inputList[2].options[otherStep.inputList[2].selectedIndex].value
									: graphNodeType;

							concreteNode = new HeriverseNode();
							if (graphNodeType === HeriverseNode.NODE_TYPE.EPOCH) {
								concreteNode.setNodeInfo(
									null,
									nodeType,
									otherStep.inputList[0].value,
									"",
									{
										start_time: otherStep.inputList[1].value,
										end_time: otherStep.inputList[2].value,
										color: otherStep.inputList[3].value,
										min_y: otherStep.inputList[4].value,
										max_y: otherStep.inputList[5].value,
									},
									effctiveLicense,
									effctiveAuthors,
									effctiveEmbargo,
									Heriverse.currGraphId
								);
							} else if (graphNodeType === HeriverseNode.NODE_TYPE.LINK) {
								let relativeFile;
								if (otherStep.inputList[3].files && otherStep.inputList[3].files.length > 0) {
									relativeFile = Editor.uploadResource(otherStep.inputList[3].files);
								} else {
									relativeFile = otherStep.inputList[4].value;
								}

								concreteNode.setNodeInfo(
									null,
									nodeType,
									otherStep.inputList[0].value,
									"",
									{
										url: relativeFile,
										url_type: otherStep.inputList[2].value,
										description: otherStep.inputList[1].value,
									},
									effctiveLicense,
									effctiveAuthors,
									effctiveEmbargo,
									Heriverse.currGraphId
								);
							} else {
								let nodeData = {};
								if (Editor.state.currSelectedNode) {
									const positionSelected = Editor.state.currSelectedNode.position;
									const rotationSelected = Editor.state.currSelectedNode.rotation;
									const scaleSelected = Editor.state.currSelectedNode.scale;

									nodeData = {
										transform: {
											position: [
												String(positionSelected.x),
												String(positionSelected.y),
												String(positionSelected.z),
											],
											rotation: [
												String(rotationSelected.x),
												String(rotationSelected.y),
												String(rotationSelected.z),
											],
											scale: [
												String(scaleSelected.x),
												String(scaleSelected.y),
												String(scaleSelected.z),
											],
										},
									};
								}

								concreteNode.setNodeInfo(
									null,
									nodeType,
									otherStep.inputList[0].value,
									otherStep.inputList[1].value,
									nodeData,
									effctiveLicense,
									effctiveAuthors,
									effctiveEmbargo,
									Heriverse.currGraphId
								);
							}

							if (
								Editor.state.addFromScene &&
								actualStartType === Heriverse.CONNECTION_RULES_NODETYPES.LINK
							) {
								if (concreteNode.type === HeriverseNode.NODE_TYPE.LINK) {
									currentLinkId = concreteNode.id;

									let elemIndex = Editor.shelf_objects_in_scene.indexOf(
										Editor.state.currSelectedNode
									);
									if (elemIndex >= 0) Editor.shelf_objects_in_scene.splice(elemIndex, 1);
								} else {
									let elemIndex = Editor.shelf_objects_in_scene.indexOf(
										Editor.state.currSelectedNode
									);
									if (elemIndex >= 0) Editor.shelf_objects_in_scene.splice(elemIndex, 1);
								}
							}

							Heriverse.currMG.newNode(concreteNode);
						}
					}

					if (otherStep.checkedList.length > 0) {
						const nodesChecked = [];

						otherStep.checkedList.forEach((checkedItem) => {
							nodesChecked.push(Heriverse.currMG.nodesByIndex[checkedItem.dataset.id]);
						});

						if (otherStep.checkedList[0].dataset.type === HeriverseNode.TYPE.EPOCHS) {
							nodesChecked.sort((a, b) => a.data.start_time - b.data.start_time);

							nodesChecked.forEach((nodeChecked, index) => {
								if (index === 0)
									Heriverse.currMG.newEdge(
										null,
										concreteNode,
										nodeChecked,
										HeriverseNode.RELATIONS.HAS_FIRST_EPOCH
									);
								else
									Heriverse.currMG.newEdge(
										null,
										concreteNode,
										nodeChecked,
										HeriverseNode.RELATIONS.SURVIVE_IN_EPOCH
									);
							});
						}
					}

					if (
						concreteNode.type === HeriverseNode.NODE_TYPE.EXTRACTOR ||
						concreteNode.type === HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL ||
						concreteNode.type === HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC ||
						concreteNode.type === HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF
					) {
						nodesInvolved.push(concreteNode);
						subPathNodesInvolved.push(concreteNode);
					} else subPathNodesInvolved.push(concreteNode);
				});

			pathToCreate.connections.forEach((connection) => {
				let connectionFrom = subPathNodesInvolved.find(
					(node) => Heriverse.getCRNodeTypeByNodeType(node.type) === connection.from
				);
				let connectionTo = subPathNodesInvolved.find(
					(node) => Heriverse.getCRNodeTypeByNodeType(node.type) === connection.to
				);

				if (connectionFrom && connectionTo)
					Heriverse.currMG.newEdge(null, connectionFrom, connectionTo, connection.type);
			});
		} else {
			let concreteNode;
			const graphNodeType = Heriverse.getNodeTypeByCRNodeType(singleStep.stepType);
			if (singleStep.nodeSelector && singleStep.nodeSelector.selectedIndex !== 0) {
				let selectedOption = singleStep.nodeSelector.options[singleStep.nodeSelector.selectedIndex];
				concreteNode = Heriverse.currMG.nodesByIndex[selectedOption.dataset.id];
			} else if (singleStep.inputList.length > 0) {
				const effctiveLicense =
					singleStep.license && singleStep.license.value
						? singleStep.license.value
						: default_license;
				const effctiveAuthors =
					singleStep.authors && singleStep.authors.value
						? singleStep.authors.value.split(",")
						: default_authors;
				const effctiveEmbargo =
					singleStep.embargo && singleStep.embargo.value
						? singleStep.embargo.value
						: default_embargo_until;

				if (singleStep.propertyDesc.length > 0) {
					concreteNode = new HeriverseNode();
					let propertyDescription = "",
						propertyName = document.querySelector("#propType-dropdownMenu").textContent;

					singleStep.propertyDesc.forEach((singleElem) => {
						switch (singleElem.tagName) {
							case "LABEL":
								propertyDescription += singleElem.textContent + " ";
								break;
							case "INPUT":
								propertyDescription += singleElem.value + " ";
								break;
							case "SELECT":
								propertyDescription += singleElem.options[singleElem.selectedIndex].value + " ";
								break;
						}
					});

					concreteNode.setNodeInfo(
						null,
						graphNodeType,
						propertyName,
						propertyDescription,
						{},
						effctiveLicense,
						effctiveAuthors,
						effctiveEmbargo,
						Heriverse.currGraphId
					);

					Heriverse.currMG.newNode(concreteNode);
				} else {
					let nodeType =
						singleStep.inputList.length > 2 &&
						singleStep.inputList[2].tagName === "SELECT" &&
						graphNodeType === HeriverseNode.TYPE.STRATIGRAPHIC
							? singleStep.inputList[2].options[singleStep.inputList[2].selectedIndex].value
							: graphNodeType;

					concreteNode = new HeriverseNode();

					if (graphNodeType === HeriverseNode.NODE_TYPE.EPOCH) {
						concreteNode.setNodeInfo(
							null,
							nodeType,
							singleStep.inputList[0].value,
							"",
							{
								start_time: singleStep.inputList[1].value,
								end_time: singleStep.inputList[2].value,
								color: singleStep.inputList[3].value,
								min_y: singleStep.inputList[4].value,
								max_y: singleStep.inputList[5].value,
							},
							effctiveLicense,
							effctiveAuthors,
							effctiveEmbargo,
							Heriverse.currGraphId
						);
					} else if (graphNodeType === HeriverseNode.NODE_TYPE.LINK) {
						let relativeFile;
						if (singleStep.inputList[3].files && singleStep.inputList[3].files.length > 0) {
							relativeFile = Editor.uploadResource(singleStep.inputList[3].files);
						} else {
							relativeFile = singleStep.inputList[4].value;
						}

						concreteNode.setNodeInfo(
							null,
							nodeType,
							singleStep.inputList[0].value,
							"",
							{
								url: relativeFile,
								url_type: singleStep.inputList[2].value,
								description: singleStep.inputList[1].value,
							},
							effctiveLicense,
							effctiveAuthors,
							effctiveEmbargo,
							Heriverse.currGraphId
						);
					} else if (graphNodeType === HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE) {
						const stratigraphicOptionSelected =
							inputsBySteps[1].options[inputsBySteps[1].selectedIndex];
						const stratigraphicNode =
							Heriverse.currMG.nodesByIndex[stratigraphicOptionSelected.dataset.id];

						concreteNode.setNodeInfo(
							stratigraphicNode.name + "_shape",
							nodeType,
							"Shape for " + stratigraphicNode.name,
							inputsBySteps[0].value,
							{ url: "", convexshapes: ATON.SemFactory.convexPoints, spheres: [] },
							effctiveLicense,
							effctiveAuthors,
							effctiveEmbargo,
							stratigraphicNode.graph
						);
					} else {
						let nodeData = {};
						if (Editor.state.currSelectedNode) {
							const positionSelected = Editor.state.currSelectedNode.position;
							const rotationSelected = Editor.state.currSelectedNode.rotation;
							const scaleSelected = Editor.state.currSelectedNode.scale;

							nodeData = {
								transform: {
									position: [
										String(positionSelected.x),
										String(positionSelected.y),
										String(positionSelected.z),
									],
									rotation: [
										String(rotationSelected.x),
										String(rotationSelected.y),
										String(rotationSelected.z),
									],
									scale: [
										String(scaleSelected.x),
										String(scaleSelected.y),
										String(scaleSelected.z),
									],
								},
							};
						}

						concreteNode.setNodeInfo(
							null,
							nodeType,
							singleStep.inputList[0].value,
							singleStep.inputList[1].value,
							nodeData,
							effctiveLicense,
							effctiveAuthors,
							effctiveEmbargo,
							Heriverse.currGraphId
						);
					}

					Heriverse.currMG.newNode(concreteNode);
				}
			}

			if (singleStep.checkedList.length > 0) {
				const nodesChecked = [];

				singleStep.checkedList.forEach((checkedItem) => {
					nodesChecked.push(Heriverse.currMG.nodesByIndex[checkedItem.dataset.id]);
				});

				if (singleStep.checkedList[0].dataset.type === HeriverseNode.TYPE.EPOCHS) {
					nodesChecked.sort((a, b) => a.data.start_time - b.data.start_time);

					nodesChecked.forEach((nodeChecked, index) => {
						if (index === 0) {
							Heriverse.currMG.newEdge(
								null,
								concreteNode,
								nodeChecked,
								HeriverseNode.RELATIONS.HAS_FIRST_EPOCH
							);
						} else
							Heriverse.currMG.newEdge(
								null,
								concreteNode,
								nodeChecked,
								HeriverseNode.RELATIONS.SURVIVE_IN_EPOCH
							);
					});
				}
			}

			nodesInvolved.push(concreteNode);
		}
	});

	if (nodesInvolved.some((node) => node && HeriverseGraph.stratigraphicTypes.includes(node.type))) {
		const stratigraphicNode = nodesInvolved.find((node) =>
			HeriverseGraph.stratigraphicTypes.includes(node.type)
		);
		const otherNodes = [
			...nodesInvolved.filter(
				(node) =>
					node.type === HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL ||
					node.type === HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF ||
					node.type === HeriverseNode.NODE_TYPE.LINK
			),
		];

		if (
			!stratigraphicNode.neighbors.EpochNode ||
			!Object.values(stratigraphicNode.neighbors.EpochNode).length
		) {
			$("#idLoader").hide();
			alert("Stratigraphic Node without Epochs!");
			bootstrap.Modal.getOrCreateInstance(
				document.getElementById("dynamicModalPathCreation")
			).hide();

			if (Editor.state.currSelectedNode) {
				let indexToRemove = Editor.shelf_objects_in_scene.indexOf(Editor.state.currSelectedNode);
				Editor.shelf_objects_in_scene.splice(indexToRemove, 1);
				Editor.gizmo.controlInstance.detach();
				Editor.gizmo.controlInstance.removeEventListener(
					"dragging-changed",
					Editor.gizmo.onDraggingChange
				);
				Editor.gizmo.controlInstance.removeEventListener("change", Editor.gizmo.onChangeGizmo);
				Editor.gizmo.modeIndex = 3;
				if (Editor.state.legalSelectedNode) {
					Editor.state.currSelectedNode = Editor.state.legalSelectedNode;
					Editor.state.legalSelectedNode = null;
				} else {
					Editor.state.currSelectedNode = null;
				}
				updateGizmoMode(Editor.state.currSelectedNode);
			}
			return;
		}

		Object.values(stratigraphicNode.neighbors.EpochNode)
			.sort((a, b) => a.data.start_time - b.data.start_time)
			.forEach((epoch, index) => {
				if (index === 0) {
					otherNodes.forEach((otherNode) => {
						Heriverse.currMG.newEdge(
							null,
							epoch,
							otherNode,
							HeriverseNode.RELATIONS.HAS_REPRESENTATION_MODEL
						);
					});
				} else {
					otherNodes.forEach((otherNode) => {
						Heriverse.currMG.newEdge(
							null,
							epoch,
							otherNode,
							HeriverseNode.RELATIONS.HAS_REPRESENTATION_MODEL
						);
					});
				}
			});
	}

	pathToCreate.connections.forEach((connection) => {
		let connectionFrom = nodesInvolved.find(
			(node) =>
				node &&
				(Heriverse.getCRNodeTypeByNodeType(node.type) === connection.from ||
					([
						Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC,
						Heriverse.CONNECTION_RULES_NODETYPES.SPECIAL_FIND_UNIT,
					].includes(connection.from) &&
						HeriverseGraph.stratigraphicTypes.includes(node.type)))
		);

		let connectionTo = nodesInvolved.filter(
			(node) =>
				node &&
				(Heriverse.getCRNodeTypeByNodeType(node.type) === connection.to ||
					([
						Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC,
						Heriverse.CONNECTION_RULES_NODETYPES.SPECIAL_FIND_UNIT,
					].includes(connection.to) &&
						HeriverseGraph.stratigraphicTypes.includes(node.type)))
		);

		if (connectionFrom && connectionTo.length)
			connectionTo.forEach((singleTo) => {
				Heriverse.currMG.newEdge(null, connectionFrom, singleTo, connection.type);
			});
	});

	Heriverse.syncGraphJSONToScene();

	bootstrap.Modal.getOrCreateInstance(document.getElementById("dynamicModalPathCreation")).hide();

	if (Editor.state.currSelectedNode) {
		let indexToRemove = Editor.shelf_objects_in_scene.indexOf(Editor.state.currSelectedNode);

		Editor.shelf_objects_in_scene.splice(indexToRemove, 1);
		Editor.gizmo.controlInstance.detach();
		Editor.gizmo.controlInstance.removeEventListener(
			"dragging-changed",
			Editor.gizmo.onDraggingChange
		);
		Editor.gizmo.controlInstance.removeEventListener("change", Editor.gizmo.onChangeGizmo);
		Editor.gizmo.modeIndex = 3;
		if (Editor.state.currShelfElement) {
			Editor.state.currShelfElement.remove();
			Editor.state.currShelfElement = null;
		}
		Editor.state.currSelectedNode = null;
		Editor.setSelectedNode(Editor.state.currSelectedNode);
	}

	Heriverse.setState({
		tempFilter: Heriverse.currTemporalFilter,
		graphId: Heriverse.currGraphId,
		selectedNode: Editor.state.legalSelectedNode ? Editor.state.legalSelectedNode : null,
	});

	$("#idLoader").hide();
	Heriverse.loadEM(null, false, true);
}

export function setupModalSteps(startNodeType, endNodeType, rmType = "") {
	setupSteps = [];
	currentStep = 0;
	currentSubPathCount = 0;
	lastSubPathCount = 0;
	combinerSwitchActive = false;

	actualStartType = startNodeType;
	actualEndType = endNodeType;

	if (
		(startNodeType === Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC ||
			startNodeType === Heriverse.CONNECTION_RULES_NODETYPES.SPECIAL_FIND_UNIT) &&
		endNodeType === Heriverse.CONNECTION_RULES_NODETYPES.LINK &&
		Editor.state.currShelfElement &&
		Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.MODEL_3D
	) {
		if (rmType === "representation") {
			let path1 = Heriverse.findShortestValidPath(
				startNodeType,
				Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL,
				endNodeType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections],
				path: [...path1.path, ...path2.path.splice(1)],
			};
		} else if (rmType === "document") {
			let path1 = Heriverse.findShortestValidPath(
				startNodeType,
				Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_DOC
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_DOC,
				endNodeType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections],
				path: [...path1.path, ...path2.path.splice(1)],
			};
		} else if (rmType === "special_find") {
			let path1 = Heriverse.findShortestValidPath(
				startNodeType,
				Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_SF
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.REPRESENTATION_MODEL_SF,
				endNodeType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections],
				path: [...path1.path, ...path2.path.splice(1)],
			};
		}
	} else if (
		(startNodeType === Heriverse.CONNECTION_RULES_NODETYPES.STRATIGRAPHIC ||
			startNodeType === Heriverse.CONNECTION_RULES_NODETYPES.SPECIAL_FIND_UNIT) &&
		endNodeType === Heriverse.CONNECTION_RULES_NODETYPES.LINK &&
		Editor.state.currShelfElement &&
		(Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.IMAGE ||
			Editor.state.currShelfElement.dataset.contentType === ShelfNode.CONTENT_TYPE.DOCUMENT)
	) {
		if (rmType === "document") {
			let path1 = Heriverse.findShortestValidPath(
				startNodeType,
				Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT
			);
			let path2 = Heriverse.findShortestValidPath(
				Heriverse.CONNECTION_RULES_NODETYPES.DOCUMENT,
				endNodeType
			);
			pathToCreate = {
				connections: [...path1.connections, ...path2.connections],
				path: [...path1.path, ...path2.path.splice(1)],
			};
		}
	} else pathToCreate = Heriverse.findShortestValidPath(startNodeType, endNodeType);

	if (pathToCreate) {
		buildSteps();
		buildProgressBar();
		updateButtons();
	} else {
		console.trace();
		alert("Non è possibile creare un path.");
		return;
	}
}
