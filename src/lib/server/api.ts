import { STEAM_WEBKEY } from '$env/static/private';
import type { SteamTag, SteamYearInReview } from '$lib/types';
import { fetch } from 'undici';
import { logError, logInfo } from './logger';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser();

export enum SteamPersonaState {
	OFFLINE = 0,
	ONLINE,
	BUSY,
	AWAY,
	SNOOZE,
	LOOKING_TO_TRADE,
	LOOKING_TO_PLAY
}

export interface SteamSummary {
	steamid: string;
	communityvisibilitystate: 1 | 3;
	profilestate: 0 | 1;
	personaname: string;
	profileurl: string;
	avatar: string;
	avatarmedium: string;
	avatarfull: string;
	avatarhash: string;
	lastlogoff: number;
	personastate: SteamPersonaState;
	primaryclanid: string | null;
	timecreated: number;
	personastateflags: 0;
	loccountrycode: string;
}

export interface SteamApp {
	appid: number;
	name: string;
	last_modified: number;
	price_change_number: number;
}

export interface SteamAppInfo {
	type?: 'app' | 'demo' | 'mod';
	name: string;
	fullgame?: {
		appid: string;
		name: string;
	};
	_steamData?: {
		missingToken: boolean;
		appid: string;
		common: {
			name: string;
			type: 'Game' | 'Demo';
			icon: string;
			library_assets: {
				library_capsule: string;
				library_hero: string;
				library_logo: string;
				logo_position: {
					pinned_position: 'BottomLeft' | 'BottomCenter' | 'TopCenter' | 'CenterCenter';
					width_pct: string;
					height_pct: string;
				};
			};
		};
		extended: any;
	};
}

export interface SteamProfileItem {
	communityitemid: string;
	name: string;
	item_title: string;
	item_description: string;
	appid: number;
	item_type: number;
	item_class: number;
}

export interface SteamProfileItems {
	profile_background: SteamProfileItem & {
		image_large: string;
		movie_webm: string;
		movie_mp4: string;
		movie_webm_small: string;
		movie_mp4_small: string;
	};
	mini_profile_background: SteamProfileItem & {
		image_large: string;
		movie_webm: string;
		movie_mp4: string;
	};
	avatar_frame: SteamProfileItem & {
		image_small: string;
		image_large: string;
	};
	animated_avatar: SteamProfileItem & {
		image_small: string;
		image_large: string;
	};
}

export interface SteamAchievementPercentages {
	achievementpercentages?: {
		achievements: {
			name: string;
			percent: number;
		}[];
	};
}

export interface SteamPlayerAchievements {
	playerstats:
		| {
				error: string;
				success: false;
		  }
		| {
				steamID: string;
				gameName: string;
				achievements: {
					apiname: string;
					achieved: 0 | 1;
					unlocktime: number;
					name: string;
					description: string;
				}[];
				success: true;
		  };
}

export interface SteamGameSchema {
	game?: {
		gameName?: string;
		gameVersion?: string;
		availableGameStats?: {
			achievements: {
				name: string;
				defaultvalue: number;
				displayName: string;
				hidden: number;
				description: string;
				icon: string;
				icongray: string;
			}[];
		};
	};
}

export interface SteamUserYearAchievements {
	game_achievements?: {
		appid: number;
		achievements?: {
			statid: number;
			fieldid: number;
			achievement_name_internal: string;
		}[];
		all_time_unlocked_achievements: number;
		unlocked_more_in_future: boolean;
	}[];
	total_achievements: number;
	total_rare_achievements: number;
	total_games_with_achievements: number;
}

export interface SteamUserAchievementsXML {
	playerstats: {
		privacyState: 'public';
		visibilityState: 3;
		game: {
			gameFriendlyName: number;
			gameName: string;
			gameLink: string;
			gameIcon: string;
			gameLogo: string;
			gameLogoSmall: string;
		};
		player: {
			steamID64: string;
			customURL: string;
		};
		stats: {
			hoursPlayed: number;
		};
		achievements: {
			achievement:
				| {
						iconClosed: string;
						iconOpen: string;
						name: string;
						apiname: string;
						description: string;
						unlockTimestamp?: number;
				  }[]
				| {
						iconClosed: string;
						iconOpen: string;
						name: string;
						apiname: string;
						description: string;
						unlockTimestamp?: number;
				  };
		};
	};
}

export async function fetchSteamSummary(steamid: string, loggedInUser = false) {
	logInfo(`Fetching summary for steamid ${steamid}${loggedInUser ? ` (from login)` : ''}`);
	const response = await fetch(
		`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_WEBKEY}&steamids=${steamid}`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text).response.players[0] as SteamSummary;
}

