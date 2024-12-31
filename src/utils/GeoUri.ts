import { LatLngTuple } from "./LatLng";

export type UncertaintyName = "u" | "U";
export type CrsName = "crs" | "CRS";
export const enum CrsLabel {
  wgs84 = "wgs84",
}

export type KeyValuePair =
  | `${CrsName}=${CrsLabel}`
  | `${UncertaintyName}=${number}`;

export type KeyValuePairWithSemicolonPrefix = `;${KeyValuePair}`;

export type CoordinateList = `${number},${number}${
  // optional altitude
  `,${number}` | ""
}`;

/**
 * A [GeoURI](https://geouri.org)
 *
 * @see {@link https://geouri.org GeoURI}
 */
export type GeoUriString =
  | `geo:${CoordinateList}`
  | `geo:${CoordinateList}${KeyValuePairWithSemicolonPrefix}`
  | `geo:${CoordinateList}${KeyValuePairWithSemicolonPrefix}${KeyValuePairWithSemicolonPrefix}`;

export interface GeoUrlOptions {
  /** Latitude */
  x: number;
  /** Longitude */
  y: number;
  /** Altitude */
  altitude?: number;
  /**
   * Coordinate Reference system.
   * Not needed for 4326
   * @see {@link https://www.rfc-editor.org/rfc/rfc5870#section-3.4.1 3.4.1. Coordinate Reference System Identification}
   */
  crs?: CrsLabel;
  /**
   * @see {@link https://www.rfc-editor.org/rfc/rfc5870#section-3.4.3}
   * > The 'u' ("uncertainty") parameter indicates the amount of uncertainty in the location as a value in meters.  Where a 'geo' URI is used to identify the location of a particular object, \<uval\> indicates the uncertainty with which the identified location of the subject is known.
   * >
   * > The 'u' parameter is optional and it can appear only once.  If it is not specified, this indicates that uncertainty is unknown or unspecified.  If the intent is to indicate a specific point in space, \<uval\> MAY be set to zero.  Zero uncertainty and absent uncertainty are never the same thing.
   * >
   * > The single uncertainty value is applied to all dimensions given in the URI.
   * >
   * > Note: The number of digits of the values in \<coordinates\> MUST NOT be interpreted as an indication to the level of uncertainty.
   */
  uncertaintyInMeters?: number;
}

/**
 * Constructs a GeoURI.
 * @param options - Provides values.
 * @returns A GeoURI string.
 */
export function createGeoUriString(options: GeoUrlOptions) {
  const { x, y, altitude } = options;

  /**
   * Create a mapping for additional,
   * semicolon separated parameters.
   */
  const argsMap = new Map<string, string>();
  if (options.crs) {
    argsMap.set("crs", options.crs);
  }
  if (options.uncertaintyInMeters) {
    argsMap.set("u", options.uncertaintyInMeters.toString());
  }

  /**
   * Enumerate over the items in the Map and yield
   * "key=value" strings.
   * @param map - A Map.
   */
  function* enumerateMapAsKeyEqualsValueStrings<K, V>(map: Map<K, V>) {
    for (const keyValuePair of map) {
      yield keyValuePair.join("=");
    }
  }

  // Create array of coordinates, optionally including altitude if provided.
  const coords = altitude
    ? ([y, x, altitude] as [number, number, number])
    : ([y, x] as [number, number]);

  // Construct the URL.
  let url = `geo:${coords.join(",")}`;

  // Add additional URL parameters if they have been provided.
  if (argsMap.size > 0) {
    url = [url, ...enumerateMapAsKeyEqualsValueStrings(argsMap)].join();
  }

  return url as GeoUriString;
}

/**
 * An object representing a GeoURI
 */
export class GeoUrl extends URL {
  public readonly x: number;
  public readonly y: number;
  public readonly altitude?: number;
  public readonly crs?: CrsLabel;
  public readonly uncertainty?: number;

  constructor(options: GeoUrlOptions) {
    super(createGeoUriString(options));
    this.x = options.x;
    this.y = options.y;
    this.altitude = options.altitude;
    this.crs = options.crs;
    this.uncertainty = options.uncertaintyInMeters;
  }

  /**
   * @inheritdoc
   */
  override toString(): GeoUriString {
    return super.toString() as GeoUriString;
  }

  public get latLngTuple(): LatLngTuple {
    return [this.y, this.x];
  }

  public get xyTuple(): [number, number] {
    return [this.x, this.y];
  }
}

export default GeoUrl;
