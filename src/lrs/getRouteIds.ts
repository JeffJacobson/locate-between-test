import { defaultLrsRoutesUrl } from "../url";

interface RouteQueryParameters {
	f: "json";
	where: "1=1";
	outFields: "RouteIdentifier";
	returnDistinct: true;
	returnGeometry: false;
	orderByFields: "StateRouteNumber,RelatedRouteQualifier,RelatedRouteType,InventoryDirection DESC";
	resultOffset?: number;
	resultRecordCount?: number;
}

const defaultQueryParameters: RouteQueryParameters = {
	f: "json",
	where: "1=1",
	outFields: "RouteIdentifier",
	returnDistinct: true,
	returnGeometry: false,
	orderByFields:
		"StateRouteNumber,RelatedRouteQualifier,RelatedRouteType,InventoryDirection DESC",
};

export interface OffsetParameters {
	resultOffset: number;
	resultRecordCount: number;
}

/**
 * Returns the total number of routes.
 * @param url - Milepost features service layer URL.
 * @returns
 */
export async function getRouteCount(
	url = defaultLrsRoutesUrl,
): Promise<{ count: number; queryUrl: URL }> {
	const urlParameters = new URLSearchParams({
		...convertObjectValuesToStrings(defaultQueryParameters),
		returnCountOnly: "true",
	});
	const queryUrl = new URL(appendQueryToUrl(url));
	const response = await fetch(new URL(`?${urlParameters}`, queryUrl));
	interface CountResponse {
		count: number;
	}

	const countObject = (await response.json()) as CountResponse;
	const { count } = countObject;
	return { count, queryUrl };
}

/**
 * Converts all the values of an object to strings.
 *
 * @param o - The object whose values are to be converted to strings.
 * @returns A new object with the same keys as the input object, but with all values converted to strings.
 */
function convertObjectValuesToStrings(o: object): Record<string, string> {
	return Object.fromEntries(
		Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? v : `${v}`]),
	);
}

/**
 * Appends "/query/" to the given URL, first appending a trailing slash if necessary.
 * @param url - The URL to which "/query/" is to be appended.
 * @returns The modified URL.
 */
function appendQueryToUrl(url: string) {
	let queryUrl = url;
	// Append trailing slash if not present
	if (!queryUrl.endsWith("/")) {
		queryUrl += "/";
	}
	queryUrl += "query/";
	return queryUrl;
}

interface RouteFeatureSet extends Record<string, unknown> {
	features: [
		{
			attributes: {
				RouteIdentifier: string;
			};
		},
	];
	exceededTransferLimit?: boolean;
}

export async function getRoutes(
	url = defaultLrsRoutesUrl,
	maxRecordCount = 1000,
) {
	const { count, queryUrl } = await getRouteCount(url);
	/**
	 * A generator that yields RouteQueryParameters objects with resultOffset and resultRecordCount
	 * set so as to iterate over the results in chunks of maxRecordCount, starting from the
	 * beginning of the result set.
	 *
	 * @yields A RouteQueryParameters object with resultOffset and resultRecordCount set.
	 */
	function* getOffsetGroups(): Generator<RouteQueryParameters> {
		for (let index = 0; index < count; index += maxRecordCount) {
			yield {
				...defaultQueryParameters,
				resultOffset: index,
				resultRecordCount: maxRecordCount,
			};
		}
	}
	const promises = [...getOffsetGroups()].map(async (queryParameters) => {
		const url = new URL(
			`?${new URLSearchParams(convertObjectValuesToStrings(queryParameters))}`,
			queryUrl,
		);
		const response = await fetch(url);
		const featureSet = (await response.json()) as RouteFeatureSet;
		return featureSet.features.map((f) => f.attributes.RouteIdentifier);
	});

	// Get the list of routes. Put it into a Set to remove duplicates.
	// Put it back into an array so it can be sorted.
	const routes = [...new Set((await Promise.all(promises)).flat())].sort();
	return routes;
}
