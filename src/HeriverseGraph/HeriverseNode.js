/**
 * Class representing a node of the graph
 * @class HeriverseGraph
 */

import MGNode from "../Multigraph/MGnode.js";

export default class HeriverseNode extends MGNode {
	static RELATIONS = {
		IS_BEFORE: "is_before",
		IS_AFTER: "is_after",
		HAS_SAME_TIME: "has_same_time",
		CHANGED_FROM: "changed_from",
		HAS_DATA_PROVENANCE: "has_data_provenance",
		CONTRASTS_WITH: "contrasts_with",
		HAS_FIRST_EPOCH: "has_first_epoch",
		SURVIVE_IN_EPOCH: "survive_in_epoch",
		HAS_ACTIVITY: "has_activity",
		IS_IN_ACTIVITY: "is_in_activity",
		HAS_PROPERTY: "has_property",
		EXTRACTED_FROM: "extracted_from",
		COMBINES: "combines",
		IS_IN_TIMEBRANCH: "is_in_timebranch",
		HAS_TIMEBRANCH: "has_timebranch",
		HAS_AUTHOR: "has_author",
		HAS_GEOPOSITION: "has_geoposition",
		HAS_LINKED_RESOURCE: "has_linked_resource",
		HAS_REPRESENTATION_MODEL: "has_representation_model",
		HAS_REPRESENTATION_MODEL_DOC: "has_representation_model_doc",
		HAS_REPRESENTATION_MODEL_SF: "has_representation_model_sf",
		HAS_SEMANTIC_SHAPE: "has_semantic_shape",
		IS_IN_PARADATA_NODEGROUP: "is_in_paradata_nodegroup",
		HAS_PARADATA_NODEGROUP: "has_paradata_nodegroup",
		GENERIC_CONNECTION: "generic_connection",
		HAS_EMBARGO: "has_embargo",
		HAS_LICENSE: "has_license",
	};

	static RELATION_LABELS = {
		is_before: "Chronological Sequence",
		is_after: "Chronological Sequence",
		has_same_time: "Contemporaneous Elements",
		changed_from: "Temporal Transformation",
		has_data_provenance: "Data Provenance",
		contrasts_with: "Contrasting Time Branches",
		has_first_epoch: "Has First Epoch",
		survive_in_epoch: "Survives In Epoch",
		has_activity: "Part of Activity",
		has_property: "Has Property",
		extracted_from: "Extracted From",
		combines: "Combines",
		has_timebranch: "Included in Timebranch",
		generic_connection: "Generic Connection",
		has_author: "Has author",
		has_geoposition: "Has geoposition",
		has_linked_resource: "Has a linked resource",
		has_representation_model: "Has a representation 3D model",
		has_semantic_shape: "Has Semantic Shape",
	};

	static DIRECTIONS = {
		FROM: "from",
		TO: "to",
		BOTH: "both",
	};

	static TYPE = {
		AUTHORS: "authors",
		STRATIGRAPHIC: "stratigraphic",
		EPOCHS: "epochs",
		GROUPS: "groups",
		PROPERTIES: "properties",
		DOCUMENTS: "documents",
		EXTRACTORS: "extractors",
		COMBINERS: "combiners",
		LINKS: "links",
		GEO: "geo",
		SEMANTIC_SHAPES: "semantic_shapes",
		REPRESENTATION_MODELS: "representation_models",
		REPRESENTATION_MODEL_DOC: "representation_model_doc",
		REPRESENTATION_MODEL_SF: "representation_model_sf",
		PANORAMA_MODELS: "panorama_models",
	};

	static NODE_TYPE = {
		AUTHOR: "author",
		STRATIGRAPHIC: "stratigraphic",
		EPOCH: "EpochNode", // epoch
		GROUP: "group",
		PROPERTY: "property",
		DOCUMENT: "document",
		EXTRACTOR: "extractor",
		COMBINER: "combiner",
		LINK: "link",
		GEO: "geo_position",
		SEMANTIC_SHAPE: "semantic_shape",
		REPRESENTATION_MODEL: "representation_model",
		REPRESENTATION_MODEL_DOC: "representation_model_doc",
		REPRESENTATION_MODEL_SF: "representation_model_sf",
		PANORAMA_MODEL: "panorama_model",
		ACTIVITY_NODE_GROUP: "ActivityNodeGroup",
		PARADATA_NODE_GROUP: "ParadataNodeGroup",
	};

