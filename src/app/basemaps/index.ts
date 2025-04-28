const aerialImageryWA1FootAgolId = "5496b5e505984ae08ba8bc3da6eead78";
/**
 * {@link https://imagery-public.watech.wa.gov/arcgis/rest/services/LandCover/Statewide_Ecopia_LandCover_2021_2022_3ft_1band_wsps_83h_rstr/ImageServer}
 */
const aerialImageryWA6InchAgolId = "3a38761a8dd547c38dc6faab538234b4";

const [Basemap, ImageryLayer] = await window.$arcgis.import<
	[
		typeof import("@arcgis/core/Basemap").default,
		typeof import("@arcgis/core/layers/ImageryLayer").default,
	]
>(["@arcgis/core/Basemap", "@arcgis/core/layers/ImageryLayer"]);

export const aerialImageryWA1Foot = new Basemap({
	baseLayers: [
		new ImageryLayer({
			portalItem: {
				id: aerialImageryWA1FootAgolId,
			},
		}),
	],
});

export const aerialImageryWA6Inch = new Basemap({
	baseLayers: [
		new ImageryLayer({
			portalItem: {
				id: aerialImageryWA6InchAgolId,
			},
		}),
	],
});
