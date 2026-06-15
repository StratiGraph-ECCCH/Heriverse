import Utils from "../../config/Utils.js";
import HeriverseCollaborativeEvents from "./HeriverseCollaborativeEvents.js";
import HeriverseEvents from "../HeriverseEvents.js";

let HeriverseCollaborativeUI = {};

HeriverseCollaborativeUI._users = {};

HeriverseCollaborativeUI.upsertUser = (uid, name) => {
	if (uid == null) return;
	HeriverseCollaborativeUI._users[uid] = { uid, name };
	HeriverseCollaborativeUI.renderUsers();
};

HeriverseCollaborativeUI.removeUser = (uid) => {
	delete HeriverseCollaborativeUI._users[uid];
	HeriverseCollaborativeUI.renderUsers();
};

HeriverseCollaborativeUI.renderUsers = () => {
	const list = document.getElementById("users-panel-list");
	const countEl = document.getElementById("users-panel-count");
	if (!list) return;

	list.innerHTML = "";
	const users = Object.values(HeriverseCollaborativeUI._users);

	if (countEl) countEl.textContent = users.length;

	users.forEach(({ uid, name }) => {
		const isSelf = uid === ATON.Photon.uid;
		const initial = name ? name.charAt(0).toUpperCase() : "?";
		const displayName = name || "Utente " + uid;

		const li = document.createElement("li");
		li.className = "users-panel-item" + (isSelf ? " users-panel-item--self" : "");
		li.innerHTML = `
            <div class="users-panel-avatar">${initial}</div>
            <span class="users-panel-name">${displayName}${isSelf ? " (tu)" : ""}</span>
        `;
		list.appendChild(li);
	});
};

HeriverseCollaborativeUI.videoStreaming = false;

window.HeriverseCollaborativeUI = HeriverseCollaborativeUI;
HeriverseCollaborativeUI.init = () => {
	HeriverseCollaborativeUI.setupEventHandler();
};

HeriverseCollaborativeUI.createNewSessionButton = (containerId, event) => {
	const button = document.createElement("button");
	// button.className = "collaborative-button-dark";
	button.className = "tbIconButton icon-button";
	button.setAttribute("data-i18n-tooltip", "CREATE_NEW_SESSION");
	button.addEventListener("click", () => {
		ATON.fireEvent(HeriverseCollaborativeEvents.Events.START_NEW_SESSION);
		$("img[src$='coop.png']").toggleClass("d-none d-block");
		$("img[src$='coop-active.png']").toggleClass("d-none d-block");
		button.toggleAttribute("disabled");

		// User panel
		document.getElementById("users-panel").classList.add("active");

		const usersPanel = document.getElementById("users-panel");
		const usersHeader = document.getElementById("users-panel-header");
		if (usersHeader && usersPanel) {
			usersHeader.addEventListener("click", () => {
				usersPanel.classList.toggle("collapsed");
			});
		}
	});

	const iconBase = document.createElement("img");
	iconBase.className = "icon-base";
	iconBase.src = Utils.baseUrl + "/assets/icons/coop.png";

	const iconActive = document.createElement("img");
	iconActive.className = "d-none icon-active";
	iconActive.src = Utils.baseUrl + "/assets/icons/coop-active.png";

	button.appendChild(iconBase);
	button.appendChild(iconActive);

	document.getElementById(containerId).appendChild(button);
};

HeriverseCollaborativeUI.changeUsernameUI = (containerId) => {
	const container = document.getElementById(containerId);
	if (!container) return console.error("Container non trovato");

	container.classList.add("d-flex", "my-1");

	let myName = localStorage.getItem("user_name");

	let containerContent = `
		<input id="changeNicknameInput" type="text" class="form-control" placeholder="Change name: ${myName}" onkeypress="if(event.key === 'Enter')ATON.fire('${HeriverseCollaborativeEvents.Events.USERNAME_CHANGE}', '#changeNicknameInput');">
		<button class="btn btn-primary" onclick="ATON.fire('${HeriverseCollaborativeEvents.Events.USERNAME_CHANGE}', '#changeNicknameInput');">Submit</button>
	`;

	container.innerHTML = containerContent;
};

