import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getAppInfo,
	getAppNames,
	getCachedAchievementData,
	getProfileItems,
	getTags,
	getUser,
	getYearInReview
} from '$lib/server/data';
import type { AppInfo, SteamYearInReview } from '$lib/types';
import { q } from '$lib/server/queue';
import { PROFILE_STALE_TIME, requestIsBot } from '$lib/server/util';

async function getData(yearInReview: SteamYearInReview) {
	const available = Object.keys(yearInReview).length !== 0;

	let tags: { tagid: number; name: string }[] = [];
	let apps: Record<number, AppInfo> = {};
	if (available) {
		const taglist = await getTags();
		if (taglist)
			tags = taglist.filter(
				({ tagid }) =>
					!!yearInReview.stats.playtime_stats.tag_stats.stats.find((t) => t.tag_id === tagid)
			);

		const appIds = yearInReview.stats.playtime_stats.game_summary.map((g) => g.appid);
		apps = await getAppNames(appIds).then((r) =>
			Object.values(r).reduce((p, [k, v]) => ({ ...p, [k]: { name: v } }), {})
		);

		const appInfos = await getAppInfo(
			yearInReview.stats.playtime_stats.game_summary.map((g) => g.appid)
		);
		for (const appId in appInfos) {
			const app = appInfos[appId];
			if (!('miss' in app)) {
				apps[Number(appId)] = {
					name: app.name,
					icon: app._steamData?.common.icon,
					logoPosition: app._steamData?.common.library_assets?.logo_position
						? {
								position: app._steamData.common.library_assets.logo_position.pinned_position,
								width: parseFloat(app._steamData.common.library_assets.logo_position.width_pct),
								height: parseFloat(app._steamData.common.library_assets.logo_position.height_pct)
							}
						: undefined
				};
				if (app.fullgame?.appid) apps[Number(app.fullgame.appid)] = { name: app.fullgame.name };
			}
		}
	}

	return { yearInReview, tags, apps };
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
	const isBot = requestIsBot(userAgent);
	const unavailable = Object.keys(yearInReview).length === 0;

	return {
		profile,
		profileItems: isBot ? null : await getProfileItems(params.id),
		year: params.year,
		yearInReview,
		data: isBot ? null : getData(yearInReview),
		achievementData:
			isBot || unavailable ? null : await getCachedAchievementData(params.id, parseInt(params.year))
	};
};
