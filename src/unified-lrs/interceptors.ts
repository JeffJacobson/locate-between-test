import esriConfig from "@arcgis/core/config.js";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet.js";
import { isLayerResponse, type LayerTypes } from ".";

esriConfig.request.interceptors = esriConfig.request.interceptors ?? [];

function layerToFeatureSet({ id, ...l }: LayerTypes): FeatureSet {
	const featureSet = FeatureSet.fromJSON(l);
	// (featureSet as unknown as { id: number }).id = id;
	// console.log(Object.keys(featureSet));
	return featureSet;
}

export function setupInterceptors() {
	esriConfig.request.interceptors?.push({
		after: (response) => {
			const { data } = response;
			if (isLayerResponse(data)) {
				const { layers } = data;

				const featureSets = layers.map(layerToFeatureSet);

				response.data.layers = featureSets;
			}
		},
	});
}
