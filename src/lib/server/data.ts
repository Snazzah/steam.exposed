import type { SteamTag, SteamYearInReview } from '$lib/types';
import {
	fetchAppInfo,
	fetchProfileItems,
	fetchSteamSummary,
	fetchVanity,
	fetchYearInReview,
	getAppList,
	getTagList,
	type SteamAppInfo,
	type SteamProfileItems,
	type SteamSummary
} from './api';
import { redis } from './redis';

export async function getAppNames(appids: number[]) {
	const idsLeft = new Set(appids);
	const results: Record<number, string> = {};

	for (const appid of appids) {
		const name = await redis.get(`appname:${appid}`);
		if (name !== null) {
			idsLeft.delete(appid);
			results[appid] = name;
		}
	}

	let smallestId = [...idsLeft].sort((a, b) => a - b)[0] - 1;
	while (idsLeft.size > 0) {
		const applist = await getAppList(smallestId);
		if (!applist) break;

		for (let i = 0; i < applist.length; i++) {
			const app = applist[i];
			if (appids.includes(app.appid)) results[app.appid] = app.name;
		}

		await redis.mset(applist.map((a) => [`appname:${a.appid}`, a.name]).flat());

		const largestId = applist[applist.length - 1].appid;
		const missedIds: number[] = [];
		[...idsLeft].forEach((id) => {
			if (id <= largestId) {
				idsLeft.delete(id);
				if (!results[id]) {
					results[id] = '';
					missedIds.push(id);
				}
			}
		});

		for (let i = 0; i < missedIds.length; i++) {
			const id = missedIds[i];
			await redis.set(`appname:${id}`, '', 'EX', 86400);
		}

		if (idsLeft.size === 0) break;
		smallestId = [...idsLeft].sort((a, b) => a - b)[0] - 1;
	}

	return results;
}

export async function getAppInfo(appids: number[]) {
	const idsLeft = new Set(appids);
	const results: Record<number, SteamAppInfo | { miss: true }> = {};

	for (const appid of appids) {
		const data = await redis.get(`appinfo:${appid}`);
		if (data !== null) {
			idsLeft.delete(appid);
			results[appid] = JSON.parse(data);
		}
	}

	for (const id of idsLeft.values()) {
		const appinfo = await fetchAppInfo(id);
		if (!appinfo) break;

		if (appinfo.success) {
			results[id] = appinfo.data;
			await redis.set(`appinfo:${id}`, JSON.stringify(appinfo.data));
			await redis.set(`appname:${id}`, appinfo.data.name);
			if (appinfo.data.fullgame?.appid)
				await redis.set(`appname:${appinfo.data.fullgame.appid}`, appinfo.data.fullgame.name);
		} else {
			results[id] = { miss: true };
			await redis.set(`appinfo:${id}`, '{"miss":true}', 'EX', 3600);
		}
	}

	return results;
}

export async function getTags(lang = 'english'): Promise<SteamTag[]> {
	const cached = await redis.get(`tags:${lang}`);
	if (cached) return JSON.parse(cached);

	const tags = await getTagList(lang);
	if (!tags) return [];

	await redis.set(`tags:${lang}`, JSON.stringify(tags), 'EX', 86400);
	return tags;
}

export async function getUser(
	steamid: string,
	loggedInUser = false,
  skipCache = false
): Promise<(SteamSummary & { _fetchedAt: number; }) | 0 | null> {
  if (!skipCache) {
    const cached = await redis.get(`user:${steamid}`);
    if (cached) return JSON.parse(cached);
  }

	const summary = await fetchSteamSummary(steamid, loggedInUser);
	if (summary === undefined) {
		await redis.set(`user:${steamid}`, '0', 'EX', 3600);
		return 0;
	}

	if (!summary) return null;

  const fetchedAt = Date.now();
	await redis.set(`user:${steamid}`, JSON.stringify({ ...summary, _fetchedAt: fetchedAt }));
	return { ...summary, _fetchedAt: fetchedAt };
}

export async function getYearInReview(
	steamid: string,
	year: number
): Promise<SteamYearInReview | null> {
	const cached = await redis.get(`yearinreview:${steamid}:${year}`);
	if (cached) return JSON.parse(cached);

	const data = await fetchYearInReview(steamid, year);
	if (!data) return null;

	const available = Object.keys(data).length !== 0;
	if (!available) {
		await redis.set(`yearinreview:${steamid}:${year}`, JSON.stringify(data), 'EX', 60);
		return data;
	}

	await redis.set(`yearinreview:${steamid}:${year}`, JSON.stringify(data));
	return data;
}

export async function getVanityResolution(vanity: string): Promise<string | null> {
	const cached = await redis.get(`vanity:${vanity}`);
	if (cached) return cached;

	const data = await fetchVanity(vanity);
	if (!data || data.success !== 1) return null;

	await redis.set(`vanity:${vanity}`, data.steamid, 'EX', 86400);
	return data.steamid;
}

export async function getProfileItems(steamid: string): Promise<SteamProfileItems | null> {
	const cached = await redis.get(`profileitems:${steamid}`);
	if (cached) return JSON.parse(cached);

	const items = await fetchProfileItems(steamid);
	if (!items) {
		await redis.set(`profileitems:${steamid}`, JSON.stringify(items), 'EX', 60);
		return null;
	}

	await redis.set(`profileitems:${steamid}`, JSON.stringify(items), 'EX', 3600);
	return items;
}
