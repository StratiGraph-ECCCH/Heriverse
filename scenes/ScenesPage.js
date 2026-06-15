"use strict";

/**
@namespace ScenesPage
*/

let ScenesPage = {};
window.ScenesPage = ScenesPage;
let APP = ATON.App.realize();
let basepath = "heriverse";
let open_card_callback = "ScenesPage.goToScene";

import HERUI from "../src/ui.js";

APP.setup = () => {
	ATON.FE.realize();
	APP.requireFlares("Auth");

	ATON.on("AllFlaresReady", () => {});

	ATON.on("AUTH_Scenes_Loaded", () => {
		ScenesPage.hidePreloader();
		new Translate({
			defaultLocale: "en",
			supportedLocales: ["en", "it"],
			langSwitcherSelector: "#lang-switcher",
		});
	});
};

ScenesPage.hidePreloader = () => {
	$("#preloader").fadeOut(500, function () {
		$("#Page").fadeIn(500);
	});
};

ScenesPage.init = () => {
	let footerPageJson = {
		main_logos: [Utils.baseUrl + "/assets/icons/footer/heriverse_logo_horizontal.png"],
		main_logos_labels: ["Heriverse"],
		main_logos_urls: [Utils.baseUrl + "/scenes"],
		other_logos: [
			Utils.baseUrl + "/assets/icons/footer/H2_logo_white.svg",
			Utils.baseUrl + "/assets/icons/footer/DIGILAB_white.svg",
		],
		other_logos_urls: ["#", "#"],
		other_logos_labels: ["H2IOSC", "DIGILAB"],
		left_side_links: { obiettivi: "#", istituti: "#" },
		right_side_links: { cookies: "#", privacy: "#" },
		down_side_text: "",
		footer_background_color: "rgba(52, 67, 115, 1)",
		footer_text_color: "white",
		footer_downside_background_color: "rgba(68, 88, 151, 1)",
	};

	ATON.AuthOptions = {
		basepath: basepath,
		open_card_callback: open_card_callback,
		logo_pilot_header: Utils.baseUrl + "/assets/logo/heriverse_logo_horizontal.png",
		logo_pilot_footer: Utils.baseUrl + "/assets/logo/heriverse_logo_horizontal.svg",
		logo_pilot_url_header: Utils.pilotSite,
		logo_pilot_label_header: "Heriverse",
		logo_pilot_label_footer: "Heriverse",
		header_title: "WELCOME_TO_HERIVERSE",
		header_subtitle: "SELECT_SCENE",
		open_card_label: "OPEN_SCENE",
		search_params: ["title"],
		footer_json: footerPageJson,
		sortBy: "title",
	};
	APP.requireFlares(["Auth"]);
	APP.run();
	//ScenesPage.loadTags();

	if (!window.trad) {
		console.log("TRAD");
		window.trad = new Translate({
			defaultLocale: "it",
			supportedLocales: ["it", "en"],
			langSwitcherSelector: "#lang-switcher",
		});
	}
	window.trad.init();
	window.trad.updateTexts();

	// Accessibility
	HERUI.setupFontSizeAccessibility();
};

ScenesPage.searchScene = () => {
	let par = document.getElementById("search-field").value;
	if (par != null && par != "") {
		AUTH.scenesFilter(par);
	}
};

ScenesPage.goToLoginPage = () => {
	window.location.assign(Utils.baseUrl + "/login");
};
ScenesPage.goToScene = (id) => {
	id = String(id);
	window.location.assign(Utils.baseUrl + "/?scene=" + id);
};

/**
 * This function allows closed card to appear after the click event.
 *
 * @param {any} panelToActivate
 */
function toggleAccordion(panelToActivate) {
	const buttons = panelToActivate.parentElement.querySelectorAll(".accordion-trigger");
	const contents = panelToActivate.parentElement.querySelectorAll(".accordion-content");

	buttons.forEach((button) => {
		button.setAttribute("aria-expanded", false);
	});

	contents.forEach((content) => {
		content.setAttribute("hidden", true);
	});

	panelToActivate.querySelector(".accordion-trigger").setAttribute("aria-expanded", true);
	panelToActivate.querySelector(".accordion-content").removeAttribute("hidden");
}

/**
 * This function allows opened card to disappear after the click event.
 *
 * @param {any} activePanel
 */
function closeAccordion(activePanel) {
	if (activePanel.classList.contains("accordion-panel")) {
		activePanel.querySelector(".accordion-trigger").ariaExpanded = false;
		activePanel.querySelector(".accordion-content").setAttribute("hidden", true);
	}
}

let currentPage = 1;
let scenesPerPage = 4;
let totElems = document.querySelectorAll(".accordion-panel").length;

/**
 * This function set the paging's section up. This building process is related to the GUI structure.
 *
 * @param {number} PageNumber
 * @param {number} PageSize
 * @param {number} TotalRecords
 * @param {string} ClassName
 * @param {string} PageUrl
 * @param {string} DisableClassName
 * @returns
 */
