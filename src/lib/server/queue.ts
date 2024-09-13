import fastq from "fastq";
import type { queue, done } from "fastq";
import { getGameAchievements, getPlayerAchievements, getProfileItems, getUser, getUserYearAchievements } from "./data";
import { logQueue } from "./logger";

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

export const q: queue<Task> = fastq<any, Task>(worker, 1);

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
