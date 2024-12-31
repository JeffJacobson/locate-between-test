/**
 * Used for working with [GeoHack](https://www.mediawiki.org/wiki/GeoHack) URLs.
 */
import type { LatLngExpression, LatLngTuple } from "./LatLng";

// import type { LatLngExpression, LatLngTuple } from "leaflet";

/**
 * Detects if the input value is a {@link LatLngTuple}.
 * @param latLng - A {@link LatLngExpression}
 * @returns Returns true if it is a {@link LatLngTuple}, false otherwise.
 */
function isLatLngTuple(latLng: LatLngExpression): latLng is LatLngTuple {
  return (
    Array.isArray(latLng) &&
    typeof latLng[0] === "number" &&
    typeof latLng[1] === "number"
  );
}

/**
 * Creates a [GeoHack](https://www.mediawiki.org/wiki/GeoHack) URL.
 * @param latLng - A latitude,longitude value.
 * @param geohackUrl - The URL to GeoHack. You do not need to change this unless they move their website.
 * @returns - A GeoHack URL
 * @example
 * const url = createGeoHackUrl([45.6448,-122.6617]);
 * // Returned URL will be "https://geohack.toolforge.org/geohack.php?params=45.6448;-122.6617"
 */
export function createGeoHackUrl(
  latLng: LatLngExpression,
  geohackUrl = "https://geohack.toolforge.org/geohack.php",
) {
  let lat: number;
  let lng: number;
  if (isLatLngTuple(latLng)) {
    [lat, lng] = latLng;
  } else {
    lat = latLng.lat;
    lng = latLng.lng;
  }

  // Join the two numbers with a semicolon
  const params = [lat, lng].join(";");

  const outUrl = new URL(geohackUrl);
  outUrl.searchParams.set("params", params);

  return outUrl;
}

/**
 * Creates an anchor using a URL created by {@link createGeoHackUrl}.
 * @param ghParams - The same parameters as {@link createGeoHackUrl}.
 * @returns - An <a> with an href of a GeoHack URL with text indicating the location.
 */
export function createGeoHackAnchor(
  ...ghParams: Parameters<typeof createGeoHackUrl>
) {
  const url = createGeoHackUrl(...ghParams);
  const a = document.createElement("a");
  a.href = url.toString();
  a.text = `Geohack`;
  a.target = "_blank";

  return a;
}
