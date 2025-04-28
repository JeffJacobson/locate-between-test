/**
 * Updates the CDN references in the HTML to match what is in packages.json.
 * @example
 * node --experimental-transform-types  .\tools\upgrade-cdn-refs.ts
 * @example
 * bun .\tools\upgrade-cdn-refs.ts
 */

import { JSDOM } from "jsdom";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import packageJson from "../package.json" assert { type: "json" };
import { parse, parseRange } from "semver-utils";
import { stderr } from "node:process";

const defaultHtmlPath = join(import.meta.dirname, "..", "index.html");

/**
 * Updates the CDN references in the given HTML file to match what is in packages.json.
 * @param htmlPath The path to the HTML file. Defaults to the path of the current file.
 * @returns A promise that resolves when the HTML file has been updated.
 */
async function updateHtml(htmlPath = defaultHtmlPath) {
	async function generateSriHash(
		url: string,
		algorithm: Parameters<typeof createHash>[0] = "sha512",
	): Promise<string> {
		stderr.write(`\nGenerating SRI hash for ${url}...\n`);
		const contentResponse = await fetch(url);
		const buffer = await contentResponse.bytes();
		const hash = createHash(algorithm);
		hash.update(buffer);
		const integrity = hash.digest("base64");
		const sriHash = `${algorithm}-${integrity}`;
		stderr.write(`SRI hash for ${url}: ${sriHash}\n`);
		return sriHash;
	}

	// Get the @arcgis/core version number, then conver to a major.minor string.
	const coreVersion = parseRange(packageJson.dependencies["@arcgis/core"]).at(
		0,
	);
	const coreVersionString = coreVersion
		? `${coreVersion.major}.${coreVersion.minor}`
		: "";

	// Get the @esri/calcite-components version number, then conver to a major.minor.patch string.
	const calciteVersion = parse(
		packageJson.dependencies["@esri/calcite-components"],
	);
	const calciteVersionString = calciteVersion
		? `${calciteVersion.major}.${calciteVersion.minor}.${calciteVersion.patch}`
		: "";

	// console.table({ ArcGIS: coreVersion, Calcite: calciteVersion });

	/**
	 * Regular expression that will match the version number of the calcite-components CDN URL.
	 */
	const calciteJsUrlRe =
		/(?<=^https:\/\/js.arcgis.com\/calcite-components\/)[\d\.]+(?=\/calcite.esm.js)/i;
	/**
	 * Regular expression that will match the version number of the CDN URLs for @arcgis/core and @arcgis/map-components.
	 */
	const arcgisSdkUrlRe =
		/(?<=^https:\/\/js.arcgis.com\/(?:map-components\/)?)[\d\.]+\b/i;

	/**
	 * Reads the specified HTML file and creates a JSDOM instance from its contents.
	 * @returns A promise that resolves to a JSDOM instance representing the HTML document.
	 */
	async function getJsDom() {
		stderr.write(`\nReading ${htmlPath}...\n`);
		const textBuffer = await readFile(htmlPath);
		const jsdom = new JSDOM(textBuffer);
		return jsdom;
	}

	const jsDom = await getJsDom();
	const head = jsDom.window.document.head;

	const links = head.querySelectorAll<HTMLLinkElement | HTMLScriptElement>(
		"link[rel=stylesheet],script[src]",
	);

	async function updateElementUrlVersion<
		T extends HTMLLinkElement | HTMLScriptElement =
			| HTMLLinkElement
			| HTMLScriptElement,
	>(
		element: T,
	): Promise<{
		element: T;
		oldUrl: string;
		newUrl: string;
		sriHash: string;
	} | null> {
		// Get the name of the attribute of the element that contains the URL.
		const tagName = element.tagName.toUpperCase();
		const urlAttributeName =
			tagName === "SCRIPT" ? "src" : tagName === "LINK" ? "href" : null;
		// Exit if the element is not one of the expected types.
		if (!urlAttributeName) {
			return null;
		}
		// Get the URL from the element.
		const url = element.getAttribute(urlAttributeName);
		// Exit if the URL couldn't be found.
		if (!url) {
			return null;
		}

		stderr.write(`\n${tagName}[${urlAttributeName}]="${url}"]\n`);

		// Update the URL with the new version number.
		const newUrl = calciteJsUrlRe.test(url)
			? url.replace(calciteJsUrlRe, calciteVersionString)
			: arcgisSdkUrlRe.test(url)
				? url.replace(arcgisSdkUrlRe, coreVersionString)
				: null;

		// Exit if the URL couldn't be updated.
		if (!newUrl) {
			return null;
		}
		stderr.write(`\nChanging URL to "${newUrl}" from "${url}"\n`);

		const sriHash = await generateSriHash(newUrl);

		stderr.write(`SRI hash of ${newUrl}: ${sriHash}\n`);

		element.setAttribute(urlAttributeName, newUrl);
		element.setAttribute("integrity", sriHash);
		element.crossOrigin = "anonymous";

		stderr.write(element.outerHTML);

		return { element, oldUrl: url, newUrl, sriHash };
	}

	const updateElementPromises = [...links].map(updateElementUrlVersion);
	const updatedElements = (await Promise.all(updateElementPromises)).filter(
		(e) => e != null,
	);

	if (updatedElements.length) {
		const outputHtml = jsDom.serialize();
		await writeFile(htmlPath, outputHtml);
	} else {
		console.error("Could not locate any elements to update.");
	}
}

await updateHtml();
