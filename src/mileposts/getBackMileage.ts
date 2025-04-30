import type { LrsDirection } from "../lrs.ts";
import { milepostsServiceQueryUrl } from "../mileposts/index.ts";
import { BadUrlError, isQueryUrl } from "../url.ts";

/**
 * Interface representing the attributes of a feature.
 * @template D - The direction type, defaults to "i" (inbound) or "d" (outbound).
 */
interface Attributes<D extends LrsDirection = "i" | "d"> {
	/** The Route ID, suffixed with the direction. */
	RouteID: `${string}${D}`;
	/** The direction of the route, either "i" or "d". */
	Direction: D;
	/** The State Route Mile Post number. */
	SRMP: number;
}

/**
 * A Feature from the State Route Mile Post (SRMP) Feature Service query.
 * @see https://data.wsdot.wa.gov/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0
 */
export interface Feature {
	/**
	 * The attributes of the feature.
	 * @see https://data.wsdot.wa.gov/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0/query?where=1%3D1&outFields=*&f=json
	 */
	attributes: Attributes;
}

/**
 * Returns arrays of SRMPs that are back mileage
 * keyed to their associated routes.
 * @param features - an array of features
 * @returns - A mapping of SRMPs to associated RouteID + direction string.
 */
function getAttributes(features: Feature[]): Map<string, number[]> {
	/**
	 * Pairs of 1. route ID + direction and 2. SRMP.
	 */
	const routeSrmpPairs = features.map(({ attributes }) => {
		return [
			`${attributes.RouteID}${attributes.Direction}`,
			attributes.SRMP,
		] as const;
	});

	/**
	 * routeSrmpPairs grouped by RouteID+Direction string
	 */
	const groups = Object.groupBy(routeSrmpPairs, ([routeId]) => routeId);

	/**
	 * Array of arrays for Map constructor.
	 */
	const items = [...Object.entries(groups)].map(([routeId, arrays]) => [
		routeId,
		arrays?.map((a) => a[1]),
	]) as [string, number[]][];

	const mapping = new Map(items);
	return mapping;
}

/**
 * Given a URL to the State Route Mile Post Feature Service query, returns a
 * mapping of SRMPs to associated RouteID + direction string.
 *
 * @param queryUrl - The URL to the State Route Mile Post Feature Service query.
 * @param direction - The direction of the route, either "i" (inbound) or "d" (outbound).
 * @returns A mapping of SRMPs to associated RouteID + direction string.
 */
export async function getBackMileposts(
	queryUrl: string | URL = milepostsServiceQueryUrl,
	direction?: LrsDirection,
) {
	const url = queryUrl instanceof URL ? queryUrl.toString() : queryUrl;

	if (!isQueryUrl(url)) {
		throw new BadUrlError(url, 'must end with "query"');
	}

	let executeQueryJSON: typeof import("@arcgis/core/rest/query.js").executeQueryJSON;
	let Query: typeof import("@arcgis/core/rest/support/Query.js").default;

	try {
		[{ executeQueryJSON }, Query] = await $arcgis.import(["@arcgis/core/rest/query.js", "@arcgis/core/rest/support/Query.js"] as const);
	} catch (error) {
		executeQueryJSON = (await import("@arcgis/core/rest/query.js"))
			.executeQueryJSON;
		Query = (await import("@arcgis/core/rest/support/Query.js")).default;
	}

	const wheres = (direction ? [direction] : (["i", "d"] as const)).map((d) => {
		return `AheadBackInd = 'B' AND Direction = '${d}'` as const;
	});

	const queries = wheres.map((where) => {
		return new Query({
			outFields: ["RouteID", "Direction", "SRMP"],
			where,
			returnDistinctValues: true,
			returnGeometry: false,
		});
	});

	const backSrmpsToRouteMaps = await Promise.all(
		queries.map((q) =>
			executeQueryJSON(url, q).then((r) => getAttributes(r.features)),
		),
	);

	if (backSrmpsToRouteMaps.length === 1) {
		return backSrmpsToRouteMaps[0];
	}

	const entries = backSrmpsToRouteMaps.flatMap((map) => [...map.entries()]);
	return new Map(entries);
}
