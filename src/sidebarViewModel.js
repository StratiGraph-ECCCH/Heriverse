import HeriverseNode from "./HeriverseGraph/HeriverseNode.js";
import HeriverseEvents from "./HeriverseEvents.js";

export function getSidebarAuthorsLabel(node) {
	const authorIds = Array.isArray(node.authors) ? node.authors : [];

	if (!authorIds.length) return "";

	const authors = Object.values(Heriverse.currMG?.nodesByIndex || {}).filter((candidate) => {
		return (
			candidate.type === HeriverseNode.NODE_TYPE.AUTHOR && authorIds.includes(candidate.data?.orcid)
		);
	});

	return authors
		.map((author) => (author.data ? `${author.data.name} ${author.data.surname}` : author.name))
		.join(", ");
}

export function getLinkedResources(node) {
	if (!node || typeof node.getNeighborsByRelationP !== "function") return [];

	const linkedResources =
		node.getNeighborsByRelationP(
			HeriverseNode.RELATIONS.HAS_LINKED_RESOURCE,
			HeriverseNode.DIRECTIONS.TO
		) || {};

	return Object.values(linkedResources);
}

export function getRelationLabel(relationKey) {
	return HeriverseNode.RELATION_LABELS[relationKey.toLowerCase()] || relationKey.toLowerCase();
}

export function getRelationNodes(node, relation) {
	if (!node || typeof node.getNeighborsByRelationP !== "function") return [];

	const relationNodes = node.getNeighborsByRelationP(relation, HeriverseNode.DIRECTIONS.BOTH) || {};

	return Object.values(relationNodes);
}

export function getRelationGroups(node) {
	if (!node) return [];

	const groups = [];

	for (const key in HeriverseNode.RELATIONS) {
		const relation = HeriverseNode.RELATIONS[key];
		const nodes = getRelationNodes(node, relation);

		if (!nodes.length) continue;

		groups.push({
			key,
			relation,
			label: getRelationLabel(key),
			nodes,
		});
	}

	return groups;
}

export function getNodeIconType(node) {
	return Heriverse.NODETYPES[node.type?.toUpperCase()] || node.type?.toUpperCase();
}

export function getNodeIconUrl(node) {
	return Heriverse.getIconURLbyType(getNodeIconType(node));
}

export function getSidebarNodeEvent(node) {
	return node?.type !== "document"
		? HeriverseEvents.Events.SHOW_SEMANTIC_NODE
		: HeriverseEvents.Events.SHOW_DOCUMENT_LINK;
}

export function getResourceNodeUrl(node) {
	return node?.data?.url || "";
}

export function getResolvedResourceUrl(node) {
	const url = getResourceNodeUrl(node);

	if (!url) return "";

	return Heriverse.getLinkToResource(url);
}

export function getNodeMainImageUrl(node) {
	if (!node?.url) return "";

	return Heriverse.getLinkToResource(node.url);
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg"];
const MODEL_EXTENSIONS = ["glb", "gltf"];

function getFileExtension(link = "") {
	try {
		return ATON.Utils.getFileExtension(link);
	} catch (e) {
		return "";
	}
}

export function isImageResource(link) {
	return IMAGE_EXTENSIONS.includes(getFileExtension(link));
}

export function isModelResource(link) {
	return MODEL_EXTENSIONS.includes(getFileExtension(link));
}
