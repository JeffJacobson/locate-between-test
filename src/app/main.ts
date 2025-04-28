// const [xmin, ymin, xmax, ymax] = [-116.91, 45.54, -124.79, 49.05];
// const waExtent = new Extent({ xmin, ymin, xmax, ymax });

async function setupBasemaps() {
	const { aerialImageryWA1Foot, aerialImageryWA6Inch } = await import(
		"./basemaps"
	);
	const [BasemapToggle] = await window.$arcgis.import<
		[typeof import("@arcgis/core/widgets/BasemapToggle").default]
	>(["@arcgis/core/widgets/BasemapToggle"]);

	document.body
		.querySelector("arcgis-map")
		?.addEventListener("arcgisViewReadyChange", function (this, ev) {
			const { map, view } = ev.target;
			map.basemap = aerialImageryWA6Inch;
			const basemapToggle = new BasemapToggle({
				view: view,
				container: "basemaps",
				nextBasemap: aerialImageryWA1Foot,
			});
			view.ui.add(basemapToggle, "top-left");
		});
}

setupBasemaps();