export async function getAppList(lastAppId?: number) {
	logInfo(`Fetching app list${lastAppId ? ` (lastAppId=${lastAppId})` : ''}`);
	const response = await fetch(
		`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${STEAM_WEBKEY}&max_results=50000${
			lastAppId ? `&last_appid=${lastAppId}` : ''
		}`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text).response.apps as SteamApp[];
}

export async function getTagList(lang = 'english') {
	logInfo(`Fetching tag list for lang ${lang}`);
	const response = await fetch(
		`https://api.steampowered.com/IStoreService/GetTagList/v1/?key=${STEAM_WEBKEY}&language=${lang}`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text).response.tags as SteamTag[];
}

export async function fetchYearInReview(steamid: string, year: number) {
	logInfo(`Fetching year in review for steamid ${steamid} at year ${year}`);
	const response = await fetch(
		`https://api.steampowered.com/ISaleFeatureService/GetUserYearInReview/v1/?key=${STEAM_WEBKEY}&steamid=${steamid}&year=${year}`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text).response as SteamYearInReview;
}

export async function fetchAppInfo(appid: number) {
	logInfo(`Fetching app information for app ${appid}`);
	const response = await fetch(
		`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=US`
	);
	if (response.status !== 200) return null;
	const data: any = await response.json();
	return data[String(appid)] as { success: false } | { success: true; data: SteamAppInfo };
}

export async function fetchVanity(vanityUrl: string) {
	logInfo(`Fetching vanity url resolution to ${vanityUrl}`);
	const response = await fetch(
		`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_WEBKEY}&vanityurl=${vanityUrl}`
	);
	if (response.status !== 200) return null;
	const data: any = await response.json();
	return data.response as { success: 42; message: 'No match' } | { steamid: string; success: 1 };
}

export async function fetchProfileItems(steamid: string) {
	logInfo(`Fetching profile items for steamid ${steamid}`);
	const response = await fetch(
		`https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?key=${STEAM_WEBKEY}&steamid=${steamid}`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text).response as SteamProfileItems;
}

export async function fetchAchievementPercentages(gameid: number) {
	logInfo(`Fetching achievement percentages for appid ${gameid}`);
	const response = await fetch(
		`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${gameid}&format=json`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text) as SteamAchievementPercentages;
}

export async function fetchPlayerAchievements(steamid: string, appid: number) {
	logInfo(`Fetching player achievements of steamid ${steamid} for appid ${appid}`);
	const response = await fetch(
		`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&steamid=${steamid}&key=${STEAM_WEBKEY}&format=json&l=en`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text) as SteamPlayerAchievements;
}

export async function fetchGameSchema(appid: number) {
	logInfo(`Fetching game schema for appid ${appid}`);
	const response = await fetch(
		`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${appid}&key=${STEAM_WEBKEY}&format=json`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text) as SteamGameSchema;
}

export async function fetchUserYearAchievements(steamid: string, year: number, appids: number[]) {
	logInfo(
		`Fetching user year achievements for steamid ${steamid} at year ${year} (${appids.length.toLocaleString()} appids)`
	);
	const response = await fetch(
		`https://api.steampowered.com/ISaleFeatureService/GetUserYearAchievements/v1/?key=${STEAM_WEBKEY}&steamid=${steamid}&year=${year}${appids.map((appid, i) => `&appids[${i}]=${appid}`)}&l=en`
	);
	if (response.status !== 200) return null;
	const text = await response.text();
	return JSON.parse(text).response as SteamUserYearAchievements;
}

export async function fetchPlayerAchievementsXML(steamid: string, appid: number) {
	logInfo(`Fetching user achievements XML for steamid ${steamid} on appid ${appid}`);
	let response = await fetch(
		`https://steamcommunity.com/profiles/${steamid}/stats/appid/${appid}/?tab=achievements&xml=1`,
		{ redirect: 'manual' }
	);

	// Handle vanity app IDs
	if (response.status === 302) {
		const location = response.headers.get('location');
		if (
			location &&
			location.startsWith('https://steamcommunity.com/') &&
			location.split('/')[5] === 'stats'
		) {
			const vanity = location.split('/')[6];
			response = await fetch(
				`https://steamcommunity.com/profiles/${steamid}/stats/${vanity}/?tab=achievements&xml=1`,
				{ redirect: 'manual' }
			);
		}
	}

	if (response.status !== 200) return null;
	const text = await response.text();
	if (!text.startsWith('<?xml')) return null;
	const data = xmlParser.parse(text) as SteamUserAchievementsXML | { response: { error: string } };
	if ('response' in data && 'error' in data.response) {
		logError(`Failed to fetch achievements XML [${steamid}/${appid}]:`, data.response.error);
		return null;
	}
	return data as SteamUserAchievementsXML;
}
