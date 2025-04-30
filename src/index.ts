/**
 * Note that when running from bun you will need to set the NODE_TLS_REJECT_UNAUTHORIZED environment variable to 0.
 *
 * ```pwsh
 * $env:NODE_TLS_REJECT_UNAUTHORIZED = 0 && bun run index.ts
 * ```
 */

import type Polyline from "@arcgis/core/geometry/Polyline.js";

import {
	type AheadBackIndicator,
	type MilepostAttributes,
	type MilepostFeature,
	isMilepostAttributes,
	queryMilepostFeatures,
} from "./mileposts/index.ts";
import { defaultLrsRoutesUrl } from "./url.ts";

let locateBetweenOperator: typeof import(
	"@arcgis/core/geometry/operators/locateBetweenOperator.js"
);
let Graphic: typeof import("@arcgis/core/Graphic.js").default;
let executeQueryJSON: typeof import(
	"@arcgis/core/rest/query.js"
).executeQueryJSON;
let Query: typeof import("@arcgis/core/rest/support/Query.js").default;

try {
	[Graphic, locateBetweenOperator, { executeQueryJSON }, Query] =
		await $arcgis.import([
			"@arcgis/core/Graphic.js",
			"@arcgis/core/geometry/operators/locateBetweenOperator.js",
			"@arcgis/core/rest/query.js",
			"@arcgis/core/rest/support/Query.js",
		] as const);
} catch {
	[
		{ default: Graphic },
		locateBetweenOperator,
		{ executeQueryJSON },
		{ default: Query },
	] = await Promise.all([
		import("@arcgis/core/Graphic.js"),
		import("@arcgis/core/geometry/operators/locateBetweenOperator.js"),
		import("@arcgis/core/rest/query.js"),
		import("@arcgis/core/rest/support/Query.js"),
	] as const);
}

/**
 * A MilepostAttributes object with additional properties that are only present on the end of a route segment.
 */
export interface MilepostRangeAttributes extends MilepostAttributes {
	EndSRMP: number;
	EndAheadBackInd: AheadBackIndicator;
	EndARM: number;
	EndAzimuth: number;
	EndLongitude: number;
	EndLatitude: number;
	EndNorthing: number;
	EndEasting: number;
}

const ROUTE_ID_FIELD = "RouteIdentifier";

type SuffixedRoute = `${string}${"i" | "d"}`;

export async function getLrsFeatures(
	lrsFeatureServerUrl: string | URL = defaultLrsRoutesUrl,
	...[queryMilepostParams]: Parameters<typeof queryMilepostFeatures>
) {
	const milepostFeaturesResults =
		await queryMilepostFeatures(queryMilepostParams);

	/**
	 * Given a {@link __esri.Graphic} with a {@link MilepostAttributes} object in its attributes,
	 * returns an array of strings that are the route ID of the graphic suffixed with either
	 * "i" or "d". If the RouteIdentifier ends with something else, return both "i" and "d"
	 * suffixed versions.
	 *
	 * @param f A Graphic with a MilepostAttributes object in its attributes
	 * @returns An array of strings that are the route ID of the graphic suffixed with either
	 * "i" or "d".
	 */
	function getSuffixedRouteIds(f: MilepostFeature): SuffixedRoute[] {
		if (!isMilepostAttributes(f.attributes)) {
			throw new TypeError("Not a MilepostAttributes");
		}
		const routeId = f.attributes.RouteID;
		const direction = f.attributes.Direction;

		// The route service's RouteIdentifiers only end with either "i" or "d".
		// If they end with something else, return both "i" and "d" suffixed versions.
		const validDirections = ["i", "d"];
		if (validDirections.includes(direction)) {
			return [`${routeId}${direction}` as SuffixedRoute];
		}
		return validDirections.map((dir) => `${routeId}${dir}` as SuffixedRoute);
	}
	/**
	 * List of all of the Route IDs with direction suffixes.
	 */
	const routeIds: SuffixedRoute[] =
		milepostFeaturesResults.features.flatMap(getSuffixedRouteIds);
	/**
	 * A string that is a comma-separated list of all of the Route IDs with direction suffixes.
	 * Each suffixed Route ID is wrapped in single quotes.
	 */
	const routeIdList = routeIds.map((rid) => `'${rid}'`).join(",");
	const query = new Query({
		where: `RouteIdentifier in (${routeIdList})`,
		returnGeometry: true,
		outFields: [ROUTE_ID_FIELD],
		orderByFields: [ROUTE_ID_FIELD],
		outSpatialReference: queryMilepostParams.outSpatialReference,
		returnM: true,
	});
	const queryUrl = new URL("query", lrsFeatureServerUrl);
	const results = await executeQueryJSON(queryUrl.toString(), query);
	return results;
}

