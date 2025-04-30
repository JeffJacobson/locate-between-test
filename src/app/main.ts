import type { ArcgisMapCustomEvent } from "@arcgis/map-components";
import { getRoutes } from "../lrs/getRouteIds.ts";

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

const loadRouteOptions = async () => {
	const routeIdBox = document.body.querySelector<HTMLCalciteInputTextElement>("#routeIdBox");
	if (!routeIdBox) {
		throw new Error("Could not find route ID input element");
	}
	await routeIdBox.componentOnReady();

	const innerInput = routeIdBox.shadowRoot?.querySelector("input");
	if (innerInput) {
		innerInput.setAttribute("list", "routeIdDatalist");
	}

	/* __PURE__ */ console.debug("inner input element", innerInput)

	const dataList = document.body.querySelector<HTMLDataListElement>(
		"datalist#routeIdDatalist",
	);
	if (!dataList) {
		throw new Error("Could not find datalist");
	}
	const routes = await getRoutes();
	const routeToOption = (route: string): HTMLOptionElement => {
		const routeId = route.substring(0, route.length - 1);
		const direction = route[route.length - 1];
		const option = document.createElement("option");
		option.classList.add(`direction-${direction}`);
		if (routeId.length === 3) {
			option.classList.add("mainline");
		}
		option.text = route;
		option.value = route;
		// option.title = `${routeId} (${direction})`;
		// option.label = `${routeId} (${direction})`;
		return option;
	};
	const options = routes.map(routeToOption);
	dataList.append(...options);
}

loadRouteOptions();