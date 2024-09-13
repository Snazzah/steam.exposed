import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getAppInfo,
	getAppNames,
	getGameAchievements,
	getPlayerAchievements,
	getProfileItems,
	getTags,
	getUser,
	getUserYearAchievements,
	getYearInReview,
} from '$lib/server/data';
import type { SteamYearInReview, GameAchievement } from '$lib/types';
import { q } from '$lib/server/queue';

const PROFILE_STALE_TIME = 86400000; // 1 day
const GAME_ACH_STALE_TIME = 86400000 * 7; // 7 days
const GAME_ACH_INCOMPLETE_STALE_TIME = 86400000; // 1 day
const PLAYER_ACH_INCOMPLETE_STALE_TIME = 3600000; // 1 hour
const YEAR_ACH_STALE_TIME = 3600000; // 1 hour

async function getData(yearInReview: SteamYearInReview) {
	const available = Object.keys(yearInReview).length !== 0;

	let tags: { tagid: number; name: string }[] = [];
	let apps: Record<number, string> = {};
	if (available) {
		const taglist = await getTags();
		if (taglist)
			tags = taglist.filter(
				({ tagid }) =>
					!!yearInReview.stats.playtime_stats.tag_stats.stats.find((t) => t.tag_id === tagid)
			);

		const appIds = yearInReview.stats.playtime_stats.game_summary.map((g) => g.appid);
		apps = await getAppNames(appIds);
		const appInfos = await getAppInfo(
			yearInReview.stats.playtime_stats.game_summary
				.filter((g) => apps[g.appid] === '' || !apps[g.appid])
				.map((g) => g.appid)
		);
		for (const appId in appInfos) {
			const app = appInfos[appId];
			if (!('miss' in app)) {
				apps[Number(appId)] = app.name;
				if (app.fullgame?.appid) apps[Number(app.fullgame.appid)] = app.fullgame.name;
			}
		}
	}

	return { yearInReview, tags, apps };
}

async function getAchievements(id: string, year: number, yearInReview: SteamYearInReview) {
  const appids = yearInReview.stats.playtime_stats.game_summary.map((a) => a.appid);
  const yearAchievements = await getUserYearAchievements(id, year, appids);

  // Refetch year achievements if it was fetched during the year
  if (new Date(yearAchievements._fetchedAt).getFullYear() === year && Date.now() - yearAchievements._fetchedAt > YEAR_ACH_STALE_TIME)
    q.push({
      type: 'fetchUserYearAchievements',
      steamid: id,
      year,
      appids,
      reason: 'stale'
    });

  // Fetch game achievement info
  const allGameAchievements: Record<number, GameAchievement[] | null> = {};
  for (const appid in yearAchievements.apps) {
    const gameYearAchievements = yearAchievements.apps[appid];
    if (gameYearAchievements.achievements.length === 0) continue;
    const gameAchievements = await getGameAchievements(parseInt(appid, 10), id);

    // Refetch stale achievements
    if (gameAchievements && Date.now() - gameAchievements._fetchedAt > (gameAchievements.complete ? GAME_ACH_STALE_TIME : GAME_ACH_INCOMPLETE_STALE_TIME))
      q.push({
        type: 'fetchGameAchievements',
        appid: parseInt(appid, 10),
        steamid: id,
        reason: gameAchievements.complete ? 'stale' : 'stale_incomplete'
      });

    allGameAchievements[appid] = gameAchievements?.achievements ?? null;
  }

  // Fetch user achievement info
  const allPlayerAchievements: Record<number, Record<string, number> | null> = {};
  for (const appid in yearAchievements.apps) {
    const gameYearAchievements = yearAchievements.apps[appid];
    if (gameYearAchievements.achievements.length === 0) continue;
    const playerAchievements = await getPlayerAchievements(id, parseInt(appid, 10), year);

    // Refetch bad player achievements
    if (playerAchievements?.success === false && Date.now() - playerAchievements._fetchedAt > PLAYER_ACH_INCOMPLETE_STALE_TIME)
      q.push({
        type: 'fetchPlayerAchievements',
        appid: parseInt(appid, 10),
        steamid: id,
        year,
        reason: 'stale_incomplete'
      });

    allPlayerAchievements[appid] = playerAchievements.success ? playerAchievements.achievements : null;
  }

  return {
    games: allGameAchievements,
    unlocked: allPlayerAchievements,
    complete: yearAchievements.complete,
    total: yearAchievements.total,
    totalRare: yearAchievements.totalRare,
    gamesWithAchievements: yearAchievements.gamesWithAchievements
  }
}

export const load: PageServerLoad = async ({ params, request }) => {
	const profile = await getUser(params.id);
	if (profile === 0) throw error(404, 'User not found');
	else if (profile === null) throw error(500, 'Failed to load profile');
  else if (profile._fetchedAt && Date.now() - profile._fetchedAt > PROFILE_STALE_TIME)
    q.push({
      type: 'fetchProfile',
      steamid: params.id,
      reason: 'stale'
    });

	const yearInReview = await getYearInReview(params.id, parseInt(params.year));
	if (yearInReview === null) throw new Error('Failed to load year in review');

	const userAgent = request.headers.get('User-Agent');
	const isBot =
		!userAgent ||
		/bot|chatgpt|facebookexternalhit|WhatsApp|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|MetaInspector/i.test(
			userAgent
		);
  const unavailable = Object.keys(yearInReview).length === 0;

	return {
		profile,
		profileItems: isBot ? null : await getProfileItems(params.id),
		year: params.year,
		yearInReview,
		data: isBot ? null : getData(yearInReview),
		achievementData: (isBot || unavailable) ? null : getAchievements(params.id, parseInt(params.year), yearInReview)
	};
};
