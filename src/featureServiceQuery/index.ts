import type Point from "@arcgis/core/geometry/Point";
import type { ILayerDef } from "./layerDef";

export type EsriGeometryType = `esriGeometry${
	| "Point"
	| "Multipoint"
	| "Polyline"
	| "Polygon"
	| "Envelope"}`;

export type EsriSpatialRel = `esriSpatialRel${
	| "Intersects"
	| "Contains"
	| "Crosses"
	| "EnvelopeIntersects"
	| "IndexIntersects"
	| "Overlaps"
	| "Touches"
	| "Within"
	| "Relation"}`;

export type TimeRange<T extends Date | number = Date | number> = [
	start: T,
	end: T,
];

type SpatialReferenceSpecifier =
	| __esri.SpatialReferenceProperties["wkid"]
	| __esri.SpatialReferenceProperties;

export type MultipatchOption =
	| "xyFootprint"
	| "stripMaterials"
	| "embedMaterials"
	| "externalizeTextures";

export interface QueryFeatureServiceOptions {
	layerDefs: ILayerDef[];
	geometry?:
		| __esri.Envelope
		| __esri.PointProperties
		| __esri.PolylineProperties
		| __esri.PolygonProperties
		| string;
	geometryType?: EsriGeometryType;
	inSR?: SpatialReferenceSpecifier;
	spatialRel?: EsriSpatialRel;
	time?: Date | number | TimeRange;
	outSR?: SpatialReferenceSpecifier;
	gdbVersion?: string;
	historicMoment?: Date | number;
	returnGeometry?: boolean;
	maxAllowableOffset?: number;
	returnIdsOnly?: boolean;
	returnCountOnly?: boolean;
	returnZ?: boolean;
	returnM?: boolean;
	geometryPrecision?: number;
	multipatchOption?: MultipatchOption;
	returnTrueCurves?: boolean;
	sqlFormat?: "none" | "standard" | "native";
	timeReferenceUnknownClient?: boolean;
}

// /**
//  * Queries the feature service using the provided options and returns the results as graphics.
//  *
//  * @param options - The query options including route segment details and LRS feature service URL.
//  * @returns An object containing graphics for mileposts and routes.
//  *
//  * @throws {TypeError} If the response is not in the expected format, or if no milepost or LRS results are found.
//  */
// async function queryFeatureService(
// 	options: QueryFeatureServiceOptions,
// ): Promise<queryFeatureServiceOutput> {
// 	// Create the layer definitions for the query.
// 	const layerDefs = createLayerDefs(options);
// 	// Encode the layer definitions as a JSON string.
// 	const layerDefsString = JSON.stringify(layerDefs);

// 	// Create the request options for the query.
// 	const requestOptions: __esri.RequestOptions = {
// 		query: {
// 			f: "json",
// 			layerDefs: layerDefsString,
// 			outSR: 3857,
// 			returnGeometry: true,
// 			returnM: true,
// 		},
// 	};

// 	// Create the URL for the query.
// 	const queryUrl = new URL("query", appendSlash(options.lrsFeatureServiceUrl));

// 	// Send the query and get the response.
// 	const response = await esriRequest(queryUrl, { ...requestOptions });
// 	const responseData = response.data;

// 	// Check if the response is in the expected format and throw an error if it is not.
// 	if (!isLayerResponse(responseData)) {
// 		throw new TypeError("Unexpected response", {
// 			cause: {
// 				response,
// 			},
// 		});
// 	}

// 	// Loop through the response layers and store the milepost and LRS layers in separate variables.
// 	const { layers } = responseData;

// 	let mpLayer: MilepostResponseLayer | undefined;
// 	let lrsLayer: LrsResponseLayer<PositionWithM> | undefined;

// 	for (const l of layers) {
// 		if (l.id === 0) {
// 			mpLayer = l;
// 		} else if (l.id === 1) {
// 			lrsLayer = l as NonNullable<typeof lrsLayer>;
// 		}
// 	}

// 	// Throw an exception if either the milepost or LRS layer is not found in the response.
// 	if (!mpLayer) {
// 		throw new TypeError("No milepost results found", {
// 			cause: { response },
// 		});
// 	}
// 	if (!lrsLayer) {
// 		throw new TypeError("No LRS results found");
// 	}

// 	// Convert the milepost and LRS features to graphics.
// 	const milepostGraphics = toGraphics(mpLayer);
// 	const lrsGraphics = toGraphics(lrsLayer);
// 	return {
// 		mileposts: milepostGraphics,
// 		routes: lrsGraphics,
// 	};
// }
