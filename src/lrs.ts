/**
 * The LRS only has two directions, "i" for increase and "d" for decrease.
 */
export type LrsDirection = "i" | "d";

export interface RouteFeatureAttributes {
	/*
	 * OBJECTID ( type: esriFieldTypeOID, alias: Object ID, editable: false, nullable: false, defaultValue: null, modelName: OBJECTID )
	 */
	OBJECTID?: number;
	/*
	 * RouteIdentifier ( type: esriFieldTypeString, alias: Route Identifier, editable: false, nullable: true, length: 75, defaultValue: null, modelName: RouteID )
	 */
	RouteIdentifier: string;
	/*
	 * Label ( type: esriFieldTypeString, alias: Label, editable: false, nullable: true, length: 40, defaultValue: null, modelName: DISPLAY )
	 */
	Label?: string;
	/*
	 * SymbolCode ( type: esriFieldTypeString, alias: Symbol Code, editable: false, nullable: true, length: 3, defaultValue: null, modelName: RT_TYPEA )
	 */
	SymbolCode?: string;
	/*
	 * StateRouteNumber ( type: esriFieldTypeString, alias: State Route Number, editable: false, nullable: true, length: 3, defaultValue: null, modelName: StateRouteNumber )
	 */
	StateRouteNumber?: string;
	/*
	 * RelatedRouteType ( type: esriFieldTypeString, alias: Related Route Type, editable: false, nullable: true, length: 2, defaultValue: null, modelName: RelRouteType )
	 */
	RelatedRouteType?: string;
	/*
	 * RelatedRouteQualifier ( type: esriFieldTypeString, alias: Related Route Qualifier, editable: false, nullable: true, length: 7, defaultValue: null, modelName: RelRouteQual )
	 */
	RelatedRouteQualifier?: string;
	/*
	 * LRSDate ( type: esriFieldTypeDate, alias: LRS Date, editable: false, nullable: true, length: 8, defaultValue: null, modelName: LRSDate )
	 */
	LRSDate?: Date;
	/*
	 * InventoryDirection ( type: esriFieldTypeString, alias: Inventory Direction, editable: false, nullable: true, length: 1, defaultValue: null, modelName: InventoryDirection )
	 */
	InventoryDirection?: string;
	/*
	 * GlobalID ( type: esriFieldTypeGlobalID, alias: Global ID, editable: false, nullable: false, length: 38, defaultValue: null, modelName: GlobalID )
	 */
	GlobalID?: string;
}
/**
 * A Graphic that has an attributes property that implements the
 * {@link RouteFeatureAttributes} interface.
 */
export interface RouteFeature extends __esri.GraphicProperties {
	attributes: RouteFeatureAttributes;
	geometry: __esri.Polyline;
}

export interface RouteFeatureSet extends __esri.FeatureSetProperties {
	features: RouteFeature[];
}

/**
 * Returns true if the given object has all the properties of {@link RouteFeatureAttributes}.
 *
 * @param attributes An object to check
 * @returns True if the object has all the properties of {@link RouteFeatureAttributes}, false otherwise.
 */
export function isRouteAttributes(
	attributes: unknown,
): attributes is RouteFeatureAttributes {
	return (
		typeof attributes === "object" &&
		attributes != null &&
		Object.hasOwn(attributes, "RouteIdentifier") &&
		typeof (attributes as Record<string, unknown>).RouteIdentifier === "string"
	);
}

/**
 * Returns true if the given Graphic has all the properties of RouteFeatureAttributes.
 *
 * @param feature A Graphic to check
 * @returns True if the Graphic has all the properties of RouteFeatureAttributes, false otherwise.
 */
export function isRouteFeature(
	feature: __esri.GraphicProperties,
): feature is RouteFeature {
	return isRouteAttributes(feature.attributes);
}
