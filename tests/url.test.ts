import { describe, expect, test } from "bun:test";
import { env } from "bun";
import { parseUrl } from "../src/url.ts";

function testUrl(url: string) {
	const urlParts = parseUrl(url);
	const { folder, serviceName, serviceType, layerId } = urlParts;
	if (folder) {
		expect(folder).toBeTypeOf("string");
	} else {
		expect(folder).toBeUndefined();
	}
	expect(serviceName).toBeTypeOf("string");
	expect(serviceType).toBeTypeOf("string");

	if (typeof layerId === "number") {
		expect(layerId).toBeTypeOf("number");
	} else {
		expect(layerId).toBeUndefined();
	}
	return urlParts;
}

describe("parseUrl", () => {
	test("parseUrl", () => {
		const rootUrl = "https://data.wsdot.wa.gov/arcgis/rest/services";
		const layerId = 0;
		const folderName = "Shared";
		const serviceWithFolderUrl = `${rootUrl}/${folderName}/AllStateRoutePoints/MapServer`;
		const serviceWithoutFolderUrl = `${rootUrl}/AllStateRoutePoints/MapServer`;
		const layerUrlWithFolder = `${rootUrl}/${folderName}/AllStateRoutePoints/MapServer/${layerId}`;
		const layerUrlWithoutFolder = `${rootUrl}/AllStateRoutePoints/MapServer/${layerId}`;

		const withExtensions = (
			[
				serviceWithFolderUrl,
				layerUrlWithFolder,
				serviceWithoutFolderUrl,
				layerUrlWithoutFolder,
			] as const
		).map((url) => `${url}/query` as const);

		// const parts: Record<string, ReturnType<typeof testUrl>> = {};

		for (const url of [
			serviceWithFolderUrl,
			serviceWithoutFolderUrl,
			layerUrlWithFolder,
			layerUrlWithoutFolder,
			...withExtensions,
		]) {
			/* const urlParts = */ testUrl(url);
			// parts[url] = urlParts;
		}

		// console.table(
		// 	Object.entries(parts).map(([url, parts]) => ({ ...parts, url })),
		// );
	});
});
