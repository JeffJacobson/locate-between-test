import { Parcel } from "@parcel/core";

const bundler = new Parcel({
	entries: "a.js",
	defaultConfig: "@parcel/config-default",
});

try {
	const { bundleGraph, buildTime } = await bundler.run();
	const bundles = bundleGraph.getBundles();
	console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);
} catch (err) {
	if (typeof err === "object" && err != null && "diagnostics" in err) {
		console.log(err.diagnostics);
	}
}
