#!/usr/bin/env bun
import { expect, test, describe } from "bun:test";
import {
	getMilepostSegment,
	type GetMilepostSegmentOutput,
} from "../src/unified-lrs/index.ts";
import { Srmp } from "../src/mileposts";
import { env, file } from "bun";
import Polyline from "@arcgis/core/geometry/Polyline";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const envVariableName = "LRS_AND_MP_SERVICE_URL";

async function readEnvFile() {
	const f = file(".env.local");
	let content: string | undefined;
	try {
		content = await f.text();
	} catch (e) {
		throw new Error(`Error reading .env.local file: ${e}`);
	}
	const mapping = new Map(
		content
			.split("\n")
			.map((l) => l.split("=").map((s) => s.trim()) as [string, string]),
	);

	return mapping;
}

/**
 * Given a Polyline, returns a flat array of objects with the following properties:
 * - "path ID": the index of the path in the polyline
 * - "point ID": the index of the point in the path
 * - x: the x-coordinate of the point
 * - y: the y-coordinate of the point
 * - m: the measure of the point
 *
 * @param polyline.paths
 * @returns A flat array of properties
 */
const flattenPolylinePaths = ({ paths }: Polyline) =>
	paths.flatMap((path, pathId) =>
		path.flatMap(([x, y, m], pointId) => ({
			"path ID": pathId,
			"point ID": pointId,
			x,
			y,
			m,
		})),
	);

describe("unified-lrs", () => {
	test("get milepost segment", async () => {
		let url = Bun.env.LRS_AND_MP_SERVICE_URL;
		if (!url) {
			const envVars = await readEnvFile();
			url = envVars.get(envVariableName);
		}
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
			console.group(`#${index}`);

			const { routeId, milepostGraphics, options, routeGraphic, routeSegment } =
				mpSegmentResponse;

			console.log("routeId", routeId);
			console.log("options", options);
			console.log("route graphic attributes");
			console.table(routeGraphic.attributes);

			const routeGraphicProperties = flattenPolylinePaths(
				routeGraphic.geometry as Polyline,
			);

			const sr = SpatialReference.WebMercator;

			console.table(routeGraphicProperties);

			const milepostGraphicsData = milepostGraphics.map((g) => {
				const { geometry, attributes } = g.toJSON() as Required<
					Pick<__esri.GraphicProperties, "geometry" | "attributes">
				>;
				return Object.fromEntries([
					...Object.entries(attributes),
					...Object.entries(geometry),
				]);
			});
			console.log("milepost graphics");
			console.table(milepostGraphicsData);
			console.log("routeSegment");
			const { paths, ...andTheRest } =
				routeSegment.toJSON() as Required<__esri.PolylineProperties>;
			expect(routeSegment).toBeInstanceOf(Polyline);
			const flattenedPathCoords = flattenPolylinePaths(
				routeSegment as Polyline,
			);
			console.table(flattenedPathCoords);

			console.groupEnd();
			index++;
		}

		expect(milepostSegmentsResponse).toBeArrayOfSize(1);
	});
});
