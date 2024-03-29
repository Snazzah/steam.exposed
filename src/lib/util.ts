import { browser } from '$app/environment';
import type { YearInReviewGameStats } from './types';

export function getLatestYear() {
	const currentYear = new Date().getFullYear();
	const nextDate = new Date(`December 15 ${currentYear}`);
	if (nextDate.valueOf() < Date.now()) return currentYear;
	return currentYear - 1;
}
export const MIN_YEAR = 2022;

export function clampYear(unparsedYear: string | number) {
	const year = typeof unparsedYear === 'string' ? parseInt(unparsedYear) : Math.round(unparsedYear);
	const LATEST_YEAR = getLatestYear();
	if (!year || isNaN(year) || !isFinite(year)) return LATEST_YEAR;
	return Math.max(MIN_YEAR, Math.min(year, LATEST_YEAR));
}

export const inviteUrlDictionary: Record<string, string> = {
	b: '0',
	c: '1',
	d: '2',
	f: '3',
	g: '4',
	h: '5',
	j: '6',
	k: '7',
	m: '8',
	n: '9',
	p: 'a',
	q: 'b',
	r: 'c',
	t: 'd',
	v: 'e',
	w: 'f'
};

export function inviteUrlToSteamID(inviteCode: string) {
	try {
		const accountId = BigInt(
			parseInt(
				inviteCode
					.split('')
					.map((c) => inviteUrlDictionary[c])
					.filter((c) => !!c)
					.join(''),
				16
			)
		);
		return (1n << 56n) | (1n << 52n) | (1n << 32n) | accountId;
	} catch (e) {
		return null;
	}
}

export function steamIdToInviteUrl(steamid: string) {
	try {
		const accountId = BigInt(steamid) & 0xffffffffn;

		// cursed.
		return accountId
			.toString(16)
			.split('')
			.map((c) => Object.entries(inviteUrlDictionary).find(([, h]) => h === c)?.[0] || '')
			.join('');
	} catch (e) {
		return null;
	}
}

