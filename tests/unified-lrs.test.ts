#!/usr/bin/env bun

/**
 * You must specify the .env.local file via the --env-file flag.
 * @example
 * bun test . --bail 1 --env-file .env.local
 */

import { expect, test, describe } from "bun:test";
import {
	getMilepostSegment,
	type GetMilepostSegmentOutput,
} from "../src/unified-lrs/index.ts";
import { Srmp } from "../src/mileposts";
import { env } from "bun";
import Polyline from "@arcgis/core/geometry/Polyline";
import { flattenPolylinePaths } from "./utils.ts";

env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const envVariableName = "LRS_AND_MP_SERVICE_URL";

describe("unified-lrs", () => {
	test("get milepost segment", async () => {
		const url = Bun.env.LRS_AND_MP_SERVICE_URL;
		if (!url) {
			throw new Error(`${envVariableName} is not defined`);
		}

		const milepostSegmentsResponse: GetMilepostSegmentOutput[] = [];

		let index = 0;
		for await (const mpSegmentResponse of getMilepostSegment({
			lrsFeatureServiceUrl: url,
			routeId: "005",
			beginSrmp: new Srmp(5, "A"),
			endSrmp: new Srmp(10),
			routeDirection: "i",
			outSR: 3857,
		})) {
			milepostSegmentsResponse.push(mpSegmentResponse);
			// console.group(`#${index}`);

			const { routeId, milepostGraphics, options, routeGraphic, routeSegment } =
				mpSegmentResponse;

			// console.log("routeId", routeId);
			// console.log("options", options);
			// console.log("route graphic attributes");
			// console.table(routeGraphic.attributes);

			const routeGraphicProperties = flattenPolylinePaths(
				routeGraphic.geometry as Polyline,
			);

			// console.table(routeGraphicProperties);

			// const milepostGraphicsData = milepostGraphics.map((g) => {
			// 	const { geometry, attributes } = g.toJSON() as Required<
			// 		Pick<__esri.GraphicProperties, "geometry" | "attributes">
			// 	>;
			// 	return Object.fromEntries([
			// 		...Object.entries(attributes),
			// 		...Object.entries(geometry),
			// 	]);
			// });
			// console.log("milepost graphics");
			// console.table(milepostGraphicsData);
			// console.log("routeSegment");
			expect(routeSegment).toBeInstanceOf(Polyline);
			// const flattenedPathCoords = flattenPolylinePaths(
			// 	routeSegment as Polyline,
			// );
			// console.table(flattenedPathCoords);

			// console.groupEnd();
			index++;
		}

		expect(milepostSegmentsResponse).toBeArrayOfSize(1);
	});
});
