#!/usr/bin/env bun
import { describe, expect, test } from "bun:test";
import { env } from "bun";
import { getBackMileposts } from "../src/mileposts/getBackMileage.ts";
import { BadUrlError } from "../src/url.ts";

env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/**
 * Performs common tests on the result of getBackMileposts.
 * @param mileposts - The result of getBackMileposts.
 */
const commonTests = (mileposts: Map<string, number[]>) => {
	expect(mileposts).toBeInstanceOf(Map);
	expect(mileposts.size).toBeGreaterThan(0);
	for (const [routeId, srmps] of mileposts) {
		expect(routeId).toBeTypeOf("string");
		expect(srmps).not.toBeArrayOfSize(0);
	}
};

describe("getBackMileposts", () => {
	test("bad query url should fail", async () => {
		expect(() => getBackMileposts("https://example.com")).toThrow(BadUrlError);
	});
	test("Get back mileage omitting optional parameters", async () => {
		const mileposts = await getBackMileposts();
		commonTests(mileposts);
	});
	test("Get back mileage, specifying direction", async () => {
		const mileposts = await getBackMileposts(undefined, "i");
		commonTests(mileposts);
	});
});
