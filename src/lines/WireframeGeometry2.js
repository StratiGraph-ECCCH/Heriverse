import { LineSegmentsGeometry } from "../lines/LineSegmentsGeometry.js";

class WireframeGeometry2 extends LineSegmentsGeometry {
	constructor(geometry) {
		super();

		this.isWireframeGeometry2 = true;

		this.type = "WireframeGeometry2";

		this.fromWireframeGeometry(new THREE.WireframeGeometry(geometry));
	}
}

export { WireframeGeometry2 };