function Paging(PageNumber, PageSize, TotalRecords, ClassName, PageUrl, DisableClassName) {
	var ReturnValue = "";
	var TotalPages = Math.ceil(TotalRecords / PageSize);

	ReturnValue = ReturnValue + "<select id='numElemSelector' class='numElemSelector'>";
	for (let j of [4, 8, 12]) {
		if (scenesPerPage === j) {
			ReturnValue =
				ReturnValue + "<option class='selectorElem' value='" + j + "' selected>" + j + "</option>";
		} else {
			ReturnValue =
				ReturnValue + "<option class='selectorElem' value='" + j + "'>" + j + "</option>";
		}
	}
	ReturnValue = ReturnValue + "</select>";

	ReturnValue = ReturnValue + "<div class='link-container'>";

	if (+PageNumber > 1) {
		if (+PageNumber == 2)
			ReturnValue =
				ReturnValue +
				"<a id='prev' href='#'" +
				+"' class='" +
				ClassName +
				"'> << </a>&nbsp;&nbsp;&nbsp;";
		else {
			ReturnValue = ReturnValue + "<a id='prev' href='#'";
			ReturnValue =
				ReturnValue +
				" pn=" +
				(+PageNumber - 1) +
				"' class='" +
				ClassName +
				"'> << </a>&nbsp;&nbsp;&nbsp;";
		}
	} else
		ReturnValue =
			ReturnValue +
			"<span id='prev' class='" +
			DisableClassName +
			"'> << </span>&nbsp;&nbsp;&nbsp;";

	if (+PageNumber - 1 > 1) {
		if (+PageNumber == 3) {
			ReturnValue =
				ReturnValue +
				"<a href='#'" +
				"' class='" +
				ClassName +
				"' data-page='1'>1</a>&nbsp;|&nbsp;";
			ReturnValue =
				ReturnValue +
				"<a href='#'" +
				"' class='" +
				ClassName +
				"' data-page='2'>2</a>&nbsp;|&nbsp;";
		} else
			ReturnValue =
				ReturnValue +
				"<a href='#'" +
				"' class='" +
				ClassName +
				"' data-page='1'>1</a>&nbsp;.....&nbsp;|&nbsp;";
	}

	for (var i = +PageNumber - 1; i <= +PageNumber; i++) {
		if (i >= 1) {
			if (+PageNumber != i) {
				if (+PageNumber == 3 && i == 2) {
				} else {
					ReturnValue = ReturnValue + "<a href='#'";
					ReturnValue =
						ReturnValue +
						"pn=" +
						i +
						"' class='" +
						ClassName +
						"' data-page='" +
						i +
						"'>" +
						i +
						"</a>&nbsp;|&nbsp;";
				}
			} else {
				ReturnValue =
					ReturnValue +
					"<span style='font-weight:bold;' data-page='" +
					i +
					"'>" +
					i +
					"</span>&nbsp;|&nbsp;";
			}
		}
	}
	for (var i = +PageNumber + 1; i <= +PageNumber + 1; i++) {
		if (i <= TotalPages) {
			if (+PageNumber != i) {
				if (+PageNumber == TotalPages - 2 && i == TotalPages - 1) {
				} else {
					ReturnValue = ReturnValue + "<a href='#'";
					ReturnValue =
						ReturnValue +
						"pn=" +
						i +
						"' class='" +
						ClassName +
						"' data-page='" +
						i +
						"'>" +
						i +
						"</a>&nbsp;|&nbsp;";
				}
			} else {
				ReturnValue =
					ReturnValue +
					"<span style='font-weight:bold;' data-page='" +
					i +
					"'>" +
					i +
					"</span>&nbsp;|&nbsp;";
			}
		}
	}
	if (+PageNumber + 1 < TotalPages) {
		if (+PageNumber + 2 < TotalPages) {
			ReturnValue = ReturnValue + ".....&nbsp;<a href='#'";
			ReturnValue =
				ReturnValue +
				"pn=" +
				TotalPages +
				"' class='" +
				ClassName +
				"' data-page='" +
				TotalPages +
				"'>" +
				TotalPages +
				"</a>";
		} else {
			ReturnValue =
				ReturnValue +
				"<a href='#'" +
				"' class='" +
				ClassName +
				"' data-page='" +
				(TotalPages - 1) +
				"'>" +
				(TotalPages - 1) +
				"</a>&nbsp;|&nbsp;";
			ReturnValue =
				ReturnValue +
				"<a href='#'" +
				"' class='" +
				ClassName +
				"' data-page='" +
				TotalPages +
				"'>" +
				TotalPages +
				"</a>&nbsp;|&nbsp;";
		}
	}
	if (+PageNumber < TotalPages) {
		ReturnValue = ReturnValue + "&nbsp;&nbsp;&nbsp;<a id='nxt' href='#'";
		ReturnValue = ReturnValue + "pn=" + (+PageNumber + 1) + "' class='" + ClassName + "'> >> </a>";
	} else
		ReturnValue =
			ReturnValue + "&nbsp;&nbsp;&nbsp;<span id='nxt' class='" + DisableClassName + "'> >> </span>";

	ReturnValue = ReturnValue + "</div>";

	return ReturnValue;
}