export function relativeTime(rtf: Intl.RelativeTimeFormat, seconds: number) {
	if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
	if (Math.abs(seconds) <= 3600) return rtf.format(Math.round(seconds / 60), 'minute');
	if (Math.abs(seconds) <= 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
	if (Math.abs(seconds) <= 2592000) return rtf.format(Math.round(seconds / 86400), 'day');
	if (Math.abs(seconds) <= 31536000) return rtf.format(Math.round(seconds / 2592000), 'month');
	return rtf.format(Math.round(seconds / 31536000), 'year');
}

export function resolveToURL(input: string, year = getLatestYear()) {
	if (input.includes('://s.team/')) {
		const shareUrlMatch = input.match(
			/^\s*https?:\/\/s\.team\/y(\d{2})\/([bcdfghjkmnpqrtvw-]{4,9})/
		);
		if (shareUrlMatch)
			return `/u/${inviteUrlToSteamID(shareUrlMatch[2])}/${2000 + parseInt(shareUrlMatch[1])}`;

		const shortUrlMatch = input.match(/^\s*https?:\/\/s\.team\/p\/([bcdfghjkmnpqrtvw-]{4,9})/);
		if (shortUrlMatch) return `/u/${inviteUrlToSteamID(shortUrlMatch[1])}/${year}`;
	}

	if (input.includes('://store.steampowered.com/yearinreview/')) {
		const yearInReviewUrl = input.match(
			/^\s*https?:\/\/store\.steampowered\.com\/yearinreview\/([0-9]+)\/(20[0-9]{2})/
		);
		if (yearInReviewUrl) return `/u/${yearInReviewUrl[1]}/${yearInReviewUrl[2]}`;
	}

	if (input.includes('://steamcommunity.com/')) {
		const vanityUrl = input.match(/^\s*https?:\/\/steamcommunity\.com\/id\/([A-Za-z0-9_-]{2,32})/);
		if (vanityUrl) return `/id/${vanityUrl[1]}?year=${year}`;

		const profileUrl = input.match(/^\s*https?:\/\/steamcommunity\.com\/profiles\/([0-9]+)/);
		if (profileUrl) return `/u/${profileUrl[1]}/${year}`;

		const userUrl = input.match(
			/^\s*https?:\/\/steamcommunity\.com\/user\/([bcdfghjkmnpqrtvw-]{4,9})/
		);
		if (userUrl) return `/u/${inviteUrlToSteamID(userUrl[1])}/${year}`;
	}

	if (input.includes('://steamdb.info/calculator/')) {
		const steamDbMatch = input.match(/^\s*https?:\/\/steamdb\.info\/calculator\/([0-9]+)/);
		if (steamDbMatch) return `/u/${steamDbMatch[1]}/${year}`;
	}

	if (input.startsWith('https://steam.exposed/'))
		return input.slice('https://steam.exposed/'.length);

	if (input.startsWith('STEAM_1:')) {
		const steam2Match = input.match(/^STEAM_1:([01]):(\d+)$/);
		if (steam2Match) {
			const accountId = BigInt(parseInt(steam2Match[2], 10) * 2 + parseInt(steam2Match[1], 10));
			return `/u/${(1n << 56n) | (1n << 52n) | (1n << 32n) | accountId}/${year}`;
		}
	}

	if (input.startsWith('[U:1:')) {
		const steam3Match = input.match(/^\[U:1:(\d+)\]$/);
		if (steam3Match) {
			const accountId = BigInt(steam3Match[1]);
			return `/u/${(1n << 56n) | (1n << 52n) | (1n << 32n) | accountId}/${year}`;
		}
	}

	if (/^[0-9]+$/.test(input) && BigInt(input) >= 76561197962146232n) return `/u/${input}/${year}`;
	if (/^[A-Za-z0-9_-]{2,32}$/.test(input)) return `/id/${input}?year=${year}`;

	return null;
}

export function calculateBarGraph(data: { value: number }[], stepAmount = 4, percentStep = 20) {
	const topPercentage =
		Math.ceil((Math.max(...data.map((m) => m.value)) * 100) / percentStep) * percentStep;
	const ySteps = ' '
		.repeat(stepAmount)
		.split('')
		.map((_, i) => (topPercentage / stepAmount) * (i + 1))
		.reverse();

	return { topPercentage, ySteps };
}

interface AssetCacheItem {
	available: boolean;
	fetchedAt: number;
}

interface AssetCacheGame {
	portrait: AssetCacheItem | null;
	libraryCover: AssetCacheItem | null;
	libraryHero: AssetCacheItem | null;
}

const gameAssetCache: Record<string, AssetCacheGame> = {};
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;

export async function getGameAsset(appId: number, assetList: (keyof AssetCacheGame)[]) {
	if (!browser) throw new Error('Tried to use getGameAsset in server');
	const game =
		gameAssetCache[String(appId)] ||
		(gameAssetCache[String(appId)] = { portrait: null, libraryCover: null, libraryHero: null });
	const now = Date.now();

	const assetUrls: Record<string, string> = {
		portrait: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/portrait.png`,
		libraryCover: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
		libraryHero: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`
	};

	let selectedType: string | null = null;
	for (const assetType of assetList) {
		if (game[assetType] !== null && game[assetType]!.fetchedAt > now - CACHE_TTL) {
			if (game[assetType]?.available) {
				selectedType = assetType;
				break;
			}
			continue;
		}

		const available = await new Promise<boolean>((resolve) => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = assetUrls[assetType];
		});

		game[assetType] = { available, fetchedAt: Date.now() };

		if (available) {
			selectedType = assetType;
			break;
		}
		continue;
	}

	return selectedType ? assetUrls[selectedType] : null;
}

export function makePlaytimeFunction(stats: YearInReviewGameStats) {
	return (type: 'vr' | 'deck' | 'controller' | 'linux' | 'macos' | 'windows') => {
		const percent = stats[`${type}_playtime_percentagex100`] / stats.total_playtime_percentagex100;
		return stats.total_playtime_seconds * percent;
	};
}
