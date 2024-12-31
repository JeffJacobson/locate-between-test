/**
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/identify-map-service-.htm
 */
import { request } from "@esri/arcgis-rest-request";
import type {
  Point,
  Geometry,
  esriGeometryType,
  Position2D,
} from "arcgis-rest-api";

export const enum LayerSpecifier {
  all = "all",
  top = "top",
  visible = "visible",
}

export function createLayersString(
  layerSpecifier: LayerSpecifier,
  ...layerIds: number[]
) {
  if (!layerIds.length) {
    return layerSpecifier;
  }
  return `${layerSpecifier}:${layerIds.join(",")}`;
}

type XYString = `${number},${number}`;

type ImageDisplayString = `${number},${number},${number}`;

type MapExtentString = `${number},${number},${number},${number}`;

export interface IdentifyParameters {
  //   [key: string]: any;
  geometry: Point | XYString;
  geometryType?: "esriGeometryPoint";
  /** WKID */
  sr?: number;
  layerDefs?: string;
  /**
   * @see {@link createLayersString}
   */
  layers?: ReturnType<typeof createLayersString>; // `${LayerSpecifierValue}${`:${string}}` | ""}`;
  /** tolerance integer */
  tolerance: number;
  mapExtent: MapExtentString;
  /** <width>, <height>, <dpi> */
  imageDisplay: ImageDisplayString;
  returnGeometry: false;
  /* Return field name instead of alias. Defaults to false. */
  returnFieldName?: boolean;
  f: "json";
}

export interface IdentifyParametersConstruction
  extends Omit<
    IdentifyParameters,
    | "geometry"
    | "geometryType"
    | "layerDefs"
    | "layers"
    | "mapExtent"
    | "imageDisplay"
    | "returnGeometry"
    | "f"
  > {
  geometry: Position2D;
  layerDefs?: Map<number, string>;
  layers?: Parameters<typeof createLayersString>;
  mapExtent: [number, number, number, number];
  imageDisplay: [number, number, number];
}

function createIdentifyParameters(
  options: IdentifyParametersConstruction,
): IdentifyParameters {
  const output: IdentifyParameters = {
    geometry: options.geometry.join(",") as XYString,
    tolerance: options.tolerance,
    imageDisplay: options.imageDisplay.join(",") as ImageDisplayString,
    mapExtent: options.mapExtent.join(",") as MapExtentString,
    returnGeometry: false,
    f: "json",
  };

  if (options.layerDefs) {
    const temp: Record<string, string> = {};
    for (const [layerId, def] of options.layerDefs.entries()) {
      temp[layerId.toString()] = def;
    }
    output.layerDefs = JSON.stringify(temp);
  }
  if (options.layers) {
    output.layers = createLayersString(...options.layers);
  }

  return output;
}

/*
https://data.wsdot.wa.gov/arcgis/rest/services/DataLibrary/DataLibrary/MapServer/identify

layers
    Political Administration Boundaries (0)
        [x] Cadastral Framework Township Subdivision (1)
        [x] Cadastral Framework Township (2)
        [x] Cadastral Framework County Boundary (3)
        [ ] Cadastral Framework State Boundary (4)
        [x] City Limits (5)
        [ ] Cities Point (6)
        [ ] Geographic Names of Washington (GNIS) (7)
        [ ] Populated Places (8)
        [ ] Legislative Districts (9)
        [ ] Congressional Districts (10)
        [ ] Tribal Lands (11)
        [ ] Urban Growth Areas (12)
        [ ] WSDOT Maintenance Areas 24k (13)
        [ ] WSDOT Regions 24k (14)
    Roadway Classification (15)
        [ ] Functional Class State Route (16)
        [ ] Functional Class Non State Route (17)
    Water Resource Inventory Areas 24k (WRIA) (18)
*/

// "esriFieldTypeOID", "esriFieldTypeDouble", "esriFieldTypeString", "esriFieldTypeSmallInteger", "esriFieldTypeGeometry", "esriFieldTypeInteger", "esriFieldTypeDate", "esriFieldTypeGlobalID", "esriFieldTypeSingle"

export interface IdentifyResult {
  layerId: number;
  layerName: string;
  value: string | number;
  displayFieldName: string;
  attributes: Record<string, string | number | Date | Geometry>;
  geometryType: esriGeometryType;
  hasZ?: boolean; //added in 10.1
  hasM?: boolean; //added in 10.1
  geometry: Geometry;
}

export interface IdentifyResponse {
  results: IdentifyResult[];
}

const idUrl =
  "https://data.wsdot.wa.gov/arcgis/rest/services/DataLibrary/DataLibrary/MapServer/identify";

export async function identify(
  idOptions: IdentifyParametersConstruction,
  url: string | URL = idUrl,
) {
  const idParams = createIdentifyParameters(idOptions);

  if (url instanceof URL) {
    url = url.toString();
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const response: IdentifyResponse = await request(url, {
    params: idParams,
  });

  return response;
}
