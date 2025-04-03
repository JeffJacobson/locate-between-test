(async () => {
	const [Extent]: [typeof __esri.Extent] = await window.$arcgis.import([
		"@arcgis/core/geometry/Extent.js",
	]);

	const [xmin, ymin, xmax, ymax] = [-116.91, 45.54, -124.79, 49.05];

	const waExtent = new Extent({ xmin, ymin, xmax, ymax });

	console.log(waExtent);
})().catch((error) => {
	console.error("error importing module and creating Extent", error);
});
