import HeriverseEvents from "./HeriverseEvents.js";

function createEnvironmentPatch() {
	return {
		environment: {},
	};
}

function patchEnvironment(environmentPatch, mode = ATON.SceneHub.MODE_ADD) {
	ATON.SceneHub.patch(environmentPatch, mode);
	ATON.Photon.fire("AFE_AddSceneEdit", environmentPatch);
}

export function setProxiesAlwaysVisible(checked) {
	Heriverse.setProxiesAlwaysVisible(checked);
}

export function setShowAllProxies(checked) {
	Heriverse.showAllProxies(checked);
}

export function setSemanticOcclusion(checked) {
	ATON._bQuerySemOcclusion = checked;
}

export function setAutoLightProbe(checked) {
	const environmentPatch = createEnvironmentPatch();

	Heriverse._bAutoLightProbe = checked;
	ATON.setAutoLP(checked);

	if (checked) {
		ATON.updateLightProbes();
	}

	environmentPatch.environment.lightprobes = {
		auto: checked,
	};

	patchEnvironment(environmentPatch);
}

export function setAmbientOcclusion(checked) {
	Heriverse._bAmbientOcclusion = checked;

	ATON.FX.togglePass(ATON.FX.PASS_AO, checked);

	if (checked) {
		ATON.SceneHub.patch(
			{
				fx: {
					ao: {
						i: ATON.FX.getAOintensity().toPrecision(ATON.SceneHub.FLOAT_PREC),
					},
				},
			},
			ATON.SceneHub.MODE_ADD
		);
	} else {
		ATON.SceneHub.patch({ fx: { ao: {} } }, ATON.SceneHub.MODE_DEL);
	}
}

export function setAmbientOcclusionIntensity(value) {
	ATON.FX.setAOintensity(value);

	if (!ATON.FX.isPassEnabled(ATON.FX.PASS_AO)) return;

	ATON.SceneHub.patch(
		{
			fx: {
				ao: {
					i: value.toPrecision(ATON.SceneHub.FLOAT_PREC),
				},
			},
		},
		ATON.SceneHub.MODE_ADD
	);
}

export function setLightIntensity(value) {
	const environmentPatch = createEnvironmentPatch();

	environmentPatch.environment.exposure = value;

	patchEnvironment(environmentPatch);

	ATON.fireEvent(HeriverseEvents.Events.CHANGE_LIGHT_INTENSITY, value);
}

export function setDirectionalLight(checked) {
	const environmentPatch = createEnvironmentPatch();

	if (checked) {
		if (Heriverse._bShadowEnabled) {
			ATON.toggleShadows(checked);
		}

		let lightDirection = ATON.getMainLightDirection();

		if (!lightDirection) {
			lightDirection = new THREE.Vector3(0, -1.0, 1.0);
		}

		ATON.setMainLightDirection(lightDirection);
		Heriverse._bDirectionalLight = checked;

		environmentPatch.environment.mainlight = {
			direction: [lightDirection.x, lightDirection.y, lightDirection.z],
		};

		patchEnvironment(environmentPatch);

		return;
	}

	if (Heriverse._bShadowEnabled) {
		ATON.toggleShadows(checked);
	}

	Heriverse._bDirectionalLight = checked;
	environmentPatch.environment.mainlight = {};

	ATON.SceneHub.patch(environmentPatch, ATON.SceneHub.MODE_DEL);
	ATON.Photon.fire("AFE_LightSwitch", false);

	ATON.setNeutralAmbientLight();
}

export function shouldShowShadowSettings() {
	return isDirectionalLightEnabled();
}

export function setShadows(checked) {
	const environmentPatch = createEnvironmentPatch();

	Heriverse._bShadowEnabled = checked;
	ATON.toggleShadows(checked);

	if (!ATON.isMainLightEnabled()) return;

	environmentPatch.environment.mainlight = {
		shadows: checked,
	};

	patchEnvironment(environmentPatch);

	ATON.updateLightProbes();
}

export function setZoomToGraph(checked) {
	Heriverse._bZoomToGraph = checked;
}

export function getLightIntensity() {
	return ATON.getExposure();
}

export function areProxiesAlwaysVisible() {
	return Heriverse._bProxiesAlwaysVis;
}

export function shouldShowAllProxies() {
	return Heriverse._bShowAllProxies;
}

export function isSemanticOcclusionEnabled() {
	return ATON._bQuerySemOcclusion;
}

export function isDirectionalLightEnabled() {
	return Heriverse._bDirectionalLight;
}

export function areShadowsEnabled() {
	return Heriverse._bShadowEnabled;
}

export function isAutoLightProbeEnabled() {
	return Heriverse._bAutoLightProbe;
}

export function isAmbientOcclusionEnabled() {
	return Heriverse._bAmbientOcclusion;
}

export function getAmbientOcclusionIntensity() {
	return ATON.FX.getAOintensity();
}

export function isZoomToGraphEnabled() {
	return Heriverse._bZoomToGraph;
}
