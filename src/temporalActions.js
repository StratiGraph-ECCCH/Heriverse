export function goToPeriodById(periodId) {
	if (!periodId) return;

	Heriverse.goToPeriodById(periodId);
}

export function applyTimelinePeriodById(periodId) {
	if (!periodId) return;

	goToPeriodById(periodId);
	Heriverse.createSemanticShapeNodes();
}

export function cleanSceneBeforePeriodChange() {
	ATON._rootVisible.children.forEach((epochGroup) => {
		if (epochGroup.type !== ATON.NTYPES.SCENE) return;
		if (epochGroup.children.length) epochGroup.removeChildren();
	});

	if (ATON._rootSem.children.length) {
		ATON._rootSem.removeChildren();
	}

	if (Heriverse.currMG) {
		Heriverse.currMG.proxyNodes = {};
	}
}

export function goToPeriodByValues(periodValues) {
	if (!periodValues) return;

	Heriverse.goToPeriodByValues(periodValues);
}

export function applyPeriodFilterValues(periodValues) {
	if (!periodValues) return;

	cleanSceneBeforePeriodChange();

	goToPeriodByValues(periodValues);
}

export function openCreateEpochModal() {
	Editor.setupEditCreateModal(Heriverse.CONNECTION_RULES_NODETYPES.EPOCH);
}

export function editTemporalFilter(e) {
	Editor.editTemporalFilter(e);
}

export function saveTemporalFilter(e) {
	Editor.saveTemporalFilter(e);
}
