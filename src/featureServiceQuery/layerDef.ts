export interface ILayerDef<F extends string | string[] = string | string[]> {
	layerId: number;
	where: string;
	outFields?: F;
}

export enum LayerDefFormat {
	simple = "simple",
	simpleJson = "simpleJson",
	fullJson = "fullJson",
}

const layerDefsJsonReplacer = (key: string, value: unknown) => {
	if (value == null) {
		return;
	}
	if (key === "layerId" && typeof value === "number") {
		return value.toString(10);
	}
	if (key === "outFields" && Array.isArray(value)) {
		return value.join(",");
	}
	return value;
};

export class LayerDef implements ILayerDef<string[]> {
	public outFields?: string[];

	public get isSimple(): boolean {
		return !this.outFields || this.outFields.length === 0;
	}

	constructor(
		public layerId: number,
		public where: string,
		outFields?: string[] | string,
	) {
		if (typeof outFields === "string") {
			this.outFields = outFields.split(",");
		} else {
			this.outFields = outFields;
		}
	}

	/**
	 * Returns a string representation of the provided layer definitions.
	 *
	 * If all layer definitions are simple, the format is `layerId:where,layerId:where,layerId:where`.
	 * Otherwise, the format is a JSON array of layer definitions.
	 *
	 * @param layerDefs - The layer definitions to convert to a string.
	 * @returns A string representation of the layer definitions.
	 */
	public static multipleToString(...layerDefs: LayerDef[]) {
		const format = layerDefs.every((ld) => ld.isSimple)
			? LayerDefFormat.simple
			: LayerDefFormat.fullJson;
		if (format === LayerDefFormat.simple) {
			return layerDefs.map((ld) => `${ld.layerId}:${ld.where}`).join(",");
		}

		return JSON.stringify(layerDefs, layerDefsJsonReplacer);
	}
}

export default LayerDef;
