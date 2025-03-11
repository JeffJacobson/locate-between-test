import { executeQueryJSON } from "@arcgis/core/rest/query.js";
import Query from "@arcgis/core/rest/support/Query.js";
import type { LrsDirection } from "../lrs.ts";

/**
 * The default URL of the State Route Mile Post (SRMP) service.
 */
export const defaultMilepostsServiceUrl = new URL(
	"https://data.wsdot.wa.gov/arcgis/rest/services/Shared/AllStateRoutePoints/MapServer/0/",
);

/**
 * The URL of the SRMP service with the query operation.
 */
export const milepostsServiceQueryUrl = new URL(
	"query",
	defaultMilepostsServiceUrl,
);

/**
 * The possible values for the AheadBackInd field in the SRMP service.
 * "A" for ahead, "B" for back.
 */
export type AheadBackIndicator = "A" | "B";

/**
 * The possible values for the Direction field in the SRMP service.
 * "i" for inbound, "d" for outbound, "u" for unknown, or "b" for both.
 */
export type Direction = LrsDirection | "u" | "b";

/**
 * A tuple representing the SRMP value and its direction.
 * The first element is the SRMP value, the second element is the direction.
 */
export type SrmpTuple = [srmp: number, ab: AheadBackIndicator];

/**
 * Interface that represents a State Route Mile Post (SRMP) value.
 * Can be either a regular (ahead) milepost or a back milepost.
 */
export interface ISrmp {
	/**
	 * The SRMP value.
	 */
	milepost: number;
	/**
	 * True if the milepost is a back milepost.
	 */
	isBack: boolean;
}

export function isBack(backIndicator: unknown): boolean {
	return typeof backIndicator === "boolean"
		? backIndicator
		: typeof backIndicator === "string" && /B/i.test(backIndicator);
}

export function parseSrmpTuple(srmpAsString: string) {
	/**
	 * Matches an SRMP + AB Indicator string.
	 *
	 * Groups:
	 *
	 * 0. `mp`: Milepost
	 * 1. `ab`: Ahead or Back indicator. Valid values
	 *
	 *     value       | meaning
	 *     :----------:|:-----------------------
	 *     `"B"`       | indicates back mileage
	 *     `"A"`       | indicates ahead mileage
	 *     `undefined` | 〃 |
	 */
	const re = /(?<mp>\d+(?:.\d+)?)(?<ab>[AB])?/;
	const match = re.exec(srmpAsString);
	if (!match?.groups) {
		throw Error(
			`"${srmpAsString}" does not match expected format: /${re.toString()}/`,
		);
	}
	const { mp: mpString, ab: abString } = match.groups;
	const milepost = Number.parseFloat(mpString);
	return [milepost, abString.toUpperCase() === "B"] as [
		milepost: number,
		isBack: boolean,
	];
}

/**
 * A State Route Mile Post (SRMP) value.
 * Can be either a regular (ahead) milepost or a back milepost.
 */
export class Srmp implements ISrmp {
	public milepost: number;
	/**
	 * True if the milepost is a back milepost.
	 */
	public isBack: boolean;

	/**
	 * Gets the ahead or back indicator for the SRMP.
	 * @returns "B" if the milepost is a back milepost, otherwise "A".
	 */
	public get aheadOrBackIndicator() {
		return this.isBack ? ("B" as const) : ("A" as const);
	}

	/**
	 * Gets the back indicator or an empty string.
	 * @returns "B" if the milepost is a back milepost, otherwise an empty string.
	 */
	public get backIndicatorOrEmpty(): "B" | "" {
		return this.isBack ? ("B" as const) : ("" as const);
	}

	/**
	 * Gets the SRMP as a tuple.
	 * @returns A tuple containing the SRMP value and its direction indicator.
	 */
	public get tuple(): SrmpTuple {
		return [this.milepost, this.aheadOrBackIndicator];
	}

	/**
	 * Creates an Srmp instance from an SrmpTuple.
	 * @param tuple - A tuple containing the SRMP value and its direction indicator.
	 * @returns A new Srmp instance.
	 */
	public static fromTuple([srmp, ab]: SrmpTuple): Srmp {
		return new Srmp(srmp, ab);
	}

	/**
	 * Converts an ISrmp instance to an SrmpTuple.
	 * @param srmp - An ISrmp instance.
	 * @returns A tuple containing the SRMP value and its direction indicator.
	 */
	public static toTuple(srmp: ISrmp): SrmpTuple {
		return [srmp.milepost, srmp.isBack ? "B" : "A"];
	}

	constructor(
		/**
		 * The milepost as either a number or a string.
		 */
		srmp: string | number,
	);
	constructor(
		/** The milepost value. */
		srmp: number,
		/** Indicates if the SRMP is back mileage. */
		backIndicator: boolean | string,
	);
	/**
	 * Creates a new SRMP value.
	 */
	constructor(
		// /** The milepost value. */
		// public srmp: number,
		// /** Indicates if the SRMP is back mileage. */
		// backIndicator: boolean | string,
		...args: [number, boolean | string] | [ISrmp | string | number]
	) {
		if (args.length === 1) {
			const [srmpInput] = args;
			if (typeof srmpInput === "string") {
				const [milepost, isBack] = parseSrmpTuple(srmpInput);
				this.milepost = milepost;
				this.isBack = isBack;
			} else if (typeof srmpInput === "number") {
				this.milepost = srmpInput;
				this.isBack = false;
			} else {
				const { milepost, isBack } = srmpInput;
				this.milepost = milepost;
				this.isBack = isBack;
			}
		} else if (args.length === 2) {
			const [srmp, ab] = args;
			this.milepost = srmp;
			this.isBack = isBack(ab);
		} else {
			throw new TypeError(
				`Improper arguments to constructor: ${JSON.stringify(args)}`,
				{
					cause: {
						constructor: Srmp,
						args,
					},
				},
			);
		}
	}

