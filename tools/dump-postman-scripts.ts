/**
 * Reads from the Mileposts Services.postman_collection.json file
 * and dumps the JavaScript code contained within into *.js files.
 * These output files will be in the dumped-postman-scripts folder.
 */

import { write } from "bun";
import {
	variable as collectionVariables,
	// event,
	// info,
	item as items,
} from "../Mileposts Service.postman_collection.json";

import { mkdir } from "node:fs/promises";
import { dirname, join as joinPath } from "node:path";
import sanitize from "sanitize-filename";

console.log("Collection Variables\n--------------------");

console.table(collectionVariables);

/**
 * A {@link Map} of parameter names to corresponding values.
 */
const collectionVariablesMap = new Map(
	collectionVariables.map(({ key, value }) => [key, value]),
);

console.table(collectionVariablesMap);

/**
 * Replaces problematic characters in the file name with safe alternatives.
 * @param substring - The substring of the file name to replace.
 * @returns The replacement string.
 */
function replacer(substring: string): string {
	if (substring === "/") {
		return "⁄";
	}
	if (substring === "\\") {
		return "﹨";
	}
	return "_";
}

const outFolder = dirname(import.meta.dir);
const outPath = joinPath(outFolder, "dumped-postman-scripts");
await mkdir(outPath, {
	recursive: true,
});

const promises: Promise<[bytesWritten: number, path: string]>[] = [];

for (const {
	name,
	event,
	// item,
	// protocolProfileBehavior,
	request,
	response,
} of items) {
	console.log("name", name);
	// console.log(protocolProfileBehavior);
	// console.log(request);
	// console.log(response);
	const url = request?.url;

	if (url) {
		console.group(`url: ${url}`);
		let { raw, host, query } = url;
		query = query?.filter(
			(q) =>
				!Object.hasOwn(q, "disabled") ||
				!(q as unknown as Record<"disabled", boolean>).disabled,
		);
		console.log("raw", raw);
		console.log("host", host);
		console.table(query);
		console.groupEnd();
	}

	if (event) {
		for (const { listen, script } of event) {
			const {
				exec,
				// packages,
				type,
			} = script;
			if (exec.length === 0) {
				console.debug(`Skipping empty script: ${name}/${listen}`);
				continue;
			}
			const scriptContent = exec
				.map(
					// Trim whitespace from the end of each line.
					(e) => e.replace(/\s+$/, ""),
					// Join the lines into a single string.
				)
				.join("\n");

			if (!scriptContent) {
				continue;
			}
			console.log("type", type);
			console.log("listen", listen);
			console.log("scriptContent", `\`\`\`javascript\n${scriptContent}\`\`\``);

			const [newFolderName, newFileName] = [name, listen].map((s, i) =>
				sanitize(i === 1 ? `${s}.js` : s, {
					replacement: replacer,
				}),
			);

			// Create the output foder if it does not already exist.
			await mkdir(joinPath(outPath, newFolderName), {
				recursive: true,
			});

			const outFilePath = joinPath(outPath, newFolderName, newFileName);

			console.log(`Writing to ${outFilePath}`);
			const writePromise = write(outFilePath, scriptContent, {
				createPath: true,
			}).then((byteCount) => [byteCount, outFilePath] as [number, string]);
			writePromise.then(([bytesWritten, path]) => {
				console.log(`Wrote ${bytesWritten} bytes to ${path}`);
			});
			promises.push(writePromise);
		}
	}

	const promiseResults = await Promise.all(promises);

	console.table(promiseResults);
}
