import { browser } from '$app/environment';
import type { IconifyIcon } from '@iconify/svelte';
import type { AchievementData, YearInReviewGameStats } from './types';

export function getLatestYear() {
	const currentYear = new Date().getFullYear();
	const nextDate = new Date(`December 20 ${currentYear}`);
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
	logo: AssetCacheItem | null;
}

const gameAssetCache: Record<string, AssetCacheGame> = {};
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;

export async function getGameAsset(appId: number, assetList: (keyof AssetCacheGame)[]) {
	if (!browser) throw new Error('Tried to use getGameAsset in server');
	const game =
		gameAssetCache[String(appId)] ||
		(gameAssetCache[String(appId)] = {
			portrait: null,
			libraryCover: null,
			libraryHero: null,
			logo: null
		});
	const now = Date.now();

	const assetUrls: Record<string, string> = {
		portrait: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/portrait.png`,
		libraryCover: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
		libraryHero: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
		logo: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/logo.png`
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

export const loadingIcon: IconifyIcon = {
	width: 24,
	height: 24,
	body: '<defs><linearGradient id="mingcuteLoadingFill0" x1="50%" x2="50%" y1="5.271%" y2="91.793%"><stop offset="0%" stop-color="currentColor"/><stop offset="100%" stop-color="currentColor" stop-opacity=".55"/></linearGradient><linearGradient id="mingcuteLoadingFill1" x1="50%" x2="50%" y1="15.24%" y2="87.15%"><stop offset="0%" stop-color="currentColor" stop-opacity="0"/><stop offset="100%" stop-color="currentColor" stop-opacity=".55"/></linearGradient></defs><g fill="none"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="url(#mingcuteLoadingFill0)" d="M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.502 7.502 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021" transform="translate(1.5 1.625)"/><path fill="url(#mingcuteLoadingFill1)" d="M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.475 10.475 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084a1.5 1.5 0 0 1-.115-2.118" transform="translate(1.5 1.625)"/></g>'
};

export const perfectGameIcon: IconifyIcon = {
	width: 36,
	height: 36,
	body: '<path stroke="url(#svgid_12)" fill="url(#svgid_13)" d="M10.1777 10.0258L10.3929 9.80693V9.49999V5.52777H14.2857H14.6001L14.8205 5.30358L18 2.06976L21.1795 5.30358L21.3999 5.52777H21.7143H25.6071V9.50001V9.80696L25.8223 10.0258L28.5553 12.8055L25.8223 15.5853L25.6071 15.8041V16.1111V20.0833H21.7143H21.3999L21.1795 20.3075L18 23.5413L14.8205 20.3075L14.6001 20.0833H14.2857H10.3929V16.1111V15.8042L10.1777 15.5853L7.44464 12.8055L10.1777 10.0258ZM14.7399 28.0317L11.56 33.4221L9.85164 29.9469L9.6456 29.5278H9.17857H6.29474L8.68445 25.3611H12.1142L14.7399 28.0317ZM26.8214 29.5278H26.3544L26.1484 29.9469L24.44 33.4221L21.2601 28.0317L23.8858 25.3611H27.3155L29.7053 29.5278H26.8214Z" stroke-width="1.5"></path><circle stroke="#FFAB2C" fill="#FFC82C" cx="18" cy="13" r="5.5"></circle><defs><linearGradient id="svgid_13" x1="7.08" y1="3.72" x2="33.6694" y2="25.0697" gradientUnits="userSpaceOnUse"><stop stop-color="#0056D6"></stop><stop offset="1" stop-color="#1A9FFF"></stop></linearGradient><linearGradient id="svgid_12" x1="7.08" y1="3.72" x2="33.6694" y2="25.0697" gradientUnits="userSpaceOnUse"><stop stop-color="#0056D6"></stop><stop offset="1" stop-color="#1A9FFF"></stop></linearGradient></defs>'
};

export function getCalendarRange(startDate: Date, endDate: Date) {
	const startDayOfMonth = startDate.getDate();
	const totalDays = Math.floor((endDate.valueOf() - startDate.valueOf()) / 86400000) + 1; // 86400000 = 1000 * 60 * 60 * 24

	return new Array(totalDays).fill('').map((_, offset) => {
		const date = new Date(startDate);
		date.setDate(startDayOfMonth + offset);
		return date;
	});
}

export function plural(n: number, w: string) {
	return `${n.toLocaleString()} ${w}${n === 1 ? '' : 's'}`;
}

export function showLowestFixed(n: number) {
	return n.toFixed(n < 1 ? (n < 0.1 ? (n < 0.01 ? 3 : 2) : 1) : 0);
}

// These elaborate checks are to filter out removed achievements from counts
export function calcAchievements(
	achievements: AchievementData,
	appid: number,
	earnedAchs: { id: string; unlocked: number }[]
) {
	if (earnedAchs.length === 0)
		return {
			achTotal: 0,
			achEarned: 0,
			achEarnedBefore: 0,
			earnedPercent: 0,
			completed: false
		};

	const achTotal = achievements.games[appid]?.filter((ach) => !ach.removedAt)?.length ?? 0;
	const achEarned = earnedAchs.filter(
		(ach) => !!achievements.games[appid]?.find((a) => a.id === ach.id && !a.removedAt)
	).length;
	const achEarnedBefore = Object.keys(achievements.unlocked[appid] ?? {}).filter((achid) => {
		const unlocked = achievements.unlocked[appid]?.[achid] ?? 0;
		const notRemoved = !!achievements.games[appid]?.find((a) => a.id === achid && !a.removedAt);
		return (
			unlocked !== 0 && achievements.games[appid] && notRemoved && earnedAchs[0].unlocked > unlocked
		);
	}).length;
	const earnedPercent = achTotal > 0 ? (achEarned / achTotal) * 100 : 0;
	const completed = achEarned + achEarnedBefore === achTotal;

	return {
		achTotal,
		achEarned,
		achEarnedBefore,
		earnedPercent,
		completed
	};
}