	/**
	 * Returns a string representation of the SRMP.
	 * If the SRMP is a back milepost, it is suffixed with "B".
	 * @returns A string in the format `${number}` or `${number}B`
	 */
	public toString() {
		return this.isBack
			? (`${this.milepost}B` as const)
			: (`${this.milepost}` as const);
	}
}

/**
 * Checks if the given string is a valid {@link AheadBackIndicator}.
 *
 * @param str - The string to check.
 * @returns True if the string is "A" or "B", which are valid values for AheadBackIndicator, false otherwise.
 */

export function isAheadBackIndicator(str: string): str is AheadBackIndicator {
	return ["A", "B"].includes(str);
}

export interface MilepostAttributes {
	/**
	 * The object ID of the feature.
	 */
	OBJECTID: number;

	/**
	 * The route ID of the feature.
	 */
	RouteID: string;

	/**
	 * The accumulated route mileage of the feature.
	 */
	ARM: number;

	/**
	 * The state route mile post of the feature.
	 */
	SRMP: number;

	/**
	 * The ahead or back indicator of the feature.
	 * @see {@link AheadBackIndicator}
	 */
	AheadBackInd: AheadBackIndicator;

	/**
	 * The direction of the feature.
	 * @see {@link Direction}
	 */
	Direction: Direction;

	/**
	 * The easting of the feature.
	 */
	Easting: number;

	/**
	 * The northing of the feature.
	 */
	Northing: number;

	/**
	 * The longitude of the feature.
	 */
	Longitude: number;

	/**
	 * The latitude of the feature.
	 */
	Latitude: number;

	/**
	 * The azimuth of the feature.
	 */
	Azimuth: number;

	/**
	 * The state route number of the feature.
	 */
	StateRouteNumber: string;

	/**
	 * The relative route type of the feature.
	 */
	RelRouteType: string;

	/**
	 * The relative route qualifier of the feature.
	 */
	RelRouteQual: string;

	/**
	 * The LRS date of the feature in the format "yyyymmdd".
	 */
	LRS_Date: `${number}${number}${number}`;
}

/**
 * A feature that has an attributes property that is a MilepostAttributes object.
 */
export type MilepostFeature = Omit<__esri.Graphic, "attributes"> & {
	/**
	 * The attributes of the feature.
	 */
	attributes: MilepostAttributes;
};

/**
 * Returns true if the given object has all the properties of MilepostAttributes.
 *
 * @param attributes An object to check
 * @returns True if the object has all the properties of MilepostAttributes, false otherwise.
 */
export function isMilepostAttributes(
	attributes: unknown,
): attributes is MilepostAttributes {
	return (
		typeof attributes === "object" &&
		attributes != null &&
		(["SRMP", "AheadBackInd", "RouteID"] as const).every(
			(key) =>
				Object.hasOwn(attributes, key) &&
				(attributes as Record<string, unknown>)[key] != null,
		)
	);
}

/**
 * The name of a field in a {@link MilepostAttributes} object.
 */
export type MilepostFieldName = keyof MilepostAttributes;

/**
 * Parameters to query milepost features.
 */
export interface MilepostQueryParams {
	/**
	 * The route ID of the mileposts to query.
	 */
	routeId: string;
	/**
	 * The starting SRMP of the mileposts to query.
	 */
	beginSrmp: ISrmp;
	/**
	 * The ending SRMP of the mileposts to query.
	 */
	endSrmp: ISrmp;
	/**
	 * The direction of the route to query.
	 * @see {@link Direction}
	 */
	direction?: Direction;
	/**
	 * The spatial reference to use for the output features.
	 * @see {@link __esri.SpatialReferenceProperties}
	 */
	outSpatialReference?: __esri.SpatialReferenceProperties;
}

export interface RouteSegementQueryParams extends MilepostQueryParams {
	lrsFeatureServerUrl: string | URL;
}

export interface MilepostFeatureSet
	extends Omit<__esri.FeatureSet, "features"> {
	features: MilepostFeature[];
}

export async function queryMilepostFeatures(
	params: MilepostQueryParams,
): Promise<MilepostFeatureSet> {
	const { routeId, beginSrmp, endSrmp, direction, outSpatialReference } =
		params;
	const [beginMP, beginAheadBackInd] = Srmp.toTuple(beginSrmp);
	const [endMP, endAheadBackInd] = Srmp.toTuple(endSrmp);

	const parts = [
		`RouteID = '${routeId}'`,
		`((SRMP = ${beginMP} AND AheadBackInd = '${beginAheadBackInd}') OR (SRMP = ${endMP} AND AheadBackInd = '${endAheadBackInd}'))`,
	];

	if (direction) {
		parts.push(`Direction = '${direction}'`);
	}
	const where = parts.join(" AND ");

	const outFields = [
		"RouteID",
		"Direction",
		"SRMP",
		"AheadBackInd",
		"ARM",
		"Azimuth",
		"LRS_Date",
		"Longitude",
		"Latitude",
		"Northing",
		"Easting",
	] as MilepostFieldName[];
	const orderByFields = [
		"RouteID ASC",
		"Direction DESC",
		"ARM ASC",
	] as `${MilepostFieldName} ${"ASC" | "DESC"}`[];
	const query = new Query({
		outSpatialReference,
		where: where,
		outFields: outFields,
		orderByFields: orderByFields,
		returnGeometry: true,
	});
	const results = (await executeQueryJSON(
		milepostsServiceQueryUrl.toString(),
		query,
	)) as MilepostFeatureSet;
	return results;
}
