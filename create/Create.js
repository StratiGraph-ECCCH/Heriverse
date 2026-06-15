"use strict";
/**
@namespace Create
*/

let Create = {};
window.Create = Create;

Create.APP = ATON.App.realize();
ATON.AuthOptions = {
	basepath: "heriverse",
	scenesPage: "a/heriverse/scenes",
};
Create.visibility = "private";
Create.editors = [];
Create.viewers = [];

Create.APP.requireFlares(["Auth"]);
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

Create.init = () => {
	Create.APP.setup = () => {
		ATON.FE.realize();
		ATON.on("AllFlaresReady", () => {
			let paramSID = ATON.FE.urlParams.get("scene");
			if (paramSID) {
				Create.heriverseId = paramSID;
				Create.editHeriverse();
			} else {
				Create.createHeaderAndFooter();
				Create.initSelect2("editors-select", Create.editors, []);
				Create.initSelect2("viewers-select", Create.viewers, []);
				Create.hidePreloader();
				if (!window.trad) {
					window.trad = new Translate({
						defaultLocale: "it",
						supportedLocales: ["it", "en"],
						langSwitcherSelector: "#lang-switcher",
					});
				}
			}
		});
	};
	Create.APP.run();
};

Create.editHeriverse = () => {
	if (Create.heriverseId) {
		ATON.Flares["Auth"].canEditScene(Create.heriverseId).then((isEditor) => {
			if (!isEditor) {
				window.location.href = Utils.baseUrl + "/login";
			} else {
				$.ajax({
					dataType: "json",
					url: Utils.baseHost + "heriverse/scene/" + Create.heriverseId,
					headers: { authServer: "DIGILAB" },
					xhrFields: { withCredentials: true },
					success: (data) => {
						Create.Heriverse = data;
						Create.setForm();
						Create.createHeaderAndFooter(Create.Heriverse.title);
						Create.hidePreloader();
						Create.initSelect2("editors-select", Create.editors, Create.Heriverse.editors);
						Create.initSelect2("viewers-select", Create.viewers, Create.Heriverse.viewers);
						if (!window.trad) {
							window.trad = new Translate({
								defaultLocale: "it",
								supportedLocales: ["it", "en"],
								langSwitcherSelector: "#lang-switcher",
							});
						}
					},
				});
			}
		});
	}
};

Create.setForm = () => {
	document.getElementById("resource_upload").style.display = "none";
	document.getElementById("name-input-it").value = Create.Heriverse.title || "";
	document.getElementById("name-input-en").value = Create.Heriverse["title-en"] || "";
	document.getElementById("description-input-it").value = Create.Heriverse["description-it"] || "";
	document.getElementById("description-input-en").value = Create.Heriverse["description-en"] || "";
	document.getElementById("project-thumbnail-input").value = "";
	if (Create.Heriverse.visibility == "public") {
		Create.setPublic();
	} else {
		Create.setPrivate();
	}
	if (Create.Heriverse["thumbnail"]) {
		let imgPreview = document.getElementById("preview");
		if (imgPreview) {
			imgPreview.src = Create.Heriverse["thumbnail"];
			imgPreview.style.display = "block";
		}
	}
};

Create.initSelect2 = (idSelect, list, users) => {
	$("#" + idSelect).select2({
		placeholder: "Seleziona visualizzatori tramite email",
		allowClear: true,
		data: [],
	});

	$("#" + idSelect).select2({
		placeholder: "Cerca un utente",
		minimumInputLength: 3,
		ajax: {
			transport: function (params, success, failure) {
				const term = params.data.q || "";
				ATON.Flares["Auth"]
					.getUsersList(term)
					.then((results) => {
						if (results && Array.isArray(results)) {
							const filteredResults = results.filter((user) => !list.includes(user._id));
							const formattedResults = filteredResults.map((user) => ({
								id: user._id,
								text: `${user.name} ${user.surname} (${user.email})`,
							}));

							success({ results: formattedResults });
						} else {
							console.error("Formato di risposta non valido o 'docs' è undefined", results);
							success({ results: [] });
						}
					})
					.catch((error) => {
						console.error("Errore durante la chiamata:", error);
						success({ results: [] });
					});
			},
			processResults: function (data) {
				return data;
			},
		},
	});

	$("#" + idSelect).on("select2:select", function (e) {
		const userId = e.params.data.id;
		list.push(userId);
	});

	$("#" + idSelect).on("select2:unselect", function (e) {
		const userId = e.params.data.id;
		list.splice(list.indexOf(userId), 1);				
	});

	for (let i = 0; i < users.length; i++) {
		let opt = new Option(
			`${users[i].name} ${users[i].surname} (${users[i].email})`,
			users[i]._id,
			true,
			true,
		);
		document.getElementById(idSelect).append(opt);
		list.push(users[i]._id);
	}
};