/**
 * This function makes visible the scenes according to the page reported as parameter.
 *
 * @param {number} page
 */
function displayPage(page) {
	const startIndex = (page - 1) * scenesPerPage;
	const endIndex = startIndex + scenesPerPage;
	let scenes;
	if (document.querySelectorAll(".accordion-panel").length)
		scenes = document.querySelectorAll(".accordion-panel");
	else {
		scenes = document.querySelectorAll(".link-element");
	}

	scenes.forEach((scene, index) => {
		if (index >= startIndex && index < endIndex) {
			scene.style.display = "block";
		} else {
			scene.style.display = "none";
		}
	});
}

/**
 * This function refresh the section containing the pagination's elements according
 * to the current context.
 */
function updatePagination() {
	const totalPages = Math.ceil(totElems / scenesPerPage);
	const prevButton = document.getElementById("prev");
	const nxtButton = document.getElementById("nxt");
	const pageLinks = document.querySelectorAll(".page-link");

	prevButton.disabled = currentPage === 1;
	nxtButton.disabled = currentPage === totalPages;
	pageLinks.forEach((link) => {
		const page = parseInt(link.getAttribute("data-page"));
		link.classList.toggle("active", page === currentPage);
	});
}

/**
 * This function is necessary to add event listeners related to the elements.
 */
function setupListeners() {
	let totalPages = Math.ceil(totElems / scenesPerPage);

	const prevButton = document.getElementById("prev");
	const nxtButton = document.getElementById("nxt");
	const linkButtons = document.querySelectorAll("[data-page]");
	const numElemSelector = document.getElementById("numElemSelector");

	prevButton.addEventListener("click", () => {
		if (currentPage > 1) {
			currentPage--;
			var result = Paging(
				currentPage,
				scenesPerPage,
				totElems,
				"myClass",
				"index.html",
				"myDisableClass"
			);
			document.getElementById("pagingDiv").innerHTML = result;
			setupListeners();
			displayPage(currentPage);
			updatePagination();
		}
	});

	nxtButton.addEventListener("click", () => {
		if (currentPage < totalPages) {
			currentPage++;
			var result = Paging(
				currentPage,
				scenesPerPage,
				totElems,
				"myClass",
				"index.html",
				"myDisableClass"
			);
			document.getElementById("pagingDiv").innerHTML = result;
			setupListeners();
			displayPage(currentPage);
			updatePagination();
		}
	});

	linkButtons.forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			const page = parseInt(link.getAttribute("data-page"));
			if (page !== currentPage) {
				currentPage = page;
				var result = Paging(
					currentPage,
					scenesPerPage,
					totElems,
					"myClass",
					"index.html",
					"myDisableClass"
				);
				document.getElementById("pagingDiv").innerHTML = result;
				setupListeners();
				displayPage(currentPage);
				updatePagination();
			}
		});
	});

	numElemSelector.addEventListener("change", () => {
		scenesPerPage = parseInt(numElemSelector.value);
		totalPages = Math.ceil(totElems / scenesPerPage);
		currentPage = 1;
		var result = Paging(
			currentPage,
			scenesPerPage,
			totElems,
			"myClass",
			"index.html",
			"myDisableClass"
		);
		document.getElementById("pagingDiv").innerHTML = result;
		setupListeners();
		displayPage(currentPage);
		updatePagination();
	});
}

const container = document.getElementById("data-container");

function parsingPanels() {
	const accordionPanels = document
		.getElementById("data-container")
		.querySelectorAll(".accordion-panel");
	container.classList.toggle("row");

	let newListView = "";

	accordionPanels.forEach((panel) => {
		newListView = newListView + "<div class='list-element'>";
		newListView = newListView + "<div class='first-panel'>" + "</div>";
		newListView = newListView + "<div class='second-panel'>";
		newListView = newListView + "<div class='card-top'>";
		newListView = newListView + "<h2>" + panel.querySelector("h2 span").innerHTML + "</h2>";
		newListView =
			newListView +
			"<div class='" +
			panel.getElementsByClassName("data-create")[0].className +
			"'>" +
			panel.getElementsByClassName("data-create")[0].innerHTML +
			"</div>";
		newListView = newListView + "</div>";
		newListView = newListView + "<div class='card-center'>";
		newListView = newListView + "<center>";
		newListView =
			newListView +
			"<i class='fa-solid fa-chevron-circle-right open-scene' aria-hidden='true'>" +
			"</i>";
		newListView = newListView + "</center>";
		newListView = newListView + "</div>";
		newListView = newListView + "<div class='card-bottom'>";
		newListView =
			newListView +
			"<div class='" +
			panel.getElementsByClassName("author-name")[0].className +
			"'>" +
			panel.getElementsByClassName("author-name")[0].innerHTML +
			"</div>";
		newListView = newListView + "</div>";
		newListView = newListView + "</div>";
		newListView = newListView + "</div>";
	});

	return newListView;
}
