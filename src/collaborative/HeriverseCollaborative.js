import HeriverseCollaborativeEvents from "./HeriverseCollaborativeEvents.js";
import HeriverseEvents from "../HeriverseEvents.js";

let HeriverseCollaborative = {};

window.HeriverseCollaborative = HeriverseCollaborative;

HeriverseCollaborative.sessionId = undefined;
HeriverseCollaborative._videoStreamIntervalId = null;
HeriverseCollaborative._audioStreamIntervalId = null;

HeriverseCollaborative.init = () => {
	HeriverseCollaborative.sessionId = ATON.FE.urlParams.get("vrid");
	HeriverseCollaborative.setupEventHandler();
};

HeriverseCollaborative.createSessionID = () => {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	const generate = (n) =>
		Array.from({ length: n }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
			""
		);

	return `${generate(3)}-${generate(4)}-${generate(3)}`;
};

HeriverseCollaborative.realizeStreamPanel = (userid) => {
	let vs = ATON.MediaFlow.getOrCreateVideoStream(userid, undefined, true);

	HeriverseCollaborative._elVStream = vs.el;
	let gStream = new THREE.PlaneGeometry(3.2, -1.8);

	HeriverseCollaborative.mStream = new THREE.Mesh(gStream, vs.matStream);

	let yratio = 0.5625;

	HeriverseCollaborative._elVStream.addEventListener("loadedmetadata", (e) => {});

	let screenNode = HeriverseCollaborative.mStream;
	screenNode.name = "screenNode" + userid;
	screenNode.position.set(5, 5, 5);
	ATON._mainRoot.add(screenNode);

	if (ATON.Photon.uid === userid) {
		HeriverseCollaborative.gizmoControls = new THREE.TransformControls(
			ATON.Nav._camera,
			ATON._renderer.domElement
		);
		HeriverseCollaborative.gizmoControls.attach(HeriverseCollaborative.mStream);
		ATON._mainRoot.add(HeriverseCollaborative.gizmoControls.getHelper());
		HeriverseCollaborative.gizmoControls.addEventListener("dragging-changed", (e) => {
			if (ATON.Nav._controls) {
				ATON.Nav._controls.enabled = !e.value;
			}
		});
		HeriverseCollaborative.gizmoControls.addEventListener("change", () => {
			ATON._renderer.render(ATON._mainRoot, ATON.Nav._camera);
			let data = {
				object: HeriverseCollaborative.mStream.name,
				position: {
					x: HeriverseCollaborative.mStream.position.x,
					y: HeriverseCollaborative.mStream.position.y,
					z: HeriverseCollaborative.mStream.position.z,
				},
				rotation: {
					x: HeriverseCollaborative.mStream.rotation.x,
					y: HeriverseCollaborative.mStream.rotation.y,
					z: HeriverseCollaborative.mStream.rotation.z,
				},
				scale: {
					x: HeriverseCollaborative.mStream.scale.x,
					y: HeriverseCollaborative.mStream.scale.y,
					z: HeriverseCollaborative.mStream.scale.z,
				},
			};
			ATON.fireEvent("objectPositionChanged", data);
		});
		HeriverseCollaborative.gizmoControls.setMode("translate");
	}
};

HeriverseCollaborative.waitVideoStream = () => {
	if (HeriverseCollaborative._videoStreamIntervalId !== null) return;

	HeriverseCollaborative._videoStreamIntervalId = setInterval(() => {
		if (ATON.MediaFlow._bScreenStream) {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.MY_VIDEO_START);
			HeriverseCollaborative.stopVideoStreamWatcher();
		}
	}, 1000);
};

HeriverseCollaborative.stopVideoStreamWatcher = () => {
	if (HeriverseCollaborative._videoStreamIntervalId !== null) {
		clearInterval(HeriverseCollaborative._videoStreamIntervalId);
		HeriverseCollaborative._videoStreamIntervalId = null;
	}
};

HeriverseCollaborative.waitAudioStream = () => {
	if (HeriverseCollaborative._audioStreamIntervalId !== null) return;

	HeriverseCollaborative._audioStreamIntervalId = setInterval(() => {
		if (ATON.MediaFlow._bAudioStreaming) {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.SETUP_AUDIO_STREAM);
			HeriverseCollaborative.stopAudioStreamWatcher();
		}
	}, 1000);
};

