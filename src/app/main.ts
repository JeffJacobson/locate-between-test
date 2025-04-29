import type { ArcgisMapCustomEvent } from "@arcgis/map-components";

const mapElement = document.querySelector("arcgis-map");

if (!mapElement) {
	throw new Error("Could not find map element");
}
const setupMapLayers = async (ev: ArcgisMapCustomEvent<void>) => {
	const [Layer, PortalItem] = await $arcgis.import([
		"@arcgis/core/layers/Layer.js",
		"@arcgis/core/portal/PortalItem.js",
	] as const);
	const { map } = ev.target;
	const milepostsLayer = await Layer.fromPortalItem({
		portalItem: new PortalItem({
			id: "0b0269ba1210401dba0f1a5151c21ad3",
		}),
	});
	map.add(milepostsLayer);
};
mapElement.addEventListener("arcgisViewReadyChange", setupMapLayers);

document.body
	.querySelector<HTMLFormElement>("form#inputMilepostForm")
	?.addEventListener("submit", (ev) => {
		ev.preventDefault();
	});
