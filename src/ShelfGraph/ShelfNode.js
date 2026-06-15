import MGNode from "../Multigraph/MGnode.js";

export default class ShelfNode extends MGNode {
	static NODE_TYPE = {
		LINK: "link",
		AUTHOR: "author",
	};

	static CONTENT_TYPE = {
		MODEL_3D: "3d_model",
		IMAGE: "image",
		DOCUMENT: "doc",
	};

	setNodeInfo(id, type, name, data, author = "", license = "", creation = "", thumbnail = null) {
		let _id = id || crypto.randomUUID();
		super.setNodeInfo(_id, type, name, data.description, data);
		this.author = author;
		this.license = license;
		this.creation = creation;
		this.thumbnail = thumbnail;
	}
}
