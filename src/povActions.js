export function getCurrentPov() {
	return ATON.Nav.copyCurrentPOV();
}

export function getPovList() {
	return Heriverse._povList || [];
}

export function getPovAtIndex(index) {
	return getPovList()[Number(index)] || null;
}

export function parsePovVector(value) {
	if (Array.isArray(value)) return value;

	return String(value)
		.split(",")
		.map((component) => parseFloat(component.trim()));
}

export function createPovFromValues(values) {
	if (!values) return null;

	const pov = new ATON.POV();

	pov.name = values.name;
	pov.pos.set(...parsePovVector(values.pos));
	pov.target.set(...parsePovVector(values.target));
	pov.setFOV(parseFloat(values.fov));

	return pov;
}

export function addPovFromValues(values) {
	const pov = createPovFromValues(values);

	if (!pov) return null;

	Heriverse.addPovToList(pov);

	return pov;
}

export function updatePovAtIndex(index, values) {
	const pov = getPovAtIndex(index);

	if (!pov || !values) return null;

	pov.name = values.name;
	pov.pos.set(...parsePovVector(values.pos));
	pov.target.set(...parsePovVector(values.target));
	pov.setFOV(parseFloat(values.fov));

	if (Heriverse.MODE === Heriverse.MODETYPES.EDITOR) {
		Heriverse.updateViewpoints();
	}

	return pov;
}

export function removePovAtIndex(index) {
	Heriverse.removePOVFromList(Number(index));
}

export function requestPovFromValues(values) {
	const pov = createPovFromValues(values);

	if (!pov) return null;

	ATON.Nav.requestPOV(pov);

	return pov;
}
