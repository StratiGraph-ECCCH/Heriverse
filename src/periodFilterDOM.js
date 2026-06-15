export function getPeriodFilterRootFromEvent(e) {
	return (
		e.target.closest("#periodSectionPanel, #idTL") ||
		e.currentTarget?.closest?.("#periodSectionPanel, #idTL") ||
		document.querySelector("#idTL")
	);
}

export function getPeriodFilterValuesFromRoot(root, defaults = {}) {
	const defaultStart = defaults.start ?? 0;
	const defaultEnd = defaults.end ?? 1000;

	const startInput = root?.querySelector("#startPeriodFilterForm");
	const endInput = root?.querySelector("#endPeriodFilterForm");

	return {
		start: startInput?.value ? parseInt(startInput.value) : defaultStart,
		end: endInput?.value ? parseInt(endInput.value) : defaultEnd,
		hasStart: !!startInput?.value,
		hasEnd: !!endInput?.value,
	};
}

export function getPeriodFilterElementsFromRoot(root) {
	return {
		periodSelectButton: root?.querySelector("#periodSelectorFilter"),
		startPeriodForm: root?.querySelector("#startPeriodFilterForm"),
		endPeriodForm: root?.querySelector("#endPeriodFilterForm"),
		editFilterButton: root?.querySelector("#periodEditButton"),
		resetOption: root?.querySelector("#periodSelectorFilter + ul p[data-index='0']"),
		selectedOption: root?.querySelector("#periodSelectorFilter + ul p.selected"),
	};
}

export function getPeriodFilterElementsFromEvent(e) {
	const root = getPeriodFilterRootFromEvent(e);

	return {
		root,
		...getPeriodFilterElementsFromRoot(root),
	};
}

export function isPeriodPanelRoot(root) {
	return root?.id === "periodSectionPanel";
}

function normalizeTimelinePeriodDomId(id) {
	if (!id) return "";

	const stringId = String(id);

	return stringId.startsWith("tp") ? stringId : "tp" + stringId;
}

export function updateSelectedPeriodDropdown(id, mobile = false) {
	const root = mobile
		? document.querySelector("#periodSectionPanel")
		: document.querySelector("#idTL");

	if (!root) return;

	const periodDomId = normalizeTimelinePeriodDomId(id);

	const liElement = root.querySelector("#" + periodDomId);
	if (!liElement) return;

	const pElement = liElement.querySelector("p");
	if (!pElement) return;

	const color = getComputedStyle(pElement).getPropertyValue("--p-item-bg");
	const dropdown = root.querySelector("#dropdownMenu2");

	if (!dropdown) return;

	dropdown.innerHTML = liElement.textContent;
	dropdown.style.setProperty("--selected-bg", color);
}
