/**
 * Given a string in the format "YYYYMMDD", returns a Date object representing that date.
 * @param {string} yyyyMMDD A string in the format "YYYYMMDD"
 * @returns {Date} A Date object representing the given date
 */

export function parseDate(yyyyMMDD: string): Date {
	const parseIntParams = [
		[0, 4],
		[4, 5],
		[6, 8],
	] as const;

	const [year, month, day] = parseIntParams
		.map(([start, end]) => yyyyMMDD.substring(start, end))
		.map((part, i) => Number.parseInt(part) - (i === 1 ? 1 : 0));

	return new Date(year, month, day, 0, 0, 0);
}
