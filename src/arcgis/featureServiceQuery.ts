// aliasArrays will be an array where each element in the array
// will be an array of two strings.
import aliasArrays from "./field-aliases.json";
// Layer definitions for the query are defined in this JSON file.
import layerDefObject from "./layer-defs.json";
import type {
  AttributeValue,
  FeatureServiceQueryResponse,
  QueryResponseLayer,
} from "./typesAndInterfaces";
import { IRequestOptions, request } from "@esri/arcgis-rest-request";

export const defaultUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/DataLibrary/DataLibrary/FeatureServer/";

// Define the layer definitions for the feature service query.
const layerDefs = JSON.stringify(layerDefObject);

export type FieldAliasMap = Map<string, string>;

const aliasMap = Array.isArray(aliasArrays)
  ? new Map(aliasArrays as [string, string][])
  : undefined;

/**
 * Query a feature service for features that intersect with
 * the given point.
 * @param xy - WGS 86 XY coordinates
 * @param featureServiceUrl - Feature service URL
 * @returns
 */
export async function query(
  xy: [number, number],
  featureServiceUrl: string = defaultUrl,
) {
  const queryUrl = new URL("query", featureServiceUrl);
  const queryParams: IRequestOptions = {
    params: {
      geometry: xy.join(","),
      geometryType: "esriGeometryPoint",
      inSR: 4326,
      spatialRel: "esriSpatialRelIntersects",
      layerDefs: layerDefs,
      returnGeometry: false,
      f: "json",
    },
  };
  console.debug("query params", queryParams);
  const response = (await request(
    queryUrl.toString(),
    queryParams,
  )) as FeatureServiceQueryResponse;

  return response;
}

/**
 * Enumerates all of the fields and returns field name and alias
 * pairs. The output can be used to construct a Map.
 * @param layer - An element of the query response "layers" array.
 * @param aliasOverrides - If the feature service's aliases are not to your liking,
 * you can override them with this mapping, with your desired aliases mapped to
 * the corresponding field names.
 * @yields Two-element arrays containing fields' name and alias,
 * respectively. If there is no alias then both elements in the
 * array will contain the field name.
 * @example
 * const aliasMap = new Map(enumerateFieldAliases(layer));
 */
function* enumerateFieldAliases(
  layer: QueryResponseLayer,
  aliasOverrides?: FieldAliasMap,
) {
  if (layer.fields) {
    for (const field of layer.fields) {
      const { name } = field;
      let { alias } = field;
      alias = aliasOverrides?.get(name) ?? name;
      yield [name, alias] as [string, string];
    }
  }
}

/**
 * Create a case-insensitive regular expression
 * that will match any of the input strings.
 * The regex will only match strings that are identical
 * to the input and not longer strings that contain
 * the input text.
 * @param items - Text that should trigger a match.
 * @returns
 */
function createRegex(...items: string[]) {
  // Surround each of the input items with parenthesis
  // to make a group.
  items = items.map((i) => `(?:${i})`);
  // Join the groups with "or" character.
  const pattern = `^(${items.join("|")})$`;
  // Create a regex object using the pattern.
  return new RegExp(pattern, "i");
}

/**
 * Enumerates through the attributes of the layers of a
 * feature service query response.
 * @param response - response from a feature service query
 * @example
 * // Create a Map.
 * const attributeMap = new Map(
 *  enumerateQueryResponseAttributes(layer)
 * );
 * @example
 * // Create an object
 * const record: Record<string, AttributeValue> = {};
 * for (const [name, value] of enumerateQueryResponseAttributes(layer)) {
 *   record[name] = value;
 * }
 */
export function* enumerateQueryResponseAttributes(
  response: FeatureServiceQueryResponse,
  fieldsToOmit: string[] = ["OBJECTID"],
  aliasOverrides = aliasMap,
) {
  // Create a regular expression that will match the names of fields
  // that will be omitted from being yielded.
  const fieldsToOmitRegex =
    fieldsToOmit && fieldsToOmit.length ? createRegex(...fieldsToOmit) : null;
  for (const layer of response.layers) {
    for (const feature of layer.features) {
      // Create a mapping of field names to corresponding aliases.
      const aliasMap = new Map<string, string>([
        ...enumerateFieldAliases(layer, aliasOverrides),
      ]);
      for (const name in feature.attributes as Record<string, AttributeValue>) {
        if (Object.prototype.hasOwnProperty.call(feature.attributes, name)) {
          // Skip unwanted fields.
          if (fieldsToOmitRegex && fieldsToOmitRegex.test(name)) {
            continue;
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const value = feature.attributes[name] as AttributeValue;
          // The output of aliasMap.get should always be
          // string rather than undefined, but just in case,
          // default to name.
          const alias = aliasMap.get(name) ?? name;
          yield [alias, value] as [typeof alias, typeof value];
        }
      }
    }
  }
}