HeriverseCollaborativeUI.createVideoStreamUI = (containerId) => {
	const container = document.getElementById(containerId);
	if (!container) return console.error("Container non trovato");
	HeriverseCollaborativeUI.videoStreaming = false;
	const btn = document.createElement("div");
	btn.classList.add("streaming-button");

	btn.id = "videoStreamButton";
	btn.innerHTML = `<i id="videoStreamingIcon" class="fas fa-display" style="color:red"></i> `;
	container.appendChild(btn);
	let videoStreamingIcon = document.querySelector("#videoStreamingIcon");
	videoStreamingIcon.addEventListener("click", () => {
		if (!HeriverseCollaborativeUI.videoStreaming) {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.START_VIDEO_STREAM);
		} else {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.STOP_VIDEO_STREAM);
		}
	});
	container.appendChild(btn);
};

HeriverseCollaborativeUI.startStopVideoStream = (streaming) => {
	HeriverseCollaborativeUI.videoStreaming = streaming;
	const icon = document.querySelector("#videoStreamingIcon");
	icon.style.color = streaming ? "green" : "red";
};

HeriverseCollaborativeUI.createAudioStreamUI = (containerId) => {
	const container = document.getElementById(containerId);
	if (!container) return console.error("Container non trovato");

	const btn_audio = document.createElement("div");
	btn_audio.classList.add("streaming-button");
	btn_audio.id = "audioStreamButton";
	btn_audio.innerHTML = `<i id="audioStreamingIcon" class="fas fa-microphone-slash" style="color:red"></i> `;
	container.appendChild(btn_audio);
	let audioStreamingIcon = document.querySelector("#audioStreamingIcon");
	audioStreamingIcon.addEventListener("click", () => {
		if (!HeriverseCollaborativeUI.streamingAudio) {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.START_AUDIO_STREAM);
		} else {
			ATON.fireEvent(HeriverseCollaborativeEvents.Events.STOP_AUDIO_STREAM);
			HeriverseCollaborativeUI.deleteMicrophoneSelect();
		}
	});

	container.appendChild(btn_audio);
};

HeriverseCollaborativeUI.deleteMicrophoneSelect = () => {
	HeriverseCollaborativeUI.streamingAudio = false;

	const icon = document.querySelector("#audioStreamingIcon");
	icon.classList.remove("fa-microphone");
	icon.classList.add("fa-microphone-slash");
	icon.style.color = "red";
	const div = document.getElementById("microphoneSelectContainer");
	if (div) {
		div.parentNode.removeChild(div);
	}
};

HeriverseCollaborativeUI.createMicrophoneSelect = async function (containerId) {
	HeriverseCollaborativeUI.streamingAudio = true;
	const icon = document.querySelector("#audioStreamingIcon");
	icon.classList.add("fa-microphone");
	icon.classList.remove("fa-microphone-slash");
	icon.style.color = "green";

	const container = document.getElementById(containerId);
	if (!container) return console.error("Container non trovato");

	const div = document.createElement("div");
	div.id = "microphoneSelectContainer";
	div.style.position = "relative";
	div.style.float = "inline-end";
	const gearIcon = document.createElement("i");
	gearIcon.className = "fas fa-gear";
	gearIcon.style.cursor = "pointer";
	gearIcon.style.fontSize = "1.5rem";

	const dropdown = document.createElement("ul");
	dropdown.id = "microphoneDropdown";

	const select = document.createElement("select");
	select.style.display = "none";

	const devices = await navigator.mediaDevices.enumerateDevices();
	const mics = devices.filter((d) => d.kind === "audioinput");

	mics.forEach((mic, index) => {
		const option = document.createElement("option");
		option.value = mic.deviceId;
		option.textContent = mic.label || `Microfono ${index + 1}`;
		select.appendChild(option);

		const li = document.createElement("li");
		li.style.padding = "0.5rem";
		li.style.cursor = "pointer";

		const micLabel = mic.label || `Microfono ${index + 1}`;
		const checkSpan = document.createElement("span");
		checkSpan.textContent = index === 0 ? "✓" : "";
		checkSpan.style.marginRight = "0.5rem";

		li.appendChild(checkSpan);
		li.appendChild(document.createTextNode(micLabel));

		li.addEventListener("mouseover", () => (li.style.background = "#666"));
		li.addEventListener("mouseout", () => (li.style.background = "#333"));

		li.addEventListener("click", () => {
			dropdown.querySelectorAll("li span").forEach((span) => {
				span.textContent = "";
			});

			checkSpan.textContent = "✓";

			select.value = mic.deviceId;
			dropdown.style.display = "none";
			ATON.MediaFlow._cAuStream.audio.deviceId = mic.deviceId;
			ATON.MediaFlow.stopAudioStream();
			ATON.MediaFlow.startAudioStream();
		});

		dropdown.appendChild(li);
	});

	gearIcon.addEventListener("click", () => {
		dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
	});

	document.addEventListener("click", (e) => {
		if (!div.contains(e.target)) {
			dropdown.style.display = "none";
		}
	});

	div.appendChild(gearIcon);
	div.appendChild(dropdown);
	div.appendChild(select);
	container.appendChild(div);
};

