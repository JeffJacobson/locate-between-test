import {
	isRouteAttributes,
	type LrsDirection,
	type RouteFeatureAttributes,
} from "../lrs";
import {
	isMilepostAttributes,
	Srmp,
	type AheadBackIndicator,
	type Direction,
} from "../mileposts";
import esriRequest from "@arcgis/core/request.js";
import type Graphic from "@arcgis/core/Graphic";
import * as locateBetweenOperator from "@arcgis/core/geometry/operators/locateBetweenOperator.js";
import { toGraphics } from "./conversion";
import { isLayerResponse } from "./type-guards";

// import { setupInterceptors } from "./interceptors";
// setupInterceptors();

interface ResponseSpatialReference {
	wkid: number;
	latestWkid?: number;
}

interface ResponseField {
	name: string;
	alias: string;
	type: string;
	length?: number;
}

interface ResponseGeometry {
	hasM?: boolean;
}

interface ResponsePoint extends ResponseGeometry {
	x: number;
	y: number;
}

export type Position = [number, number];
export type PositionWithM = [...Position, number];

interface ResponsePolyline<P extends Position | PositionWithM>
	extends ResponseGeometry {
	paths: P[][];
}

export type PossibleGeometries =
	| ResponsePoint
	| ResponsePolyline<Position | PositionWithM>;

export interface MilepostAttributes extends Record<string, unknown> {
	[MilepostFields.RouteID]: string;
	Direction: Direction;
	SRMP: number;
	AheadBackInd: AheadBackIndicator;
	ARM: number;
}

export interface ResponseLayer<
	G extends PossibleGeometries,
	A extends RouteFeatureAttributes | MilepostAttributes,
> {
	id: number;
	objectIdFieldName: string;
	globalIdFieldName: string;
	geometryType: `esriGeometry${"Point" | "Polyline"}`;
	spatialReference: ResponseSpatialReference;
	fields: ResponseField[];
	features: {
		geometry: G;
		attributes: A;
	}[];
}

export enum FeatureClassLayerId {
	Milepost = 0,
	Route = 1,
}

export interface LrsResponseLayer<P extends Position | PositionWithM>
	extends ResponseLayer<ResponsePolyline<P>, RouteFeatureAttributes> {
	id: FeatureClassLayerId.Route;
	geometryType: "esriGeometryPolyline";
}

export interface MilepostResponseLayer
	extends ResponseLayer<ResponsePoint, MilepostAttributes> {
	id: FeatureClassLayerId.Milepost;
	geometryType: "esriGeometryPoint";
}

export interface LayerQueryResponse<L extends LayerTypes>
	extends Record<string, unknown> {
	layers: L[];
	exceededTransferLimit?: boolean;
}

interface LayerDef {
	layerId: number;
	where: string;
	outFields: string;
}

interface RouteSegmentQueryOption {
	routeId: string;
	routeDirection: LrsDirection;
	beginSrmp: Srmp | ConstructorParameters<typeof Srmp>;
	endSrmp: Srmp | ConstructorParameters<typeof Srmp>;
}

function toSrmp(
	srmpInput: RouteSegmentQueryOption["beginSrmp" | "endSrmp"],
): Srmp {
	return srmpInput instanceof Srmp ? srmpInput : new Srmp(...srmpInput);
}
function createMPWhere(options: RouteSegmentQueryOption) {
	const {
		routeId,
		beginSrmp: beginSrmpInput,
		endSrmp: endSrmpInput,
		routeDirection: direction,
	} = options;
	// const [beginMP, beginAheadBackInd] = [beginSrmp]
	// const [endMP, endAheadBackInd] = Srmp.toTuple(endSrmp);

	const [beginSrmp, endSrmp] = [beginSrmpInput, endSrmpInput].map(toSrmp);

	const beginMP = beginSrmp.milepost;
	const beginAheadBackInd = beginSrmp.aheadOrBackIndicator;
	const endMP = endSrmp.milepost;
	const endAheadBackInd = endSrmp.aheadOrBackIndicator;

	const parts = [
		`RouteID = '${routeId}'`,
		`(
			(SRMP = ${beginMP} AND AheadBackInd = '${beginAheadBackInd}')
			OR
			(SRMP = ${endMP} AND AheadBackInd = '${endAheadBackInd}')
		)`,
	];

	if (direction) {
		parts.push(`Direction IN ('${direction}', 'b')`);
	}
	const where = parts.join(" AND ");
	return where;
}

function createLrsWhere(
	options: Pick<RouteSegmentQueryOption, "routeId" | "routeDirection">,
) {
	const { routeId, routeDirection } = options;
	return routeDirection
		? `${LrsFields.RouteIdentifier} = '${routeId}${routeDirection}'`
		: `${LrsFields.RouteIdentifier} LIKE '${routeId}_'`;
}

