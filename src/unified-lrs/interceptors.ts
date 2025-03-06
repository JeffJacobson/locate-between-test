import esriConfig from "@arcgis/core/config.js";
import { isLayerResponse } from "./index.js";
import { layerToFeatureSet, type ResponseAsFeatureSets } from "./conversion.js";

esriConfig.request.interceptors = esriConfig.request.interceptors ?? [];

export function setupInterceptors() {
	const url = process.env.LRS_AND_MP_SERVICE_URL;
	console.log("url", url);
	const urlRe = new RegExp(url.replace("/", String.raw`\/`));
	esriConfig.request.interceptors?.push({
		urls: [urlRe],
		after: (response) => {
			const { data } = response;
			if (isLayerResponse(data)) {
				const { layers } = data;

				const featureSets = layers.map(layerToFeatureSet);

				response.data = Object.fromEntries(
					featureSets,
				) as ResponseAsFeatureSets;
			}
		},
	});
}