HeriverseCollaborativeUI.createSessionChat = (containerId) => {
	document.getElementById(containerId).innerHTML = `
    <div class="accordion" id="chatAccordion">
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingChat">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseChat" aria-expanded="true" aria-controls="collapseChat">
            Collaborative session: ${HeriverseCollaborativeUI.sessionId}
          </button>
        </h2>
        <div id="collapseChat" class="accordion-collapse collapse show" aria-labelledby="headingChat" data-bs-parent="#chatAccordion">
          <div class="accordion-body">
            <div id="chat-box" style="display: flex;flex-direction: column;max-height: 300px; overflow-y: auto; margin-bottom: 15px;"></div>
            <input type="text" id="message-input" class="form-control" placeholder="Scrivi un messaggio...">
            <div class="input-group" id="chat-input-group">
              <button class="btn btn-primary" id="send-btn">Invia</button>
            </div>
          </div>
        </div>
      </div>
    </div>
	<div id="change-username-section">
	</div>
    <div id="streaming-buttons">
    </div>
  `;
	let chatBox = document.getElementById("chat-box");
	let input = document.getElementById("message-input");
	let sendBtn = document.getElementById("send-btn");
	sendBtn.addEventListener("click", () => {
		const msg = input.value.trim();
		if (!msg) return;
		HeriverseCollaborativeUI.addMessage(msg, {
			username: ATON.Photon._username,
			id: ATON.Photon.uid,
		});
		ATON.Photon.setMessage(msg);
		input.value = "";
	});
	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			sendBtn.click();
			event.preventDefault();
		}
	});

	const exportBtn = document.createElement("button");
	exportBtn.className = "btn btn-secondary";
	exportBtn.textContent = "Esporta chat";
	exportBtn.style.float = "right";
	exportBtn.style.marginLeft = "5px";
	exportBtn.onclick = () => {
		const chatBox = document.getElementById("chat-box");
		let lines = [];
		chatBox.querySelectorAll(".chat-message").forEach((msg) => {
			let user = msg.querySelector(".avatar") ? msg.querySelector(".avatar").textContent : "System";
			let text = msg.querySelector(".message-box")
				? msg.querySelector(".message-box").textContent
				: msg.textContent;
			lines.push(`[${user}] ${text}`);
		});
		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `chat_${HeriverseCollaborativeUI.sessionId || "session"}.txt`;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 0);
	};
	document.getElementById("chat-input-group").appendChild(exportBtn);
};

