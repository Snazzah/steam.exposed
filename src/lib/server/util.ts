import { MIN_YEAR, getLatestYear } from '$lib/util';

export const PROFILE_STALE_TIME = 86400000; // 1 day
export const GAME_ACH_STALE_TIME = 86400000 * 7; // 7 days
export const GAME_ACH_INCOMPLETE_STALE_TIME = 86400000; // 1 day
export const PLAYER_ACH_INCOMPLETE_STALE_TIME = 3600000; // 1 hour
export const YEAR_ACH_STALE_TIME = 3600000; // 1 hour
export const ACH_DATA_STALE_TIME = 3600000; // 1 hour
export const UNKNOWN_APPID_TIME = 86400000; // 1 day

export function parseYear(request: Request) {
	const LATEST_YEAR = getLatestYear();
	let year = LATEST_YEAR;

	if (request.url.includes('?year=20')) {
		const url = new URL(request.url);
		const setYear = url.searchParams.get('year');
		if (setYear && /^20[0-9]{2}$/.test(setYear)) {
			const parsedYear = parseInt(setYear);
			if (parsedYear >= MIN_YEAR && parsedYear <= LATEST_YEAR) year = parsedYear;
		}
	}

	return year;
}

export function requestIsBot(userAgent: string | null) {
	return !userAgent ||
		/bot|chatgpt|facebookexternalhit|WhatsApp|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|MetaInspector/i.test(
			userAgent
		);
}