enum MilepostFields {
	RouteID = "RouteID",
	Direction = "Direction",
	SRMP = "SRMP",
	AheadBackInd = "AheadBackInd",
	ARM = "ARM",
}

enum LrsFields {
	RouteIdentifier = "RouteIdentifier",
}

function createLayerDefs(
	option: RouteSegmentQueryOption,
): [LayerDef, LayerDef] {
	const milepostFields = Object.values(MilepostFields);
	const lrsFields = Object.values(LrsFields);
	const milepostLayerDef = {
		layerId: 0,
		where: createMPWhere(option),
		outFields: milepostFields.join(","),
	};

	const lrsLayerDef = {
		layerId: 1,
		where: createLrsWhere(option),
		outFields: lrsFields.join(","),
	};

	return [milepostLayerDef, lrsLayerDef];
}

/**
 * Appends a trailing slash to a URL if it is not already present.
 * @param url - input URL
 * @returns - Returns a new {@link URL} object with a trailing slash.
 */
function appendSlash(url: string | URL) {
	let href = url instanceof URL ? url.href : url;
	if (!href.endsWith("/")) {
		href += "/";
	}
	return new URL(href);
}

export type LayerTypes =
	| LrsResponseLayer<Position | PositionWithM>
	| MilepostResponseLayer;

/**
 * Represents the options for querying the LRS feature service.
 */
interface QueryFeatureServiceOptions extends RouteSegmentQueryOption {
	outSR?: number;
	lrsFeatureServiceUrl: string | URL;
}

/**
 * An object containing an array of milepost {@link Graphic|Graphics} and an array of route {@link Graphic|Graphics}.
 */
interface queryFeatureServiceOutput {
	/**
	 * An array of milepost {@link Graphic|Graphics}
	 */
	mileposts: Graphic[];
	/**
	 * An array of route {@link Graphic|Graphics}
	 */
	routes: Graphic[];
}

/**
 * Queries the feature service using the provided options and returns the results as graphics.
 *
 * @param options - The query options including route segment details and LRS feature service URL.
 * @returns An object containing graphics for mileposts and routes.
 *
 * @throws {TypeError} If the response is not in the expected format, or if no milepost or LRS results are found.
 */
async function queryFeatureService(
	options: QueryFeatureServiceOptions,
): Promise<queryFeatureServiceOutput> {
	// Create the layer definitions for the query.
	const layerDefs = createLayerDefs(options);
	// Encode the layer definitions as a JSON string.
	const layerDefsString = JSON.stringify(layerDefs);

	// Create the request options for the query.
	const requestOptions: __esri.RequestOptions = {
		query: {
			f: "json",
			layerDefs: layerDefsString,
			outSR: 3857,
			returnGeometry: true,
			returnM: true,
		},
	};

	// Create the URL for the query.
	const queryUrl = new URL("query", appendSlash(options.lrsFeatureServiceUrl));

	// Send the query and get the response.
	const response = await esriRequest(queryUrl, { ...requestOptions });
	const responseData = response.data;

	// Check if the response is in the expected format and throw an error if it is not.
	if (!isLayerResponse(responseData)) {
		throw new TypeError("Unexpected response", {
			cause: {
				response,
			},
		});
	}

	// Loop through the response layers and store the milepost and LRS layers in separate variables.
	const { layers } = responseData;

	let mpLayer: MilepostResponseLayer | undefined;
	let lrsLayer: LrsResponseLayer<PositionWithM> | undefined;

	for (const l of layers) {
		if (l.id === 0) {
			mpLayer = l;
		} else if (l.id === 1) {
			lrsLayer = l as NonNullable<typeof lrsLayer>;
		}
	}

	// Throw an exception if either the milepost or LRS layer is not found in the response.
	if (!mpLayer) {
		throw new TypeError("No milepost results found", {
			cause: { response },
		});
	}
	if (!lrsLayer) {
		throw new TypeError("No LRS results found");
	}

	// Convert the milepost and LRS features to graphics.
	const milepostGraphics = toGraphics(mpLayer);
	const lrsGraphics = toGraphics(lrsLayer);
	return {
		mileposts: milepostGraphics,
		routes: lrsGraphics,
	};
}

/**
 * Represents the property name to filter on, either "beginSrmp" or "endSrmp".
 */
type MilepostPropertyName = keyof Pick<
	RouteSegmentQueryOption,
	"beginSrmp" | "endSrmp"
>;

/**
 * Filters a milepost graphic based on the given property name and query options.
 * @template P - The property name to filter on, either "beginSrmp" or "endSrmp".
 * @param g - The milepost graphic to filter
 * @param propertyName - The property name to filter on
 * @param options - The query options. Only the property specified by {@link propertyName} is accessed.
 * @returns Whether the milepost graphic matches the given query options.
 */
function filterMP<P extends MilepostPropertyName>(
	g: Graphic,
	propertyName: P,
	options: Pick<RouteSegmentQueryOption, P>,
) {
	const { SRMP: mp, AheadBackInd: ab } = g.attributes as MilepostAttributes;
	const srmp = toSrmp(options[propertyName]);
	return srmp.milepost === mp && srmp.aheadOrBackIndicator === ab;
}