	static STRATIGRAPHIC_TYPE = {
		US: "US",
		USVs: "USVs",
		SF: "SF",
		USVn: "USVn",
		USD: "USD",
		SERSU: "serSU",
		SERUSVS: "serUSVs",
		SERUSVN: "serUSVn",
		UTR: "UTR",
		VSF: "VSF",
		TSU: "TSU",
		SE: "SE",
	};

	static NODE_TYPE_LABEL = {
		AUTHOR: "Author",
		STRATIGRAPHIC: "Stratigraphic",
		EPOCH: "Epoch",
		GROUP: "Group",
		PROPERTY: "Property",
		DOCUMENT: "Document",
		EXTRACTOR: "Extractor",
		COMBINER: "Combiner",
		LINK: "Link",
		GEO: "Geo",
		SEMANTIC_SHAPE: "Semantic Shape",
		REPRESENTATION_MODEL: "RM",
		REPRESENTATION_MODEL_DOC: "RM Doc",
		REPRESENTATION_MODEL_SF: "RM SF",
		PANORAMA_MODEL: "Panorama model",
	};

	setNodeInfo(id, type, name, description, data, license, authors, embargo_until, graph) {
		let _id = id || crypto.randomUUID();
		super.setNodeInfo(_id, type, name, description, data);
		this.license = license;
		this.authors = authors;
		this.embargo_until = embargo_until;
		this.graph = graph || null;
	}

	getNeighborsByRelationP(relation, direction = HeriverseNode.DIRECTIONS.FROM) {
		if (direction === HeriverseNode.DIRECTIONS.BOTH) {
			let fromNeighbors =
				this.getNeighborsByRelation(relation, HeriverseNode.DIRECTIONS.FROM) || {};
			let toNeighbors = this.getNeighborsByRelation(relation, HeriverseNode.DIRECTIONS.TO) || {};

			return {
				...fromNeighbors,
				...toNeighbors,
			};
		}

		return this.getNeighborsByRelation(relation, direction) || {};
	}