Create.createHeaderAndFooter = (m_title) => {
	let headerParams = {
		title: "HERIVERSE",
		titleColor: "rgba(230, 176, 70, 1)",
		subtitleColor: "rgba(244, 244, 244, 1)",
		logos: [Utils.baseUrl + "/assets/logo/heriverse_logo_horizontal.png"],
		logosLabels: ["HERIVERSE"],
		logosUrl: [Utils.baseUrl + "/scenes/"],
		icons: ["../assets/icons/header/Ita.svg"],
		iconsLabels: ["Lingua italiana"],
	};

	AUTH.createHeader("createHeader", headerParams);

	let footerPageJson = {
		main_logos: [Utils.baseUrl + "/assets/icons/footer/heriverse_logo_horizontal.png"],
		main_logos_labels: ["HERIVERSE"],
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
	AUTH.createFooter("createFooter", footerPageJson);
};

Create.setPublic = () => {
	$("#public_button").addClass("visibility-active");
	$("#private_button").removeClass("visibility-active");
	Create.visibility = "public";
};

Create.setPrivate = () => {
	$("#public_button").removeClass("visibility-active");
	$("#private_button").addClass("visibility-active");
	Create.visibility = "private";
};

Create.hidePreloader = () => {
	$("#preloader").fadeOut(500, function () {
		$("#Page").fadeIn(500);
	});
};

Create.showPreloader = () => {
	$("#Page").fadeOut(500, function () {
		$("#preloader").fadeIn(500);
	});
};

Create.createEmptyScene = (title) => {
	let scene = {
		scene: {
			title: title,
			environment: {
				mainpano: { url: "samples/pano/defsky-grass.jpg" },
				lightprobes: { auto: "true" },
				mainlight: {
					direction: ["0.0", "0.0", "0.0"],
				},
			},
			viewpoints: {},
			scenegraph: {
				nodes: {},
				edges: {
					".": [],
				},
			},
		},
	};
	return scene;
};

Create.createNewHeriverse = async () => {
	if (Create.Heriverse) {
		Create.updateHeriverse();
		return;
	}
	$("#loading").show();
	await sleep(100);
	let name = document.getElementById("name-input-it").value;
	let name_en = document.getElementById("name-input-en").value;
	let description_it = document.getElementById("description-input-it").value;
	let description_en = document.getElementById("description-input-en").value;
	let newScene = Create.createNewScene(name);
	let panorama = null;
	let panorama_url = "samples/pano/defsky-grass.jpg";
	let thumbnail_url = "";
	if (panorama != null && panorama.length == 1) {
		panorama_url = Create.uploadResource(panorama);
	}
	let thumbnail_input = document.getElementById("project-thumbnail-input").files;
	if (thumbnail_input != null && thumbnail_input.length == 1) {
		thumbnail_url = Create.uploadResource(thumbnail_input)[0];
		if (Create.Heriverse) {
			Create.Heriverse.thumbnail = thumbnail_url;
		}
	}
	let zip = document.getElementById("zip-file").files;
	let kgraph = null;
	let resourcePath = "";
	if (zip.length == 1) {
		let uploadedZIP = Create.uploadZip(zip);
		kgraph = uploadedZIP.multigraph;
		if (!kgraph.graphs["shelf"] || Object.keys(kgraph.graphs["shelf"]).length <= 0)
			kgraph.graphs["shelf"] = {
				name: {
					default: "Resource Shelf",
				},
				description: {},
				data: {
					shelf_type: "global",
				},
				nodes: {},
				edges: {},
			};

		resourcePath = uploadedZIP.path;
	}

	newScene.scene.environment.mainpano = { url: panorama_url[0] };
	let newKgraph = kgraph || Create.createKGraph(name);
	let resource_json = newScene.scene;
	resource_json.multigraph = newKgraph;
	let data = {
		editors: Create.editors,
		viewers: Create.viewers,
		title: name,
		"title-it": name,
		"title-en": name_en,
		"description-it": description_it,
		"description-en": description_en,
		resource_json: resource_json,
		thumbnail: thumbnail_url,
		tag: [],
		categories: [],
		visibility: Create.visibility,
		resource_path: resourcePath,
	};

	$.ajax({
		type: "POST",
		url: Utils.baseHost + "heriverse/scene/",
		contentType: "application/json",
		data: JSON.stringify(data),
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		success: function (response) {
			window.location.href = "/a/heriverse/editor/?scene=" + response._id;
		},
		error: function (error) {
			console.log(error);
		},
		fail: function (failed) {
			console.log(failed);
		},
		complete: function () {
			$("#loading").hide();
		},
	});
};

Create.updateHeriverse = async () => {
	let name = document.getElementById("name-input-it").value;
	let name_en = document.getElementById("name-input-en").value;
	let description_it = document.getElementById("description-input-it").value;
	let description_en = document.getElementById("description-input-en").value;
	Create.Heriverse.title = name;
	Create.Heriverse.resource_json.title = name;
	Create.Heriverse.visibility = Create.visibility;
	let thumbnail_url = "";
	let thumbnail_input = document.getElementById("project-thumbnail-input").files;
	if (thumbnail_input != null && thumbnail_input.length == 1) {
		thumbnail_url = Create.uploadResource(thumbnail_input)[0];
		Create.Heriverse.thumbnail = thumbnail_url;
	}
	Create.Heriverse.editors = Create.editors;
	Create.Heriverse.viewers = Create.viewers;
	Create.Heriverse.visibility = Create.visibility;
	if (Create.Heriverse.creator && Create.Heriverse.creator._id) {
		Create.Heriverse.creator = Create.Heriverse.creator._id;
	}
	let data = {
		editors: Create.editors,
		viewers: Create.viewers,
		title: Create.Heriverse.title,
		"title-it": name,
		"title-en": name_en,
		"description-it": description_it,
		"description-en": description_en,
		resource_json: Create.Heriverse.resource_json,
		thumbnail: Create.Heriverse.thumbnail_url,
		tag: [],
		categories: [],
		visibility: Create.visibility,
		resourcePath: Create.Heriverse.resource_path,
	};
	$.ajax({
		type: "PUT",
		url: Utils.baseHost + "heriverse/scene/",
		contentType: "application/json",
		data: JSON.stringify(Create.Heriverse),
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		success: function (response) {
			window.location.href = "/a/heriverse/editor/?scene=" + response._id;
		},
		error: function (error) {
			console.log(error);
		},
		fail: function (failed) {
			console.log(failed);
		},
		complete: function () {
			$("#loading").hide();
		},
	});
};

Create.createNewScene = (title) => {
	return Create.createEmptyScene(title);
};

Create.createNewSKG = () => {
	return Create.createKGraph("Prova nuovo grafo");
};

Create.createKGraph = (
	title,
	description = "",
	license = "",
	authors = [],
	embargo_until = "",
	panorama = "",
) => {
	const randomId = crypto.randomUUID();

	const kgraph = {
		context: {},
		graphs: {},
	};

	kgraph.graphs[randomId] = {
		name: title,
		description: description,
		defaults: {},
		nodes: {},
		edges: {},
	};

	if (!kgraph.graphs["shelf"] || Object.keys(kgraph.graphs["shelf"]).length <= 0)
		kgraph.graphs["shelf"] = {
			name: {
				default: "Resource Shelf",
			},
			description: {},
			data: {
				shelf_type: "global",
			},
			nodes: {},
			edges: {},
		};

	kgraph.graphs[randomId].defaults["license"] = license;
	kgraph.graphs[randomId].defaults["authors"] = authors;
	kgraph.graphs[randomId].defaults["embargo_until"] = embargo_until;
	kgraph.graphs[randomId].defaults["panorama"] = panorama;

	return kgraph;
};

Create.uploadZip = (zip) => {
	let ret = "";
	let formData = new FormData();
	for (let i = 0; i < zip.length; i++) {
		formData.append("file", zip[i]);
	}

	$.ajax({
		type: "POST",
		url: Utils.baseHost + "heriverse/upload-heriverse-zip",
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		data: formData,
		processData: false,
		contentType: false,
		async: false,
		success: function (response) {
			ret = response.content;
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error("Errore nella richiesta:", textStatus, errorThrown);
			reject(new Error("Errore nel caricamento della risorsa"));
		},
	});
	return ret;
};

Create.uploadResource = (files) => {
	let ret = "";
	let formData = new FormData();
	for (let i = 0; i < files.length; i++) {
		formData.append("files", files[i]);
	}

	$.ajax({
		type: "POST",
		url: Utils.baseHost + "heriverse/upload",
		headers: { authServer: "DIGILAB" },
		xhrFields: { withCredentials: true },
		data: formData,
		processData: false,
		contentType: false,
		async: false,
		success: function (response) {
			ret = response.files;
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error("Errore nella richiesta:", textStatus, errorThrown);
			reject(new Error("Errore nel caricamento della risorsa"));
		},
	});
	return ret;
};

export default Create;