/**
 * Gets the line segment for a given route and mileposts.
 *
 * @param routeGraphic the route graphic
 * @param milepostGraphics the milepost graphics
 * @param options the query options
 * @returns the line segment that represents the route segment between the begin and end mileposts
 *
 * @throws {TypeError} if the begin and end milepost are not found
 */
function getLineSegment(
	routeGraphic: Graphic,
	milepostGraphics: Graphic[],
	options: QueryFeatureServiceOptions,
) {
	// ArcGIS Graphic.attributes is typed as any, so we need to cast it to RouteFeatureAttributes
	if (!isRouteAttributes(routeGraphic.attributes)) {
		throw new TypeError("Expected route graphic to have route attributes.", {
			cause: routeGraphic,
		});
	}
	const lrsAttributes = routeGraphic.attributes;
	// The RouteIdentifiers in the LRS layer are suffixed with the direction.
	const suffixedRouteId = lrsAttributes.RouteIdentifier;
	// Separate the route ID from the direction.
	const suffix = suffixedRouteId.slice(-1) as LrsDirection;
	const routeId = suffixedRouteId.slice(0, -1);

	/**
	 * Returns whether the given graphic matches the route ID and direction of the route
	 * segment that is being queried.
	 *
	 * @param g - The graphic to check
	 * @returns Whether the graphic matches the route ID and direction of the route
	 * segment
	 */
	function matchesRouteIdAndDirection(g: Graphic): boolean {
		if (!isMilepostAttributes(g.attributes)) {
			return false;
		}
		const {
			attributes: { RouteID, Direction },
		} = g;
		return RouteID === routeId && (Direction === suffix || Direction === "b");
	}
	// Filter the milepost graphics to those that match the input options,
	// RouteID and Direction.
	const matchingMileposts = milepostGraphics.filter(matchesRouteIdAndDirection);

	let beginArm: number | undefined;
	let endArm: number | undefined;

	for (const g of milepostGraphics) {
		if (!matchesRouteIdAndDirection(g)) {
			continue;
		}
		if (filterMP(g, "beginSrmp", options)) {
			beginArm = g.attributes.ARM;
		} else if (filterMP(g, "endSrmp", options)) {
			endArm = g.attributes.ARM;
		}
		if (beginArm != null && endArm != null) {
			break;
		}
	}

	// TODO: Convert ARM from miles to meters if necessary.

	if (beginArm == null || endArm == null) {
		throw new TypeError("begin and end milepost not found", {
			cause: {
				matchingMileposts,
				routeId,
				routeGraphic: routeGraphic,
			},
		});
	}

	const routeSegment = locateBetweenOperator
		.executeMany([routeGraphic.geometry], beginArm, endArm)
		.at(0);
	if (!routeSegment) {
		throw new TypeError("route segment not found", {
			cause: {
				routeGraphic,
				beginArm,
				endArm,
			},
		});
	}
	return routeSegment;
}

export interface GetMilepostSegmentOutput {
	routeId: string;
	routeGraphic: Graphic;
	milepostGraphics: Graphic[];
	routeSegment: __esri.Geometry;
	options: RouteSegmentQueryOption & {
		outSR?: number;
		lrsFeatureServiceUrl: string | URL;
	};
}

/**
 * Queries the feature service milepost and route layers for features that match the given route ID and (for mileposts) SRMP and AB values,
 * and returns a map of route IDs to objects containing the route graphic, milepost graphics, and the route segment geometry between the two mileposts.
 *
 * @param options - The options object containing the route segment query options, including the route ID, SRMP, AB, and direction.
 * @returns A map of route IDs to objects containing the route graphic, milepost graphics, and the route segment geometry between the two mileposts.
 */
export async function* getMilepostSegment(
	options: RouteSegmentQueryOption & {
		outSR?: number;
		lrsFeatureServiceUrl: string | URL;
	},
): AsyncGenerator<GetMilepostSegmentOutput, void, unknown> {
	// Query the feature service milepost and route layers for features that match the given route ID and (for mileposts) SRMP and AB values.
	const { mileposts: milepostGraphics, routes: routeGraphics } =
		await queryFeatureService(options);

	// Loop through each route's graphic.
	for (const routeGraphic of routeGraphics) {
		// Extract the line segment.
		if (!isRouteAttributes(routeGraphic.attributes)) {
			throw new TypeError("Expected route graphic to have route attributes.", {
				cause: routeGraphic,
			});
		}
		const routeSegment = getLineSegment(
			routeGraphic,
			milepostGraphics,
			options,
		);
		const { RouteIdentifier: routeId } = routeGraphic.attributes;
		yield { routeId, routeGraphic, milepostGraphics, routeSegment, options };
	}
}
