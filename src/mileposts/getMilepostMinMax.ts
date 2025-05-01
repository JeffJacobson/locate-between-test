import type { LrsDirection } from "../lrs.ts";
import type { AheadBackIndicator } from "./index.ts";

const { hasErrorProperty } = await import("../utils.ts");
const { defaultMilepostsServiceUrl } = await import("../url.ts");

const minSrmpFieldName = "MinSrmp";
const maxSrmpFieldName = "MaxSrmp";
const srmpFieldName = "SRMP";
const directionFieldName = "Direction";
const routeIdFieldName = "RouteID";
const aheadBackIndFieldName = "AheadBackInd";

const outStatistics = [
	{
		statisticType: "MIN",
		onStatisticField: srmpFieldName,
		outStatisticFieldName: minSrmpFieldName,
	},
	{
		statisticType: "MAX",
		onStatisticField: srmpFieldName,
		outStatisticFieldName: maxSrmpFieldName,
	},
] as const;

const commonQueryParams = {
	f: "json",
	outStatistics: JSON.stringify(outStatistics),
	groupByFieldsForStatistics: `${routeIdFieldName},${directionFieldName},${aheadBackIndFieldName}`,
	orderByFields: `${routeIdFieldName},${directionFieldName} DESC,${aheadBackIndFieldName} ASC,${minSrmpFieldName},${maxSrmpFieldName}`,
	// where: "RelRouteType IN ('', 'SP', 'AR')",
};

type MinMaxQueryParams = typeof commonQueryParams & {
	where: string;
};

interface MinMaxSrmpFeatureAttribute extends Record<string, unknown> {
	[routeIdFieldName]: string;
	[directionFieldName]: LrsDirection;
	[aheadBackIndFieldName]: AheadBackIndicator;
	[minSrmpFieldName]: number;
	[maxSrmpFieldName]: number;
}

interface Feature<
	A extends Record<string, unknown> = MinMaxSrmpFeatureAttribute,
> {
	attributes: A;
}

interface MinMaxFeatureSet {
	features: Feature<MinMaxSrmpFeatureAttribute>[];
}

function isMinMaxFeature(
	feature: unknown
): feature is Feature<MinMaxSrmpFeatureAttribute> {
	return (
		typeof feature === "object" &&
		feature != null &&
		"attributes" in feature &&
		typeof feature.attributes === "object" &&
		feature.attributes != null &&
		routeIdFieldName in feature.attributes &&
		directionFieldName in feature.attributes &&
		aheadBackIndFieldName in feature.attributes &&
		minSrmpFieldName in feature.attributes &&
		maxSrmpFieldName in feature.attributes &&
		typeof feature.attributes[routeIdFieldName] === "string" &&
		typeof feature.attributes[directionFieldName] === "string" &&
		typeof feature.attributes[aheadBackIndFieldName] === "string" &&
		typeof feature.attributes[minSrmpFieldName] === "number" &&
		typeof feature.attributes[maxSrmpFieldName] === "number"
	);
}

function isMinMaxFeatureSet(o: unknown): o is MinMaxFeatureSet {
	return (
		hasFeatures(o) && o.features.some((feature) => isMinMaxFeature(feature))
	);
}

function hasFeatures(o: unknown): o is MinMaxFeatureSet {
	return (
		typeof o === "object" &&
		o != null &&
		"features" in o &&
		Array.isArray(o.features)
	);
}
type MinMaxTuple = [min: number, max: number];

interface ABRanges {
	ahead?: MinMaxTuple;
	back?: MinMaxTuple;
}

interface MinMaxRangeProperties {
	routeId: string;
	increase?: ABRanges;
	decrase?: ABRanges;
}

/**
 * Represents a range of minimum and maximum SRMP values for a specific route.
 * Implements the {@link MinMaxRangeProperties} interface.
 */
export class MinMaxRange implements MinMaxRangeProperties {
/**
 * Constructs a new instance of the MinMaxRange class.
 *
 * @param routeId - The identifier for the route.
 * @param increase - An optional object representing the minimum and maximum SRMP values
 * in the increasing direction.
 * @param decrease - An optional object representing the minimum and maximum SRMP values
 * in the decreasing direction.
 */
	constructor(
		public routeId: string,
		public increase?: ABRanges,
		public decrease?: ABRanges
	) {}
}

/**
 * Query the State Route Mile Post (SRMP) feature service to get the minimum and
 * maximum SRMP values for the given route ID and direction.
 *
 * @param routeId - The route ID to query.
 * @param direction - The direction of travel, either "i" (increase) or "d" (decrease).
 * @param url - The URL of the SRMP feature service.
 * @returns A {@link MinMaxRange} object with the minimum and maximum SRMP values for the
 * given route ID and direction.
 */
export async function getMilepostMinMax(
	routeId: string,
	direction?: LrsDirection,
	url = defaultMilepostsServiceUrl
): Promise<MinMaxRange> {
	let where = `${routeIdFieldName} = '${routeId}'`;
	if (direction) {
		where += ` AND ${directionFieldName} = '${direction}'`;
	}
	const queryParams: MinMaxQueryParams = { ...commonQueryParams, where };
	// Convert queryParams to a URLSearchParams object
	const urlSearchParams = new URLSearchParams(
		Object.entries(queryParams).map(([key, value]) => [key, value])
	);
	const queryUrl = new URL(
		`?${urlSearchParams}`,
		// Append "/query/" to the end of the URL.
		url.href.replace(/\b\/?$/, "/query/")
	);
	const response = await fetch(queryUrl, { method: "GET" });
	const featureSet = await response.json();
	if (hasErrorProperty(featureSet)) {
		throw new Error("Feature service query error", {
			cause: featureSet.error,
		});
	}

	if (!isMinMaxFeatureSet(featureSet)) {
		throw new TypeError(
			"Feature query result did not have expected properties"
		);
	}

	const attributeSets = featureSet.features.map(({ attributes }) => attributes);

	let increaseA: MinMaxTuple | undefined;
	let increaseB: MinMaxTuple | undefined;
	let decreaseA: MinMaxTuple | undefined;
	let decreaseB: MinMaxTuple | undefined;

	for (const { Direction, AheadBackInd, MinSrmp, MaxSrmp } of attributeSets) {
		const array: MinMaxTuple = [MinSrmp, MaxSrmp];
		if (Direction === "i" && AheadBackInd === "A") {
			increaseA = array;
		} else if (Direction === "i" && AheadBackInd === "B") {
			increaseB = array;
		} else if (Direction === "d" && AheadBackInd === "A") {
			decreaseA = array;
		} else if (Direction === "d" && AheadBackInd === "A") {
			decreaseB = array;
		}
	}

	return new MinMaxRange(
		attributeSets[0].RouteID,
		{
			ahead: increaseA,
			back: increaseB,
		},
		{
			ahead: decreaseA,
			back: decreaseB,
		}
	);
}

export default getMilepostMinMax;
