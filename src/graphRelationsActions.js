import HeriverseNode from "./HeriverseGraph/HeriverseNode.js";
import HeriverseGraphDrawer from "./HeriverseGraphDrawer.js";

export function getAvailableRelations() {
	return Object.values(HeriverseNode.RELATIONS).map((relation) => ({
		value: relation,
		label: HeriverseNode.RELATION_LABELS[relation] || relation,
	}));
}

export function getRelationsCount() {
	return Object.values(HeriverseNode.RELATIONS).length;
}

export function getActiveRelations() {
	return HeriverseGraphDrawer.activeRelations;
}

export function isRelationActive(relation) {
	return HeriverseGraphDrawer.activeRelations.includes(relation);
}

export function areAllRelationsActive() {
	return getActiveRelations().length === getRelationsCount();
}

export function setAllRelationsActive(active) {
	const activeRelations = HeriverseGraphDrawer.activeRelations;

	activeRelations.length = 0;

	if (!active) return;

	Object.values(HeriverseNode.RELATIONS).forEach((relation) => {
		activeRelations.push(relation);
	});
}

export function toggleRelation(relation) {
	const activeRelations = HeriverseGraphDrawer.activeRelations;
	const relationIndex = activeRelations.indexOf(relation);

	if (relationIndex >= 0) {
		activeRelations.splice(relationIndex, 1);
	} else {
		activeRelations.push(relation);
	}

	return isRelationActive(relation);
}

export function setActiveRelations(relations = []) {
	const validRelations = Object.values(HeriverseNode.RELATIONS);
	const activeRelations = HeriverseGraphDrawer.activeRelations;

	activeRelations.length = 0;

	relations.forEach((relation) => {
		if (validRelations.includes(relation)) {
			activeRelations.push(relation);
		}
	});
}

export function getRelationPresets() {
	return [
		{
			label: "Preset 1",
			relations: [
				HeriverseNode.RELATIONS.IS_AFTER,
				HeriverseNode.RELATIONS.IS_BEFORE,
				HeriverseNode.RELATIONS.HAS_SAME_TIME,
				HeriverseNode.RELATIONS.HAS_FIRST_EPOCH,
				HeriverseNode.RELATIONS.SURVIVE_IN_EPOCH,
			],
		},
		{
			label: "Preset 2",
			relations: [
				HeriverseNode.RELATIONS.CHANGED_FROM,
				HeriverseNode.RELATIONS.CONTRASTS_WITH,
				HeriverseNode.RELATIONS.COMBINES,
				HeriverseNode.RELATIONS.EXTRACTED_FROM,
				HeriverseNode.RELATIONS.GENERIC_CONNECTION,
			],
		},
		{
			label: "Preset 3",
			relations: [
				HeriverseNode.RELATIONS.HAS_PROPERTY,
				HeriverseNode.RELATIONS.HAS_LINKED_RESOURCE,
				HeriverseNode.RELATIONS.HAS_DOCUMENTATION,
				HeriverseNode.RELATIONS.HAS_AUTHOR,
				HeriverseNode.RELATIONS.HAS_DATA_PROVENANCE,
			],
		},
	];
}