	getIsBeforeList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.IS_BEFORE, direction);
	}

	getHasSameTimeList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_SAME_TIME, direction);
	}

	getChangedFromList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.CHANGED_FROM, direction);
	}

	getHasDataProvenanceList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_DATA_PROVENANCE, direction);
	}

	getHasAuthorList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_AUTHOR, direction);
	}

	getContrastsWithList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.CONTRASTS_WITH, direction);
	}

	getHasFirstEpochList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_FIRST_EPOCH, direction);
	}

	getPanorama() {
		let pano = null;
		let has_first_epoch_list = this.getHasFirstEpochList(HeriverseNode.DIRECTIONS.FROM);
		for (let id in has_first_epoch_list) {
			let n = has_first_epoch_list[id];
			if (n.type === HeriverseNode.NODE_TYPE.PANORAMA_MODEL) pano = n;
		}
		return pano;
	}

	getSurviveInEpochList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.SURVIVE_IN_EPOCH, direction);
	}

	getHasActivityList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_ACTIVITY, direction);
	}

	getHasPropertyList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_PROPERTY, direction);
	}

	getHasTimeBranchList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_TIMEBRANCH, direction);
	}

	getHasLinkedResourceList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.HAS_LINKED_RESOURCE, direction);
	}

	getGenericConnectionList(direction = HeriverseNode.DIRECTIONS.FROM) {
		return this.getNeighborsByRelationP(HeriverseNode.RELATIONS.GENERIC_CONNECTION, direction);
	}

	getLinkedResourceList() {
		let linked_resources = this.getNeighborsByRelationP(
			"has_linked_resource",
			HeriverseNode.DIRECTIONS.BOTH
		);
		for (let link in linked_resources) {
		}
	}

	existsInTime(start, end) {
		let node_start = this.getStartTime();
		let node_end = this.getEndTime();

		if (node_start === undefined || node_end === undefined) {
			if (
				this.edges &&
				this.edges["has_same_time"] &&
				Object.values(this.edges["has_same_time"]).length > 0
			) {
				Object.values(this.edges["has_same_time"]).forEach((hasSameTimeNode) => {
					const neighborStart = hasSameTimeNode.getStartTime();
					const neighborEnd = hasSameTimeNode.getEndTime();
					if (neighborStart && neighborEnd) {
						node_start = neighborStart;
						node_end = neighborEnd;
					}
				});
			}
		}
		if (node_start === undefined || node_end === undefined) {
			if (
				this.edges &&
				this.edges["is_after"] &&
				Object.values(this.edges["is_after"]).length > 0
			) {
				Object.values(this.edges["is_after"]).forEach((isBeforeNode) => {
					const neighborStart = isBeforeNode.getStartTime();
					const neighborEnd = isBeforeNode.getEndTime();
					if (neighborStart && neighborEnd) {
						node_start = neighborStart;
						node_end = neighborEnd;
					}
				});
			}
		}

		return (
			(start <= node_start && end >= node_end) ||
			(node_start <= start && node_end > start) ||
			(node_end <= end && node_end > start)
		);
	}
	getStartTime() {
		let start = undefined;
		if (
			this.neighbors &&
			this.neighbors["EpochNode"] &&
			Object.values(this.neighbors["EpochNode"]).length > 0
		) {
			const epochNodes = Object.values(this.neighbors["EpochNode"]);
			epochNodes.sort((a, b) => a.data.start_time - b.data.start_time);

			epochNodes.forEach((epochNode) => {
				start = epochNode.data.start_time;
				return start;
			});
		}

		return start;
	}
	getEndTime() {
		let end = undefined;
		if (
			this.neighbors &&
			this.neighbors["EpochNode"] &&
			Object.values(this.neighbors["EpochNode"]).length > 0
		) {
			const epochNodes = Object.values(this.neighbors["EpochNode"]);
			epochNodes.sort((a, b) => b.data.end_time - a.data.end_time);

			epochNodes.forEach((epochNode) => {
				end = epochNode.data.end_time;
				return end;
			});
		}

		return end;
	}

	static getLabelFromNodeType(nodeType) {
		switch (nodeType) {
			case HeriverseNode.NODE_TYPE.AUTHOR:
				return HeriverseNode.NODE_TYPE_LABEL.AUTHOR;
			case HeriverseNode.NODE_TYPE.COMBINER:
				return HeriverseNode.NODE_TYPE_LABEL.COMBINER;
			case HeriverseNode.NODE_TYPE.DOCUMENT:
				return HeriverseNode.NODE_TYPE_LABEL.DOCUMENT;
			case HeriverseNode.NODE_TYPE.EPOCH:
				return HeriverseNode.NODE_TYPE_LABEL.EPOCH;
			case HeriverseNode.NODE_TYPE.EXTRACTOR:
				return HeriverseNode.NODE_TYPE_LABEL.EXTRACTOR;
			case HeriverseNode.NODE_TYPE.GEO:
				return HeriverseNode.NODE_TYPE_LABEL.GEO;
			case HeriverseNode.NODE_TYPE.GROUP:
				return HeriverseNode.NODE_TYPE_LABEL.GROUP;
			case HeriverseNode.NODE_TYPE.LINK:
				return HeriverseNode.NODE_TYPE_LABEL.LINK;
			case HeriverseNode.NODE_TYPE.PANORAMA_MODEL:
				return HeriverseNode.NODE_TYPE_LABEL.PANORAMA_MODEL;
			case HeriverseNode.NODE_TYPE.PROPERTY:
				return HeriverseNode.NODE_TYPE_LABEL.PROPERTY;
			case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL:
				return HeriverseNode.NODE_TYPE_LABEL.REPRESENTATION_MODEL;
			case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC:
				return HeriverseNode.NODE_TYPE_LABEL.REPRESENTATION_MODEL_DOC;
			case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF:
				return HeriverseNode.NODE_TYPE_LABEL.REPRESENTATION_MODEL_SF;
			case HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE:
				return HeriverseNode.NODE_TYPE_LABEL.SEMANTIC_SHAPE;
			default:
				return nodeType;
		}
	}

	static getNodeTypeFromType(type) {
		switch (type) {
			case HeriverseNode.TYPE.AUTHORS:
				return HeriverseNode.NODE_TYPE.AUTHOR;
			case HeriverseNode.TYPE.COMBINERS:
				return HeriverseNode.NODE_TYPE.COMBINER;
			case HeriverseNode.TYPE.DOCUMENTS:
				return HeriverseNode.NODE_TYPE.DOCUMENT;
			case HeriverseNode.TYPE.EPOCHS:
				return HeriverseNode.NODE_TYPE.EPOCH;
			case HeriverseNode.TYPE.EXTRACTORS:
				return HeriverseNode.NODE_TYPE.EXTRACTOR;
			case HeriverseNode.TYPE.GEO:
				return HeriverseNode.NODE_TYPE.GEO;
			case HeriverseNode.TYPE.GROUPS:
				return HeriverseNode.NODE_TYPE.GROUP;
			case HeriverseNode.TYPE.LINKS:
				return HeriverseNode.NODE_TYPE.LINK;
			case HeriverseNode.TYPE.PANORAMA_MODELS:
				return HeriverseNode.NODE_TYPE.PANORAMA_MODEL;
			case HeriverseNode.TYPE.PROPERTIES:
				return HeriverseNode.NODE_TYPE.PROPERTY;
			case HeriverseNode.TYPE.REPRESENTATION_MODELS:
				return HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL;
			case HeriverseNode.TYPE.REPRESENTATION_MODEL_DOC:
				return HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC;
			case HeriverseNode.TYPE.REPRESENTATION_MODEL_SF:
				return HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF;
			case HeriverseNode.TYPE.SEMANTIC_SHAPES:
				return HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE;
			default:
				return type;
		}
	}

	static getTypeFromNodeType(nodeType) {
		switch (nodeType) {
			case HeriverseNode.NODE_TYPE.AUTHOR:
				return HeriverseNode.TYPE.AUTHORS;
			case HeriverseNode.NODE_TYPE.COMBINER:
				return HeriverseNode.TYPE.COMBINERS;
			case HeriverseNode.NODE_TYPE.DOCUMENT:
				return HeriverseNode.TYPE.DOCUMENTS;
			case HeriverseNode.NODE_TYPE.EPOCH:
				return HeriverseNode.TYPE.EPOCHS;
			case HeriverseNode.NODE_TYPE.EXTRACTOR:
				return HeriverseNode.TYPE.EXTRACTORS;
			case HeriverseNode.NODE_TYPE.GEO:
				return HeriverseNode.TYPE.GEO;
			case HeriverseNode.NODE_TYPE.GROUP:
				return HeriverseNode.TYPE.GROUPS;
			case HeriverseNode.NODE_TYPE.LINK:
				return HeriverseNode.TYPE.LINKS;
			case HeriverseNode.NODE_TYPE.PANORAMA_MODEL:
				return HeriverseNode.TYPE.PANORAMA_MODELS;
			case HeriverseNode.NODE_TYPE.PROPERTY:
				return HeriverseNode.TYPE.PROPERTIES;
			case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL:
				return HeriverseNode.TYPE.REPRESENTATION_MODELS;
			case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_DOC:
				return HeriverseNode.TYPE.REPRESENTATION_MODEL_DOC;
			case HeriverseNode.NODE_TYPE.REPRESENTATION_MODEL_SF:
				return HeriverseNode.TYPE.REPRESENTATION_MODEL_SF;
			case HeriverseNode.NODE_TYPE.SEMANTIC_SHAPE:
				return HeriverseNode.TYPE.SEMANTIC_SHAPES;
			case HeriverseNode.NODE_TYPE.STRATIGRAPHIC:
				return HeriverseNode.TYPE.STRATIGRAPHIC;
			default:
				return nodeType;
		}
	}
}
