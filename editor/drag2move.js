document.addEventListener("DOMContentLoaded", () => {
	const panels = [
		"right-panel",
		"shelf-panel",
		"workspace-panel",
		"tranPan-panel",
		"scene-control-panel",
		"users-panel",
	];
	panels.forEach((id) => dragElement(document.getElementById(id)));

	function dragElement(elmnt) {
		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;
		const topBarRect = document.getElementById("container-bar").getBoundingClientRect();

		const header = document.getElementById(elmnt.id + "-header");
		(header || elmnt).onmousedown = dragMouseDown;
		(header || elmnt).onpointerdown = dragMouseDown;

		function dragMouseDown(e) {
			e.preventDefault();
			pos3 = e.clientX;
			pos4 = e.clientY;

			document.onmouseup = closeDragElement;
			document.onpointerup = closeDragElement;
			document.onmousemove = elementDrag;
			document.onpointermove = elementDrag;

			// Porta in primo piano il pannello attivo
			document.querySelectorAll("[id$='-panel']").forEach((elem) => (elem.style.zIndex = 1));
			elmnt.style.zIndex = 5;
		}

		function elementDrag(e) {
			e.preventDefault();

			const elementBox = elmnt.getBoundingClientRect();
			const topCenterBox = document.getElementById("top-center").getBoundingClientRect();

			const workspaceW = window.innerWidth;
			const workspaceH = window.innerHeight;
			const topLimit = topBarRect.bottom;
			const leftLimit = 0;
			const rightLimit = workspaceW - elmnt.offsetWidth;
			const bottomLimit = workspaceH - elmnt.offsetHeight;
			const headerMargin = topCenterBox.bottom - 110;

			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			let newLeft = elmnt.offsetLeft - pos1;
			let newTop = elmnt.offsetTop - pos2;

			newLeft = Math.max(
				leftLimit + elementBox.width / 2,
				Math.min(newLeft, rightLimit + elementBox.width / 2)
			);
			newTop = Math.max(
				topLimit + elementBox.height / 2 + headerMargin,
				Math.min(newTop, bottomLimit + elementBox.height / 2)
			);

			elmnt.style.left = (newLeft * 100) / workspaceW + "%";
			elmnt.style.top = (newTop * 100) / workspaceH + "%";
		}

		function closeDragElement() {
			document.onmouseup = null;
			document.onpointerup = null;
			document.onmousemove = null;
			document.onpointermove = null;
		}
	}
});
