let isEditing = false;
let isCreating = true;
let selectedIndex = -1;

export function reset() {
	isEditing = false;
	isCreating = true;
	selectedIndex = -1;
}

export function startCreate() {
	isEditing = false;
	isCreating = true;
	selectedIndex = -1;
}

export function startView() {
	isEditing = false;
	isCreating = false;
}

export function startEdit(index) {
	isEditing = true;
	isCreating = false;
	selectedIndex = index;
}

export function finishCreate() {
	isCreating = false;
}

export function finishEdit() {
	isEditing = false;
	selectedIndex = -1;
}

export function isEditMode() {
	return isEditing;
}

export function isCreateMode() {
	return isCreating;
}

export function getSelectedIndex() {
	return selectedIndex;
}