HeriverseCollaborativeUI.addButtonToCopySessionLink = (containerId) => {
	const container = document.getElementById(containerId);
	if (!container) return;

	const copyBtn = document.createElement("div");
	copyBtn.id = "copy-session-link-btn";
	copyBtn.className = "chat-message system";
	copyBtn.title = "Copia link sessione";
	copyBtn.innerHTML = `<i class="fas fa-share-alt"></i> Copia il link della sessione`;
	copyBtn.addEventListener("click", () => {
		const sessionLink = `${window.location}`;
		navigator.clipboard
			.writeText(sessionLink)
			.then(() => {
				alert("Link della sessione copiato negli appunti!");
			})
			.catch((err) => {
				console.error("Errore nella copia del link: ", err);
				alert("Impossibile copiare il link della sessione.");
			});
	});

	container.appendChild(copyBtn);
};

HeriverseCollaborativeUI.addMessage = (text, sender) => {
	const chatBox = document.getElementById("chat-box");
	let isCurrentUser = false;
	if (sender != null) {
		isCurrentUser = sender.id === ATON.Photon.uid;
	}

	const side = isCurrentUser ? "right" : "left";

	const messageEl = document.createElement("div");
	messageEl.className = sender ? `chat-message ${side}` : "chat-message system";
	messageEl.innerHTML = `
    ${
			sender && sender.username && !isCurrentUser
				? `<div class="avatar">${sender.username.charAt(0)}</div>`
				: ""
		}
    <div class="message-box">${text}</div>
    ${
			sender && sender.username && isCurrentUser
				? `<div class="avatar">${sender.username.charAt(0)}</div>`
				: ""
		}
  `;

	chatBox.appendChild(messageEl);
	chatBox.scrollTop = chatBox.scrollHeight;
};

HeriverseCollaborativeUI.setupEventHandler = () => {
	ATON.on("VRC_UName", (data) => {
		HeriverseCollaborativeUI.upsertUser(data.uid, data.name);
	});

	ATON.on("VRC_UserLeave", (uid) => {
		HeriverseCollaborativeUI.removeUser(uid);
	});

	ATON.on("VRC_IDassigned", (uid) => {
		const myName = localStorage.getItem("user_name") || "Io";
		HeriverseCollaborativeUI.upsertUser(uid, myName);
	});

	ATON.on(HeriverseCollaborativeEvents.Events.INIT_COLLABORATIVE_UI, (e) => {
		HeriverseCollaborativeUI.createNewSessionButton("toolbar-right");
	});

	ATON.on(HeriverseCollaborativeEvents.Events.MY_VIDEO_START, () => {
		HeriverseCollaborativeUI.startStopVideoStream(true);
	});

	ATON.on(HeriverseCollaborativeEvents.Events.MY_VIDEO_STOP, () => {
		HeriverseCollaborativeUI.startStopVideoStream(false);
	});

	ATON.on(HeriverseCollaborativeEvents.Events.SETUP_AUDIO_STREAM, () => {
		HeriverseCollaborativeUI.createMicrophoneSelect("audioStreamButton");
	});

	ATON.on(HeriverseCollaborativeEvents.Events.JOIN_SESSION, (sessionId) => {
		HeriverseCollaborativeUI.sessionId = sessionId;
		HeriverseCollaborativeUI.createSessionChat("collaborativeSection");
		HeriverseCollaborativeUI.addButtonToCopySessionLink("chat-box");
		HeriverseCollaborativeUI.addMessage("Benvenuto nella sessione: " + sessionId, null);
		HeriverseCollaborativeUI.createVideoStreamUI("streaming-buttons");
		HeriverseCollaborativeUI.createAudioStreamUI("streaming-buttons");
		HeriverseCollaborativeUI.changeUsernameUI("change-username-section");

		const myName = localStorage.getItem("user_name") || "Io";
		if (ATON.Photon.uid != null) {
			HeriverseCollaborativeUI.upsertUser(ATON.Photon.uid, myName);
		}
	});

	ATON.on(HeriverseCollaborativeEvents.Events.MESSAGE_RECEIVED, (params) => {
		let user = null;
		if (params.uname != null) {
			user = {
				id: params.uid,
				username: params.uname,
			};
		}
		HeriverseCollaborativeUI.addMessage(params.msg, user);
	});
};
