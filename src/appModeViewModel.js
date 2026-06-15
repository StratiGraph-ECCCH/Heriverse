export function getMode() {
	return Heriverse.MODE;
}

export function getModeTypes() {
	return Heriverse.MODETYPES;
}

export function isEditorMode() {
	return Heriverse.MODE === Heriverse.MODETYPES.EDITOR;
}

export function isViewerMode() {
	return Heriverse.MODE !== Heriverse.MODETYPES.EDITOR;
}
