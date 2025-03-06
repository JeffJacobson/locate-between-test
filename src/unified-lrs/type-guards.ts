import type {
	LayerQueryResponse,
	LayerTypes,
	MilepostAttributes,
	PossibleGeometries,
	ResponseLayer,
} from ".";
import type { RouteFeatureAttributes } from "../lrs";

/**
 * Checks if the given object is an object.
 * Type guard that will tell TypeScript that {@link responseData} is a {@link Record<string, object>}
 * @param responseData input to be checked.
 * @returns Returns boolean indicating whether {@link responseData} is an object.
 */
export function isObject(
	responseData: unknown,
): responseData is Record<string, object> {
	return typeof responseData === "object" && responseData != null;
}

/**
 * Checks if the given object is a {@link ResponseLayer} with specified geometry and attributes.
 *
 * @template G The geometry type of the layer, either a point or a polyline.
 * @template A The attributes type of the layer, either RouteFeatureAttributes or MilepostAttributes.
 * @param o The object to check.
 * @returns True if the object is a {@link ResponseLayer} with the specified geometry and attributes, false otherwise.
 */
export function isLayer<
	G extends PossibleGeometries,
	A extends RouteFeatureAttributes | MilepostAttributes,
>(o: unknown): o is ResponseLayer<G, A> {
	return (
		isObject(o) &&
		Object.hasOwn(o, "features") &&
		Array.isArray(o.features) &&
		typeof o.id === "number"
	);
}

/**
 * Checks if a given object is a {@link LayerQueryResponse}.
 *
 * @param responseData The object to check.
 * @returns Whether the given object is a {@link LayerQueryResponse}.
 */
export function isLayerResponse<L extends LayerTypes = LayerTypes>(
	responseData: unknown,
): responseData is LayerQueryResponse<L> {
	if (!isObject(responseData)) {
		return false;
	}
	return (
		Object.hasOwn(responseData, "layers") &&
		Array.isArray(responseData.layers) &&
		responseData.layers.every((l) => isLayer(l))
	);
}