HeriverseCollaborative.stopAudioStreamWatcher = () => {
	if (HeriverseCollaborative._audioStreamIntervalId !== null) {
		clearInterval(HeriverseCollaborative._audioStreamIntervalId);
		HeriverseCollaborative._audioStreamIntervalId = null;
	}
};

HeriverseCollaborative.setupEventHandler = () => {
	ATON.on("EMLoaded", (e) => {
		if (ATON.Photon.isConnected() && false) {
		} else if (HeriverseCollaborative.sessionId) {
			ATON.Photon.connect(HeriverseCollaborative.sessionId);
			ATON.fireEvent(
				HeriverseCollaborativeEvents.Events.JOIN_SESSION,
				HeriverseCollaborative.sessionId
			);
		} else {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.INIT_COLLABORATIVE_UI);
		}
	});

	ATON.on(HeriverseCollaborativeEvents.Events.START_NEW_SESSION, () => {
		HeriverseCollaborative.sessionId = HeriverseCollaborative.createSessionID();
		ATON.Photon.connect(HeriverseCollaborative.sessionId);
		const url = new URL(window.location.href);
		url.searchParams.set("vrid", HeriverseCollaborative.sessionId);
		window.history.replaceState({}, "", url.toString());
		ATON.Photon.setUsername(
			localStorage.getItem("user_name") || "User- " + localStorage.getItem("user_surname") || "0"
		);
		ATON.fireEvent(
			HeriverseCollaborativeEvents.Events.JOIN_SESSION,
			HeriverseCollaborative.sessionId
		);
	});

	ATON.on("VRC_Connected", () => {});

	ATON.on("VRC_Disconnected", () => {});

	ATON.on("VRC_IDassigned", (uid) => {
		ATON.Photon.setUsername(
			localStorage.getItem("user_name") || "User- " + localStorage.getItem("user_surname") || "0"
		);
	});

	ATON.on("VRC_UserEnter", (uid) => {
		return;
	});

	ATON.on("VRC_UMessage", (data) => {
		let A = ATON.Photon.touchAvatar(data.uid);
		let params = {
			msg: data.msg,
			uname: A.getUsername(),
			uid: data.uid,
		};
		ATON.fireEvent(HeriverseCollaborativeEvents.Events.MESSAGE_RECEIVED, params);
	});

	ATON.on("VRC_UName", (data) => {
		let params = {
			msg: "E' entrato nella sessione",
			uname: data.name,
			uid: data.uid,
		};
		ATON.fireEvent(HeriverseCollaborativeEvents.Events.MESSAGE_RECEIVED, params);
	});

	ATON.on("VRC_UserLeave", (uid) => {
		//if (uElements[uid]) uElements[uid].hide();
	});

	ATON.on(HeriverseCollaborativeEvents.Events.START_VIDEO_STREAM, () => {
		ATON.MediaFlow._cScreenStream.video.width.max = 1080;
		ATON.MediaFlow._cScreenStream.video.height.max = 720;
		ATON.MediaFlow.startScreenStreaming();
		//HeriverseCollaborative.waitVideoStream();
	});

	ATON.on(HeriverseCollaborativeEvents.Events.START_AUDIO_STREAM, () => {
		ATON.MediaFlow.startAudioStreaming();
		HeriverseCollaborative.waitAudioStream();
	});

	ATON.on(HeriverseCollaborativeEvents.Events.STOP_AUDIO_STREAM, () => {
		HeriverseCollaborative.stopAudioStreamWatcher();
		ATON.MediaFlow.stopAudioStreaming();
	});

	ATON.on(HeriverseCollaborativeEvents.Events.STOP_VIDEO_STREAM, () => {
		//HeriverseCollaborative.stopVideoStreamWatcher();
		ATON.MediaFlow.stopScreenStreaming();
		HeriverseCollaborative.mStream.visible = false;
		HeriverseCollaborative.gizmoControls.detach(HeriverseCollaborative.mStream);
		ATON._mainRoot.remove(HeriverseCollaborative.gizmoControls.getHelper());
		ATON._mainRoot.remove(HeriverseCollaborative.mStream);
		HeriverseCollaborative.mStream = null;
		HeriverseCollaborative.gizmoControls = null;
		ATON.fireEvent(HeriverseCollaborativeEvents.Events.MY_VIDEO_STOP);
	});

	ATON.on(HeriverseCollaborativeEvents.Events.MY_VIDEO_START, () => {
		if (!HeriverseCollaborative.mStream) {
			HeriverseCollaborative.realizeStreamPanel(ATON.Photon.uid);
		} else if (HeriverseCollaborative.mStream) {
			HeriverseCollaborative.mStream.visible = true;
		}

		HeriverseCollaborative._elVStream.src = document.getElementById(
			"uStream" + ATON.Photon.uid
		).src;
		if (HeriverseCollaborative._elVStream.paused) HeriverseCollaborative._elVStream.play();
		document.getElementById("uStream" + ATON.Photon.uid).style.display = "none";
	});

	ATON.on(HeriverseCollaborativeEvents.Events.USERNAME_CHANGE, (changeNameInputSelector) => {
		const newUsername = $(changeNameInputSelector).val();
		if (!newUsername || !newUsername.trim()) return;
		$(changeNameInputSelector)[0].placeholder = "Change name: " + $(changeNameInputSelector).val();
		$(changeNameInputSelector)[0].value = "";
		ATON.Photon.setUsername(newUsername.trim());
	});

	ATON.on("objectPositionChanged", (data) => {
		ATON.Photon.fire("setPosition", data);
	});

	ATON.on("VRC_UVideo", (data) => {
		let b64 = data.video;
		let uid = data.uid;

		if (!HeriverseCollaborative.mStream) {
			HeriverseCollaborative.realizeStreamPanel(uid);
		} else if (HeriverseCollaborative.mStream) {
			HeriverseCollaborative.mStream.visible = true;
		}

		HeriverseCollaborative._elVStream.src = b64;
		if (HeriverseCollaborative._elVStream.paused) HeriverseCollaborative._elVStream.play();
	});

	ATON.Photon.on("setPosition", (data) => {
		for (let i in ATON._mainRoot.children) {
			let c = ATON._mainRoot.children[i];
			if (c.name === data.object) {
				c.position.set(data.position.x, data.position.y, data.position.z);
				c.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
				c.scale.set(data.scale.x, data.scale.y, data.scale.z);
			}
		}
	});

	ATON.on(HeriverseEvents.Events.PHOTON_EVENT, (data) => {
		ATON.Photon.fire(HeriverseEvents.Events.PHOTON_EVENT, data);
	});
	ATON.Photon.on(HeriverseEvents.Events.PHOTON_EVENT, (data) => {
		ATON.fireEvent(data.event, data.object);
	});

	ATON.on("VRC_UVideeo", (data) => {
		let b64 = data.video;
		/*
            //if (!elV[0].paused) elV[0].pause();

            elV[0].src = b64;

            //elV[0].currentTime = 1;
            elV[0].play();
*/
		let v = (vID + 1) % 2;
		elV[v].src = b64;

		//elVid.src = b64;

		//elVid.currentTime = 0;
		//elVid.play();

		//if (elVid.paused && elVid.readyState ==4 || !elVid.paused) elVid.play();
		//elVid.play();

		elV[v].style.zIndex = "20";
		elV[vID].style.zIndex = "10";
		elV[vID].pause();

		elV[v].currentTime = 0;
		elV[v].play();

		vID = v;

		/*
            vchunks.push(data.video);

            if (!elVid.pause) return;

            let v = vchunks.shift();

            elVid.src = v;
            elVid.oncanplay = ()=>{ elVid.play(); };
*/
	});

	ATON.on("MediaFlow_ScreenStream", (streaming) => {
		if (streaming) {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.MY_VIDEO_START);
		} else {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.STOP_VIDEO_STREAM);
		}
	});

	ATON.on("MediaFlow_AudioStream", (streaming) => {
		if (streaming) {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.MY_VIDEO_START);
		} else {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.STOP_VIDEO_STREAM);
		}
	});

	ATON.on("KeyDown", (k) => {
		if (k === "v") {
			if (HeriverseCollaborative.gizmoControls) {
				const modes = ["translate", "rotate", "scale"];
				const currentMode = HeriverseCollaborative.gizmoControls.getMode();
				const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
				HeriverseCollaborative.gizmoControls.setMode(modes[nextIndex]);
			}
		}
	});
};
