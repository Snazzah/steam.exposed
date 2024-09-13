import fastq from 'fastq';
import type { done } from 'fastq';
import { getGameAchievements, getPlayerAchievements, getProfileItems, getUser, getUserYearAchievements } from './data';
import { logQueue } from './logger';
import type { GameAchievement, SteamYearInReview } from '$lib/types';
import { ACH_DATA_STALE_TIME, GAME_ACH_INCOMPLETE_STALE_TIME, GAME_ACH_STALE_TIME, PLAYER_ACH_INCOMPLETE_STALE_TIME, YEAR_ACH_STALE_TIME } from './util';
import type { AnyMessageEvent } from '$lib/sse/types';
import { redis } from './redis';

type Task = ({
  type: 'fetchProfile';
  steamid: string;
  loggedIn?: boolean;
} | {
  type: 'fetchGameAchievements';
  appid: number;
  steamid?: string;
} | {
  type: 'fetchPlayerAchievements';
  appid: number;
  year: number;
  steamid: string;
} | {
  type: 'fetchUserYearAchievements';
  year: number;
  steamid: string;
  appids: number[];
}) & { reason?: string }

export const q = fastq<any, Task>(worker, 1);

async function worker (task: Task, cb: done) {
  switch (task.type) {
    case 'fetchProfile': {
      logQueue(`refetching profile of steamid ${task.steamid} (reason: ${task.reason ?? '<unk>'})`);
      await getUser(task.steamid, task.loggedIn, true);
      await getProfileItems(task.steamid, true);
      break;
    }
    case 'fetchGameAchievements': {
      logQueue(`refetching game achievements of appid ${task.appid} for steamid ${task.steamid ?? '<none>'} (reason: ${task.reason ?? '<unk>'})`);
      await getGameAchievements(task.appid, task.steamid, true);
      break;
    }
    case 'fetchPlayerAchievements': {
      logQueue(`refetching player achievements of appid ${task.appid} for steamid ${task.steamid} for year ${task.year} (reason: ${task.reason ?? '<unk>'})`);
      await getPlayerAchievements(task.steamid, task.appid, task.year, true);
      break;
    }
    case 'fetchUserYearAchievements': {
      logQueue(`refetching user year achievements for steamid ${task.steamid} for year ${task.year} (reason: ${task.reason ?? '<unk>'})`);
      await getUserYearAchievements(task.steamid, task.year, task.appids, true);
      break;
    }
  }
  cb(null);
}


type AchievementTask = {
  steamid: string;
  year: number;
  yearInReview: SteamYearInReview;
  send: (msg: AnyMessageEvent) => void;
}

export const achQ = fastq<any, AchievementTask>(achWorker, 1);
export let runningAchJob = '';

async function achWorker(task: AchievementTask, cb: done) {
  runningAchJob = `${task.steamid}-${task.year}`;
  logQueue(`Starting achievement task for ${task.steamid} on ${task.year}`);
  // for (let i = 0; i < 600; i++) {
  //   await new Promise((r) => setTimeout(r, 100));
  //   task.send({ event: 'update', data: { text: 'Progress...', progress: i / 600 } });
  // }

  try {
    const { steamid: id, year, yearInReview } = task;
    const appids = yearInReview.stats.playtime_stats.game_summary.map((a) => a.appid);
    task.send({ event: 'update', data: { text: 'Fetching user year achievements' } });
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
    let appsFetched = 0;
    const appAmount = Object.entries(yearAchievements.apps).filter(([, achs]) => achs.achievements.length !== 0).length;
    for (const appid in yearAchievements.apps) {
      const gameYearAchievements = yearAchievements.apps[appid];
      if (gameYearAchievements.achievements.length === 0) continue;
      task.send({ event: 'update', data: { text: `Fetching game achievements (${++appsFetched}/${appAmount}): ${appid}`, progress: (appsFetched / (appAmount * 2)) } });
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
    let playerAchsFetched = 0;
    for (const appid in yearAchievements.apps) {
      const gameYearAchievements = yearAchievements.apps[appid];
      if (gameYearAchievements.achievements.length === 0) continue;
      task.send({ event: 'update', data: { text: `Fetching player achievements (${++playerAchsFetched}/${appAmount}): ${appid}`, progress: ((appsFetched + playerAchsFetched) / (appAmount * 2)) } });
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

    const achData = {
      games: allGameAchievements,
      unlocked: allPlayerAchievements,
      complete: yearAchievements.complete,
      total: yearAchievements.total,
      totalRare: yearAchievements.totalRare,
      gamesWithAchievements: yearAchievements.gamesWithAchievements
    };
	  await redis.set(`achdata:${task.steamid}:${task.year}`, JSON.stringify(achData), 'EX', ACH_DATA_STALE_TIME);

    task.send({
      event: 'end',
      data: {
        data: achData
      }
    });
  } catch (e) {
    task.send({
      event: 'end',
      data: {
        error: 'SERVER_ERROR'
      }
    });
  }
  runningAchJob = '';
  cb(null);
}


