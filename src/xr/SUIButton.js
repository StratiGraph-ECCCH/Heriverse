import Utils from "../../config/Utils.js";

export default class SUIButton extends ATON.Node {
	constructor(uiid, widthRatio = 1.0, heightRatio = 1.0, fsize = 1.0) {
		super(uiid, ATON.NTYPES.UI);

		this.baseColor = ATON.MatHub.colors.black;
		this.switchColor = ATON.MatHub.colors.green;

		this.baseOpacity = 0.5;
		this.hoverOpacity = 0.8;

		this._bSwitched = false;

		this.container = new ThreeMeshUI.Block({
			width: 0.1 * widthRatio,
			height: 0.1 * heightRatio,
			padding: 0.01,
			borderRadius: 0.02,
			backgroundColor: this.baseColor,
			backgroundOpacity: this.baseOpacity,
			fontFamily: Utils.baseUrl + "/res/fonts/custom-msdf.json",
			fontTexture: Utils.baseUrl + "/res/fonts/custom.png",
			justifyContent: "center",
			textAlign: "center",
		});
		this.add(this.container);

		this.uiText = new ThreeMeshUI.Text({
			content: "",
			fontSize: 0.02 * fsize,
			fontColor: ATON.MatHub.colors.white,
		});
		this.container.add(this.uiText);

		let trw = ATON.SUI.STD_BTN_SIZE * 0.9 * widthRatio;
		let trh = ATON.SUI.STD_BTN_SIZE * 0.9 * heightRatio;
		this._trigger = new THREE.Mesh(
			new THREE.PlaneGeometry(trw, trh, 2),
			ATON.MatHub.materials.fullyTransparent
		);
		this._trigger.position.set(0, 0, 0.005);

		this.add(this._trigger);

		this.onHover = () => {
			this.container.set({
				backgroundOpacity: this.hoverOpacity,
			});
		};
		this.onLeave = () => {
			this.container.set({
				backgroundOpacity: this.baseOpacity,
			});
		};

		this.enablePicking();

		this.traverse((o) => {
			if (o.material) o.material.depthWrite = false;
		});

		this.container.update(true, true, true);
	}

	/**
  Set base color of the button
  @param {THREE.Color} c - the color
  */
	setBaseColor(c) {
		this.baseColor = c;
		if (!this._bSwitched) this.container.set({ backgroundColor: this.baseColor });

		setTimeout(() => {
			ThreeMeshUI.update();
		}, 150);
		return this;
	}

	/**
  Set button switch color (when activated)
  @param {THREE.Color} c - the color
  */
	setSwitchColor(c) {
		this.switchColor = c;
		if (this._bSwitched) this.container.set({ backgroundColor: this.switchColor });

		setTimeout(() => {
			ThreeMeshUI.update();
		}, 150);
		return this;
	}

	setBackgroundOpacity(f) {
		this.container.set({ backgroundOpacity: f });
		this.baseOpacity = f;

		setTimeout(() => {
			ThreeMeshUI.update();
		}, 150);
		return this;
	}

	/**
  Set button text
  @param {string} text
  */
	setText(text) {
		this.uiText.set({ content: text });

		setTimeout(() => {
			ThreeMeshUI.update();
		}, 150);
		return this;
	}

	/**
  Switch the button (ON/OFF)
  @param {boolean} b
  */
	switch(b) {
		this._bSwitched = b;
		if (b) this.container.set({ backgroundColor: this.switchColor });
		else this.container.set({ backgroundColor: this.baseColor });

		setTimeout(() => {
			ThreeMeshUI.update();
		}, 150);
		return this;
	}

	/**
  Set button icon
  @param {string} url - the url to the icon (tipically a PNG file)
  */
	setIcon(url, bNoBackground) {
		ATON.Utils.textureLoader.load(url, (texture) => {
			this._trigger.material = new THREE.MeshStandardMaterial({
				map: texture,
				transparent: true,
				depthWrite: false,
			});

			if (bNoBackground) {
				this.setBackgroundOpacity(0.0);
				this.hoverOpacity = 0.0;
			}

			this.uiText.position.set(0, -0.035, 0);
		});

		setTimeout(() => {
			ThreeMeshUI.update();
		}, 150);
		return this;
	}
}
