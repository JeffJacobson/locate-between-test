export const defaultLrsRoutesUrl = "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/LRSData/FeatureServer/9/";

/**
 * The default URL of the State Route Mile Post (SRMP) service.
 */
export const defaultMilepostsServiceUrl = new URL(
	"https://data.wsdot.wa.gov/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0/"
);

/**
 * An error that is thrown when a URL does not match the expected format.
 */
export class BadUrlError extends Error {
	/**
	 * @param url The URL that failed to match the expected format
	 * @param expectedFormat The expected format of the URL, either a string or a regular expression
	 * @param message The error message to display. If not specified, then a default message is generated.
	 * @param options Any additional options to pass to the Error constructor.
	 */
	constructor(
		public readonly url: string | URL,
		public readonly expectedFormat: string | RegExp,
		...[message, options]: ConstructorParameters<typeof Error>
	) {
		const formatString =
			expectedFormat instanceof RegExp
				? `/${expectedFormat.source}/`
				: `"${expectedFormat}"`;
		super(
			message ?? `URL ${url} does not match expected format, "${formatString}"`,
			options,
		);
	}
}

/**
 * Type for a URL that may or may not end with a slash.
 * @template T The type of the URL without the slash.
 */
export type EndsWithSlash<T extends string> = `${T}/`;

/**
 * Type for a URL that may end with a slash or not.
 * @template T The type of the URL without the slash.
 */
export type MayEndWithSlash<T extends string> = T | `${T}/`;

/**
 * Type for the base ArcGIS REST URL.
 */
export type ArcGisRestUrl = `https://${string}}/arcgis/rest/services`;

/**
 * Type for the type of ArcGIS REST service.
 */
export type ServiceType = "Map" | "Feature";

/**
 * Type for the URL of an ArcGIS REST service.
 * @template T The type of service ("Map" or "Feature").
 */
export type ServiceUrl<T extends ServiceType = ServiceType> =
	`${ArcGisRestUrl}/${string}/${T}Server`;

/**
 * Type for the URL of a layer in an ArcGIS REST service.
 * @template T The type of service ("Map" or "Feature").
 */
export type LayerUrl<T extends ServiceType = ServiceType> =
	`${ServiceUrl<T>}/${number}`;

/**
 * Type for the URL of a query in an ArcGIS REST service.
 * @template T The type of service ("Map" or "Feature").
 */
export type QueryUrl<T extends ServiceType = ServiceType> =
	`${ServiceUrl<T>}/${string}/query`;

interface UrlParseOutput {
	folder?: string;
	serviceName: string;
	serviceType: string;
	layerId?: number;
	operation?: string;
}

export function parseUrl(url: string): UrlParseOutput {
	const testOnlyRestRoot = /(?<=^https:\/\/[^/]+\/arcgis\/rest\/services\/).+/;

	const rootOnlyMatch = testOnlyRestRoot.exec(url);
	if (!rootOnlyMatch) {
		throw new BadUrlError(url, testOnlyRestRoot);
	}

	/*
	# example URLs pathnames

	/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer
	/arcgis/rest/services/AllStateRoutePoints/MapServer
	/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0
	/arcgis/rest/services/AllStateRoutePoints/MapServer/0
	/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/query
	/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0/query
	/arcgis/rest/services/AllStateRoutePoints/MapServer/query
	/arcgis/rest/services/AllStateRoutePoints/MapServer/0/query
	 */

	const pathnameRe =
		/arcgis\/rest\/services(?:\/(?<folder>\w+))?\/(?<serviceName>\w+)\/(?<serviceType>Map|Feature)Server(?:\/(?<layerId>\d+))?/g;

	const urlObject = new URL(url);

	const match = pathnameRe.exec(urlObject.pathname);

	if (!match?.groups) {
		throw new BadUrlError(url, pathnameRe);
	}

	const folder: string | undefined = match.groups.folder;
	const serviceName = match.groups.serviceName;
	const serviceType = match.groups.serviceType;
	const layerId = match.groups.layerId
		? Number.parseInt(match.groups.layerId)
		: undefined;

	const operation = url.split(match[0]).at(1)?.replace(/^\//, "");

	return {
		folder: folder,
		serviceName,
		serviceType,
		layerId: layerId,
		operation: operation || undefined,
	};
}

/**
 * Returns true if the given URL ends with "/query" or "/query/", and false otherwise.
 *
 * @param url The URL to check
 * @param hasTrailingSlash If specified, the function will check if the URL ends with a slash.
 *                         If true, the URL must end with "/query/", and if false, the URL must end with "/query".
 *                         If unspecified, the function will return true if the URL ends with "/query" or "/query/".
 * @returns True if the URL is a query URL, and false otherwise.
 */
export function isQueryUrl<T extends boolean>(
	url: string,
	hasTrailingSlash?: T,
): url is T extends true
	? EndsWithSlash<QueryUrl>
	: T extends false
		? QueryUrl
		: MayEndWithSlash<QueryUrl> {
	const match = /\bquery\b\/?$/gi.exec(url);
	if (!match) {
		return false;
	}
	const inputEndsWithASlash = match[0].endsWith("/");

	return hasTrailingSlash === undefined
		? !!match
		: inputEndsWithASlash && hasTrailingSlash;
}
