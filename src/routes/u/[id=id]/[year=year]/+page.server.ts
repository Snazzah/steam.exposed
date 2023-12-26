import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAppInfo, getAppNames, getTags, getUser, getYearInReview } from '$lib/server/data';
import type { SteamYearInReview } from '$lib/types';

async function getData(yearInReview: SteamYearInReview) {
  const available = Object.keys(yearInReview).length !== 0;

  let tags: { tagid: number; name: string; }[] = [];
  let apps: Record<number, string> = {};
  if (available) {
    const taglist = await getTags();
    if (taglist) tags = taglist.filter(({ tagid }) => !!yearInReview.stats.playtime_stats.tag_stats.stats.find((t) => t.tag_id === tagid));

    const appIds = yearInReview.stats.playtime_stats.game_summary.map((g) => g.appid);
    apps = await getAppNames(appIds);
    const appInfos = await getAppInfo(yearInReview.stats.playtime_stats.game_summary.filter((g) => apps[g.appid] === '' || !apps[g.appid]).map((g) => g.appid))
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

export const load: PageServerLoad = async ({ params, request}) => {
  const profile = await getUser(params.id);
  if (profile === 0) throw error(404, 'User not found');
  else if (profile === null) throw error(500, 'Failed to load profile');

  const yearInReview = await getYearInReview(params.id, parseInt(params.year));
  if (yearInReview === null) throw new Error('Failed to load year in review');

  const userAgent = request.headers.get('User-Agent');
  const isBot = !userAgent || /bot|chatgpt|facebookexternalhit|WhatsApp|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|MetaInspector/i.test(userAgent)

  return { profile, year: params.year, yearInReview, data: isBot ? null : getData(yearInReview) };
};
