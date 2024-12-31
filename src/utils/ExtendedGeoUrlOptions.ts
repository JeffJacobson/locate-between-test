import {
  CrsLabel,
  createGeoUriString,
  type GeoUriString,
  type GeoUrlOptions,
} from "./GeoUri";

export type AuthorityUppercase = "EPSG" | "ESRI";
export type Authority = AuthorityUppercase | Lowercase<AuthorityUppercase>;

export type CoordinateReferenceSystem = CrsLabel | `${Authority}:${number}`;
export const crsRe = /^(?<authority>\w{4}):(?<wkid>\d+)$/i;

export function isCrs(input: string): input is CoordinateReferenceSystem {
  return !!input && (input === CrsLabel.wgs84.valueOf() || crsRe.test(input));
}

export type GeoUrlSearchParameters = Record<string, string> & {
  /**
   * Used for address query
   */
  q?: string;
  /**
   * Zoom level
   */
  z?: number;
};

export type ExtendedGeoUrl = `${GeoUriString}${"" | `;${string}=${string}`}${
  | `?${string}`
  | ""}`;

/**
 * This is for non-standard extensions to GeoURI
 *
 * @example
 * * Examples from [RFC 5870](https://www.rfc-editor.org/rfc/rfc5870)
 * > * `geo:323482,4306480;crs=EPSG:32618;u=20`
 * > * `geo:37.786971,-122.399677;crs=Moon-2011;u=35`
 * > * `geo:323482,4306480;CRS=epsg:32718;U=20;mapcolors=for_daltonic`
 *
 * From [Android Developers > Docs > Guides > Common Intents](https://developer.android.com/guide/components/intents-common#Maps)
 *
 * > * `geo:latitude,longitude`
 * >
 * >     Show the map at the given longitude and latitude.
 * >
 * >     Example: `geo:47.6,-122.3`
 * >
 * > * `geo:latitude,longitude?z=zoom`
 * >
 * >     Show the map at the given longitude and latitude at a certain zoom level. A zoom level of 1 shows the whole Earth, centered at the given lat,lng. The highest (closest) zoom level is 23.
 * >
 * >     Example: `geo:47.6,-122.3?z=11`
 * >
 * > * `geo:0,0?q=lat,lng(label)`
 * >
 * >     Show the map at the given longitude and latitude with a string label.
 * >
 * >     Example: `geo:0,0?q=34.99,-106.61(Treasure)`
 * >
 * > * `geo:0,0?q=my+street+address`
 * >
 * >     Show the location for "my street address" (may be a specific address or location query).
 * >
 * >     Example: `geo:0,0?q=1600+Amphitheatre+Parkway%2C+CA`
 * >
 * >
 * >     Note: All strings passed in the geo URI must be encoded. For example, the string `1st & Pike, Seattle` should become `1st%20%26%20Pike%2C%20Seattle`. Spaces in the string can be encoded with `%20` or replaced with the plus sign (`+`).
 */
export interface ExtendedGeoUrlOptions extends Omit<GeoUrlOptions, "crs"> {
  /**
   * Coordinate Reference system.
   * Not needed for 4326
   */
  crs?: CoordinateReferenceSystem;
  /**
   * Additional search parameters
   */
  search?: GeoUrlSearchParameters;
}

/**
 * Constructs GeoURI with non-standard features.
 * @param options
 * @see {@link createGeoUriString}
 */
export function createExtendedGeoUri(options: ExtendedGeoUrlOptions) {
  let url: string = createGeoUriString(options as GeoUrlOptions);
  // Add search parameters if provided.
  if (options.search) {
    const search = new URLSearchParams(options.search);
    url = [url, search].join("?");
  }
  return url;
}
