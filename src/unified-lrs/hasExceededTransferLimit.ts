function hasExceededTransferLimit(
	responseData: unknown,
): responseData is Record<string, unknown> & { exceededTransferLimit: true } {
	if (responseData == null || typeof responseData !== "object") {
		throw new TypeError("Expected response data to be an object.");
	}
	return (
		Object.hasOwn(responseData, "exceededTransferLimit") &&
		(responseData as { exceededTransferLimit: boolean })
			.exceededTransferLimit === true
	);
}
