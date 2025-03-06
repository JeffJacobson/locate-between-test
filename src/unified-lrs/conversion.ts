import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import {
	FeatureClassLayerId,
	type LayerTypes,
	type LrsResponseLayer,
	type MilepostResponseLayer,
	type PositionWithM,
} from ".";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Graphic from "@arcgis/core/Graphic";

export type FeatureClassIdName = keyof typeof FeatureClassLayerId;

export interface ResponseAsFeatureSets
	extends Record<FeatureClassIdName, FeatureSet> {}

export function layerToFeatureSet({
	id,
	...l
}: LayerTypes): [key: FeatureClassIdName, featureSet: FeatureSet] {
	const featureSet = FeatureSet.fromJSON(l);
	// Convert from layer ID to corresponding property name.
	const key = FeatureClassLayerId[id] as FeatureClassIdName;
	return [key, featureSet];
}

/**
 * Converts the given layer to an array of {@link Graphic} objects.
 *
 * @param layer A layer containing mileposts or route segments.
 * @returns An array of {@link Graphic} objects.
 *
 * @throws {TypeError} If the layer is not a milepost or route segment layer.
 */
export function toGraphics(
	layer: MilepostResponseLayer | LrsResponseLayer<PositionWithM>,
): Graphic[] {
	let graphics: Graphic[] | undefined;
	const spatialReference = new SpatialReference(layer.spatialReference);

	/**
	 * Converts a milepost feature to a Graphic object.
	 *
	 * @param feature A milepost feature from a {@link MilepostResponseLayer}.
	 * @returns A Graphic object with a Point geometry and attributes that implement the {@link MilepostAttributes} interface.
	 */
	function toPointGraphic(
		feature: MilepostResponseLayer["features"][number],
	): Graphic {
		const { geometry, attributes } = feature;
		return new Graphic({
			geometry: new Point({
				...geometry,
				hasM: true,
				m: attributes.ARM,
				spatialReference,
			}),
			attributes,
		});
	}

	/**
	 * Converts a feature from an LRS response layer into a Graphic object
	 * with a Polyline geometry.
	 *
	 * @param feature A feature from an LRS response layer, containing geometry
	 * and attributes.
	 * @returns A Graphic object with a Polyline geometry, including M values
	 * but no Z values, and the feature's attributes.
	 */
	function toPolylineGraphic(
		feature: LrsResponseLayer<PositionWithM>["features"][number],
	): Graphic {
		const { geometry, attributes } = feature;
		return new Graphic({
			geometry: new Polyline({
				...geometry,
				hasM: true,
				hasZ: false,
				spatialReference,
			}),
			attributes,
		});
	}

	if (layer.id === 0) {
		graphics = layer.features.map(toPointGraphic);
	} else if (layer.id === 1) {
		graphics = layer.features.map(toPolylineGraphic);
	}
	if (!graphics) {
		throw new TypeError("Unsupported layer type");
	}

	return graphics;
}
