document
	.querySelector("arcgis-map")
	?.addEventListener("arcgisViewReadyChange", async (ev) => {
		const [Layer, PortalItem] = await $arcgis.import([
			"@arcgis/core/layers/Layer.js",
			"@arcgis/core/portal/PortalItem.js",
		] as const);
		const { map } = ev.target;
		const layer = await Layer.fromPortalItem({
			portalItem: new PortalItem({
				id: "0b0269ba1210401dba0f1a5151c21ad3",
			}),
		});
		map.add(layer);
	});
