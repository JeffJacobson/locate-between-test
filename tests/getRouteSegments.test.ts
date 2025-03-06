#!/usr/bin/env bun
import { describe, expect, test } from "bun:test";
import Graphic from "@arcgis/core/Graphic.js";
import Polyline from "@arcgis/core/geometry/Polyline";
import { env, file } from "bun";
import { getRouteSegments } from "../src/index";
import { Srmp } from "../src/mileposts/index.ts";

env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const lrsUrlEnvVariableName = "DEFAULT_LRS_LAYER_URL";

let lrsFeatureServerUrl = env[lrsUrlEnvVariableName];

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

if (!lrsFeatureServerUrl) {
	// Try to read from .env file if variable not already defined.
	const envVars = await readEnvFile();
	lrsFeatureServerUrl = envVars.get(lrsUrlEnvVariableName);
	if (!lrsFeatureServerUrl) {
		throw new Error(
			`Missing environment variable: ${lrsUrlEnvVariableName}. Please set an environment variable named ${lrsUrlEnvVariableName} either via your OS or within an .env.local file.`,
		);
	}
}

describe("002 from 118 to 119 has a gap. Polyline should have two paths", () => {
	const routeId = "002";
	const beginSrmp = new Srmp(118, "A");
	const endSrmp = Srmp.fromTuple([119, "A"]);

	test("When direction is undefined, there should be two graphics returned", async () => {
		const direction = undefined; //"i";

		const segments = await getRouteSegments(lrsFeatureServerUrl, {
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

		const segments = await getRouteSegments(lrsFeatureServerUrl, {
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
