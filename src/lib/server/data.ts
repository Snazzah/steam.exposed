import type { AchievementData, GameAchievement, SteamTag, SteamYearInReview } from '$lib/types';
import {
  fetchAchievementPercentages,
	fetchAppInfo,
	fetchGameSchema,
	fetchPlayerAchievements,
	fetchPlayerAchievementsXML,
	fetchProfileItems,
	fetchSteamSummary,
	fetchUserYearAchievements,
	fetchVanity,
	fetchYearInReview,
	getAppList,
	getTagList,
	type SteamAppInfo,
	type SteamProfileItems,
	type SteamSummary
} from './api';
import { logInfo } from './logger';
import { redis } from './redis';
import split from 'just-split';
import { user } from './steam';
import { UNKNOWN_APPID_TIME } from './util';

const STEAMDB_WENDY_STEAMID = '76561198074261126';
const YEAR_ACH_BATCH_AMOUNT = 300;

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

  if (user.steamID) {
    if (idsLeft.size !== 0) {
      const response = await user.getProductInfo([...idsLeft], []);

      for (const [id, app] of Object.entries(response.apps)) {
        results[app.appinfo.appid] = {
          name: app.appinfo.common.name,
          _steamData: {
            ...app.appinfo,
            missingToken: app.missingToken
          }
        };
        await redis.set(`appinfo:${id}`, JSON.stringify(results[app.appinfo.appid]));
        await redis.set(`appname:${id}`, app.appinfo.common.name);
      }

      for (const id of response.unknownApps) {
        results[id] = { miss: true };
        await redis.set(`appinfo:${id}`, '{"miss":true}', 'EX', UNKNOWN_APPID_TIME / 1000);
      }
    }
  } else {
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

export async function getCachedYearInReview(
	steamid: string,
	year: number
): Promise<SteamYearInReview | null> {
	const cached = await redis.get(`yearinreview:${steamid}:${year}`);
	if (cached) return JSON.parse(cached);
  return null;
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

export async function getProfileItems(steamid: string, skipCache = false): Promise<(SteamProfileItems & { _fetchedAt: number; }) | null> {
	if (!skipCache) {
		const cached = await redis.get(`profileitems:${steamid}`);
		if (cached) return JSON.parse(cached);
	}

	const items = await fetchProfileItems(steamid);
	if (!items) {
		await redis.set(`profileitems:${steamid}`, JSON.stringify(items), 'EX', 60);
		return null;
	}

	const fetchedAt = Date.now();
	await redis.set(`profileitems:${steamid}`, JSON.stringify({ ...items, _fetchedAt: fetchedAt }));
	return { ...items, _fetchedAt: fetchedAt };
}

export async function getCachedAchievementData(
	steamid: string,
	year: number
): Promise<AchievementData | null> {
	const cached = await redis.get(`achdata:${steamid}:${year}`);
	if (cached) return JSON.parse(cached);
  return null;
}

interface GameAchievements {
  gameVersion: string;
  complete: boolean;
  achievements: GameAchievement[];
  _fetchedAt: number;
}

// Uses steamdb_wendy's ID, should work mostly
export async function getGameAchievements(appid: number, steamid = STEAMDB_WENDY_STEAMID, forceFetch = false): Promise<GameAchievements | null> {
  const cached = await redis.get(`gameach:${appid}`);
  if (cached && !forceFetch) return JSON.parse(cached);
  const cachedGame = cached ? JSON.parse(cached) as (GameAchievements | null) : null;

  const schema = await fetchGameSchema(appid);
	if (!schema) {
    const result = cachedGame ? {
      ...cachedGame,
      _fetchedAt: Date.now()
    } : null;
		await redis.set(`gameach:${appid}`, JSON.stringify(result));
		return result;
	}

  // Achievements only need an XML refetch if there are hidden achievements without descriptions
  const hasAchievements = (schema.game?.availableGameStats?.achievements?.length ?? 0) > 0;
  const needsXML = hasAchievements && !!schema.game?.availableGameStats?.achievements?.find((a) => a.hidden && !a.description);
  const percentages = hasAchievements ? await fetchAchievementPercentages(appid) : null;

  // If the user's steam id doesn't work, refetch on wendy
  const xmlData = needsXML ? ((steamid !== STEAMDB_WENDY_STEAMID ? await fetchPlayerAchievementsXML(steamid, appid) : null) ?? await fetchPlayerAchievementsXML(STEAMDB_WENDY_STEAMID, appid)) : null;
  const xmlAchievements = xmlData ? Array.isArray(xmlData?.playerstats.achievements.achievement) ? xmlData?.playerstats.achievements.achievement : [xmlData?.playerstats.achievements.achievement] : null;

  const result: GameAchievements = {
    gameVersion: schema.game?.gameVersion ?? '',
    complete: needsXML ? !!xmlData : true,
    achievements: [
      ...(schema.game?.availableGameStats?.achievements ?? []).map((ach) => ({
        id: ach.name,
        name: ach.displayName,
        description:
          // Use decription or use refetched XML description
          ach.description || ((ach.hidden ? xmlAchievements?.find((a) => String(a.apiname).trim() === ach.name.toLowerCase())?.description.trim() : '') ?? ''),
        hidden: !!ach.hidden,
        icon: ach.icon,
        iconGray: ach.icongray,
        percent:
          // Use fetched percentage
          percentages?.achievementpercentages?.achievements.find((a) => ach.name === a.name)?.percent
          // Use cached percent
          ?? cachedGame?.achievements?.find((a) => a.id === ach.name)?.percent
          // Default to -1
          ?? -1,
        foundAt: cachedGame?.achievements?.find((a) => a.id === ach.name)?.foundAt ?? Date.now(),
        removedAt: null
      })),
      // Show removed achievements
      ...(cachedGame?.achievements ?? []).filter((ach) => !schema.game?.availableGameStats?.achievements.find((a) => a.name === ach.id)).map((ach) => ({
        ...ach,
        removedAt: cachedGame?.achievements?.find((a) => a.id === ach.name)?.removedAt ?? Date.now()
      }))
    ],
    _fetchedAt: Date.now()
  };

	await redis.set(`gameach:${appid}`, JSON.stringify(result));
  return result;
}

interface YearAchievements {
  apps: Record<number, {
    achievements: string[];
    allTimeUnlocked: number;
    futureUnlocks: boolean;
  }>;
  total: number;
  totalRare: number;
  gamesWithAchievements: number;
  complete: boolean;
  _fetchedAt: number;
}

export async function getUserYearAchievements(steamid: string, year: number, appids: number[], skipCache = false): Promise<YearAchievements> {
  const REDIS_KEY = `yearach:${steamid}:${year}`;
  if (!skipCache) {
    const cached = await redis.get(REDIS_KEY);
    if (cached) return JSON.parse(cached);
  }

  const batches = split([ ...new Set(appids) ], YEAR_ACH_BATCH_AMOUNT);
  const result: YearAchievements = {
    apps: {},
    total: 0,
    totalRare: 0,
    gamesWithAchievements: 0,
    complete: true,
    _fetchedAt: Date.now()
  };

  for (const batch of batches) {
    const partResult = await fetchUserYearAchievements(steamid, year, batch);
    if (!partResult || Object.keys(partResult).length === 0) result.complete = false;
    else {
      if (partResult.game_achievements) result.apps = {
        ...result.apps,
        ...(partResult.game_achievements.reduce((p, g) => ({
          ...p,
          [g.appid]: {
            achievements: (g.achievements ?? []).map((a) => a.achievement_name_internal),
            allTimeUnlocked: g.all_time_unlocked_achievements,
            futureUnlocks: g.unlocked_more_in_future
          }
        }), {}))
      }
      if (typeof partResult.total_achievements === 'number')
        result.total =+ partResult.total_achievements;
      if (typeof partResult.total_rare_achievements === 'number')
        result.totalRare =+ partResult.total_rare_achievements;
      if (typeof partResult.total_games_with_achievements === 'number')
        result.gamesWithAchievements =+ partResult.total_games_with_achievements;
    }
  }

	await redis.set(REDIS_KEY, JSON.stringify(result));
  return result;
}

interface PlayerAchievements {
  achievements: Record<string, number>;
  success: boolean;
  _forYear: number;
  _fetchedAt: number;
}

export async function getPlayerAchievements(steamid: string, appid: number, forYear = 0, forceFetch = false): Promise<PlayerAchievements> {
  const REDIS_KEY = `playerach:${steamid}:${appid}`;
  const cached = await redis.get(REDIS_KEY);
  const cachedResult = cached ? JSON.parse(cached) as PlayerAchievements : null;
  if (cachedResult && !forceFetch && !(cachedResult._forYear !== 0 && forYear && cachedResult._forYear < forYear)) return cachedResult;

  const achievements = await fetchPlayerAchievements(steamid, appid);
  if (!achievements || !achievements.playerstats?.success) {
    const result: PlayerAchievements = {
      achievements: cachedResult?.achievements ?? {},
      success: false,
      _forYear: forYear,
      _fetchedAt: Date.now()
    };
    if (achievements?.playerstats?.success === false) logInfo(`Failed to get player achievements [${steamid}/${appid}] ${achievements?.playerstats?.error}`);
		await redis.set(REDIS_KEY, JSON.stringify(result));
		return result;
  }

  const result: PlayerAchievements = {
    achievements: {
      ...(cachedResult?.achievements ?? {}),
      ...achievements.playerstats.achievements.reduce((p, a) => ({
        ...p,
        [a.apiname]: a.unlocktime
      }), {})
    },
    success: true,
    _forYear: forYear,
    _fetchedAt: Date.now()
  };
	await redis.set(REDIS_KEY, JSON.stringify(result));
  return result;
}
