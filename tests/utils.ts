import type Polyline from "@arcgis/core/geometry/Polyline";
import { file } from "bun";

export async function readEnvFile() {
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
export function flattenPolylinePaths({
	paths,
}: Pick<__esri.Polyline, "paths">) {
	return paths.flatMap((path, pathId) =>
		path.flatMap(([x, y, m], pointId) => ({
			"path ID": pathId,
			"point ID": pointId,
			x,
			y,
			m,
		})),
	);
}
