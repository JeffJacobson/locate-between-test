#!/usr/bin/env bun
import { describe, expect, test } from "bun:test";
import Graphic from "@arcgis/core/Graphic.js";
import Polyline from "@arcgis/core/geometry/Polyline";
import { getRouteSegments } from "../src/index";
import { Srmp } from "../src/mileposts/index.ts";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe("002 from 118 to 119 has a gap. Polyline should have two paths", () => {
	const routeId = "002";
	const beginSrmp = new Srmp(118, "A");
	const endSrmp = Srmp.fromTuple([119, "A"]);

	test("When direction is undefined, there should be two graphics returned", async () => {
		const direction = undefined; //"i";

		const segments = await getRouteSegments(undefined, {
			routeId,
			beginSrmp,
			endSrmp,
			direction,
		});

		expect(segments);

		expect(segments.length).toEqual(2);

		for (const segmentGraphic of segments) {
			const geometry = segmentGraphic.geometry as Polyline;
			expect(geometry).toBeInstanceOf(Polyline);
			expect(segmentGraphic).toBeInstanceOf(Graphic);
			expect(geometry.paths.length).toBe(2);
		}
	});

	test("When direction is specified, only one graphic should be returned", async () => {
		const direction = "i";

		const segments = await getRouteSegments(undefined, {
			routeId,
			beginSrmp,
			endSrmp,
			direction,
		});

		expect(segments.length).toEqual(1);

		const segmentGraphic = segments[0];

		const geometry = segmentGraphic.geometry as Polyline;
		expect(geometry).toBeInstanceOf(Polyline);
		expect(segmentGraphic).toBeInstanceOf(Graphic);
		expect(geometry.paths.length).toBe(2);
	});
});
