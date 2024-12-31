import type {
  esriGeometryType,
  Feature,
  Field,
  SpatialReference,
} from "arcgis-rest-api";

export type AttributeValue = string | number | boolean | null;

export enum layerDefStringFormat {
  simple = 0,
  json = 1,
  includeOutFields = 2,
}

export class LayerDef<W extends string, F extends string> {
  constructor(
    public layerId: number,
    public where: W,
    public outFields?: F[],
  ) {}
}

export interface QueryResponseLayer {
  id: number;
  objectIdFieldName?: string;
  globalIdFieldName?: string;
  geometryType?: esriGeometryType;
  spatialReference?: SpatialReference;
  fields?: Field[];
  features: Feature[];
}

export interface FeatureServiceQueryResponse {
  layers: QueryResponseLayer[];
}
