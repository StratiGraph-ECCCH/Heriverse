export async function toggleFullscreenById(id) {
	const element = document.getElementById(id);

	if (!element) return;

	try {
		if (document.fullscreenElement) {
			await document.exitFullscreen();
		} else {
			await element.requestFullscreen();
		}
	} catch (err) {
		console.error("Fullscreen non disponibile:", err);
	}
}

export function getModelViewerFromControlsElement(element) {
	return element?.closest("div.mVContainer")?.querySelector("model-viewer") || null;
}

export function getBackgroundColor(modelViewerElement) {
	if (!modelViewerElement) return "#ffffff";

	return $(modelViewerElement).css("background-color");
}

export function setBackgroundColor(modelViewerElement, color) {
	if (!modelViewerElement) return;

	$(modelViewerElement).css("background-color", color);
}

export function isAutoRotateEnabled(modelViewerElement) {
	return !!modelViewerElement?.hasAttribute("auto-rotate");
}

export function setAutoRotate(modelViewerElement, enabled) {
	if (!modelViewerElement) return;

	modelViewerElement.toggleAttribute("auto-rotate", enabled);
}

export function areCameraControlsEnabled(modelViewerElement) {
	return !!modelViewerElement?.hasAttribute("camera-controls");
}

export function setCameraControls(modelViewerElement, enabled) {
	if (!modelViewerElement) return;

	modelViewerElement.toggleAttribute("camera-controls", enabled);
}
