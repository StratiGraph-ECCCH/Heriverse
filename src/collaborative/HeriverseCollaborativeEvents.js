export default class HeriverseCollaborativeEvents {
	static Events = Object.freeze({
		START_NEW_SESSION: "Start_New_Session",
		CREATED_SESSION: "Created_Session",
		JOIN_SESSION: "Join_Session",
		INIT_COLLABORATIVE_UI: "Init_Collaborative_UI",
		MESSAGE_RECEIVED: "Message_Received",
		SETUP_AUDIO_STREAM: "Setup_Audio_Stream",
		START_AUDIO_STREAM: "Start_Audio_Stream",
		STOP_AUDIO_STREAM: "Stop_Audio_Stream",
		START_VIDEO_STREAM: "Start_Video_Stream",
		STOP_VIDEO_STREAM: "Stop_Video_Stream",
		MY_VIDEO_START: "Start_My_Video",
		MY_VIDEO_STOP: "Stop_My_Video",
		USERNAME_CHANGE: "Username_Change",
	});
}