export interface RouteSegmentOutput {
	routeId: string;
	mpFeatures: MilepostFeature[];
	lrsFeatures: __esri.Graphic[];
	segments: Polyline[];
}

type BeginAndEndMilepostGraphicTuple = [
	begin: MilepostFeature,
	end: MilepostFeature,
];

function isBeginAndEndMilepostTuple(
	milepostGraphics: MilepostFeature[],
): milepostGraphics is BeginAndEndMilepostGraphicTuple {
	return milepostGraphics.length === 2;
}

/**
 * Given a tuple of two {@link MilepostFeatures}, extracts the attributes that define a milepost range
 * from the second feature and returns them as a new object.
 *
 * @param milepostGraphics A tuple of two {@link MilepostFeatures}, first is the begin and second is the end
 * @returns The attributes that define a milepost range
 */
function getMilepostRangeAttributes([
	begin,
	end,
]: BeginAndEndMilepostGraphicTuple): MilepostRangeAttributes {
	const {
		SRMP: EndSRMP,
		AheadBackInd: EndAheadBackInd,
		ARM: EndARM,
		Azimuth: EndAzimuth,
		Longitude: EndLongitude,
		Latitude: EndLatitude,
		Northing: EndNorthing,
		Easting: EndEasting,
	} = end.attributes;

	return {
		...begin.attributes,
		EndSRMP,
		EndAheadBackInd,
		EndARM,
		EndAzimuth,
		EndLongitude,
		EndLatitude,
		EndNorthing,
		EndEasting,
	};
}

export async function getRouteSegments(
	lrsFeatureServerUrl: Parameters<typeof getLrsFeatures>[0],
	...params: Parameters<typeof queryMilepostFeatures>
) {
	const milepostsFeatureSet = await queryMilepostFeatures(...params);
	const lrsFeatureSet = await getLrsFeatures(lrsFeatureServerUrl, ...params);

	const groupedMPFeatures = Object.groupBy(
		milepostsFeatureSet.features as MilepostFeature[],
		(f) => `${f.attributes.RouteID}${f.attributes.Direction}`,
	);

	/**
	 * Iterates over the given mileposts and LRS features and yields a sequence of Graphics.
	 * Each graphic has an attributes property that is an object with the following properties:
	 *
	 * * `RouteID`
	 * * `Direction`
	 * * `SRMP`
	 * * `AheadBackInd`
	 * * `EndSRMP`
	 * * `EndAheadBackInd`
	 * * `ARM`
	 * * `EndARM`
	 * * `Azimuth`
	 * * `EndAzimuth`
	 * * `Longitude`
	 * * `EndLongitude`
	 * * `Latitude`
	 * * `EndLatitude`
	 * * `Northing`
	 * * `EndNorthing`
	 * * `Easting`
	 * * `EndEasting`
	 *
	 * Additionally, it will have a geometry property that is a Polyline representing the
	 * portion of the route between the two mileposts.
	 */
	function* enumerate() {
		for (const [suffixedRouteId, mpFeatures] of Object.entries(
			groupedMPFeatures,
		)) {
			if (!mpFeatures) {
				continue;
			}
			if (!isBeginAndEndMilepostTuple(mpFeatures)) {
				throw new Error("Expected exactly 2 mileposts");
			}
			const mpRangeAttributes = getMilepostRangeAttributes(mpFeatures);

			const lrsFeatures = lrsFeatureSet.features.filter(
				(f) => f.attributes.RouteIdentifier === suffixedRouteId,
			);

			const measures = mpFeatures.map((f) => f.attributes.ARM);
			if (measures.length !== 2) {
				throw new Error("Expected exactly 2 ARMs");
			}
			const routePolylines = lrsFeatures.map((lrsFeature) => {
				if (lrsFeature?.geometry?.type !== "polyline") {
					throw new TypeError("Expected results to be polyline", {
						cause: lrsFeature,
					});
				}
				return lrsFeature.geometry;
			});

			const segments = locateBetweenOperator.executeMany(
				routePolylines,
				...(measures as [number, number]),
			) as Polyline[];

			for (const segment of segments) {
				if (segment.type !== "polyline") {
					throw new TypeError("Expected results to be polyline", {
						cause: segment,
					});
				}
			}

			yield new Graphic({
				attributes: mpRangeAttributes,
				geometry: segments[0],
			});
		}
	}

	return [...enumerate()];
}
