export const hasErrorProperty = (
	o: unknown
): o is { error: Record<string, unknown> } => {
	return typeof o === "object" && o != null && "error" in o;
};
