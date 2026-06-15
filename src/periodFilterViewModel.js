export function getSortedAbsoluteTimeEpochs() {
	const absoluteTimeEpochs = Heriverse.currMG?.json?.context?.absolute_time_Epochs;

	if (!absoluteTimeEpochs || !Object.keys(absoluteTimeEpochs).length) {
		return [];
	}

	return Object.entries(absoluteTimeEpochs).sort((a, b) => {
		return a[1].start - b[1].start;
	});
}

export function getTemporalFilters() {
	return Heriverse.temporalFilters || [];
}

export function getPeriodFilterEpochOptions() {
	return getSortedAbsoluteTimeEpochs().map(([id, epoch], index) => ({
		id,
		index: index + 1,
		name: epoch.name,
		start: epoch.start,
		end: epoch.end,
		color: epoch.color,
	}));
}

export function getAutoTemporalFilterOptions() {
	return getTemporalFilters().map((filter, index) => ({
		id: filter.id,
		index: index + 1,
		name: filter.name,
		start: filter.min,
		end: filter.max,
		color: filter.color,
	}));
}
