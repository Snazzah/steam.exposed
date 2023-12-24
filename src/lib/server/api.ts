import { STEAM_WEBKEY } from '$env/static/private';
import type { SteamTag, SteamYearInReview } from '$lib/types';
import { fetch } from 'undici';

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
  type: "app" | "demo" | "mod";
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  fullgame?: {
    appid: string;
    name: string;
  },
}

export async function fetchSteamSummary(steamid: string) {
  console.info(`Fetching summary for for steamid ${steamid}`);
  const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_WEBKEY}&steamids=${steamid}`);
  if (response.status !== 200) return null;
  const text = await response.text();
  return JSON.parse(text).response.players[0] as SteamSummary;
}

export async function getAppList(lastAppId?: number) {
  console.info(`Fetching app list${lastAppId ? ` (lastAppId=${lastAppId})` : ''}`);
  const response = await fetch(`https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${STEAM_WEBKEY}&max_results=50000${lastAppId ? `&last_appid=${lastAppId}` : ''}`);
  if (response.status !== 200) return null;
  const text = await response.text();
  return JSON.parse(text).response.apps as SteamApp[];
}

export async function getTagList(lang = 'english') {
  console.info(`Fetching tag list for lang ${lang}`);
  const response = await fetch(`https://api.steampowered.com/IStoreService/GetTagList/v1/?key=${STEAM_WEBKEY}&language=${lang}`);
  if (response.status !== 200) return null;
  const text = await response.text();
  return JSON.parse(text).response.tags as SteamTag[];
}

export async function fetchYearInReview(steamid: string, year: number) {
  console.info(`Fetching year in review for for steamid ${steamid} at year ${year}`);
  const response = await fetch(`https://api.steampowered.com/ISaleFeatureService/GetUserYearInReview/v1/?key=${STEAM_WEBKEY}&steamid=${steamid}&year=${year}`);
  if (response.status !== 200) return null;
  const text = await response.text();
  return JSON.parse(text).response as SteamYearInReview;
}

export async function fetchAppInfo(appid: number) {
  console.info(`Fetching app information for app ${appid}`);
  const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=US`);
  if (response.status !== 200) return null;
  const data: any = await response.json();
  return data[String(appid)] as { success: false } | { success: true; data: SteamAppInfo };
}
