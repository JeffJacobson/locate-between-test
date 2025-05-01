import {
	getMilepostMinMax,
	MinMaxRange,
} from "../src/mileposts/getMilepostMinMax.ts";
import { describe, expect, test } from "bun:test";

describe("getMilepostMinMax", () => {
	test("getMilepostMinMax", async () => {
		const minMaxes = await getMilepostMinMax("002");
		expect(minMaxes).toBeInstanceOf(MinMaxRange);
		expect(minMaxes).toHaveProperty("routeId", "002");
		// Test the increase and decrease properties
		for (const pName of ["increase", "decrease"] as const) {
			expect(minMaxes).toHaveProperty(pName);
			const minMax = minMaxes[pName];
			// Test the ahead and back properties of the current min/max tuple.
			if (minMax) {
				for (const ab of ["ahead", "back"] as const) {
					expect(minMax).toHaveProperty(ab);
					if (minMax[ab]) {
						expect(minMax[ab]).toBeArrayOfSize(2);
					}
				}
			}
		}
	});
});
