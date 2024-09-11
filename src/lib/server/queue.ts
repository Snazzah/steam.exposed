import fastq from "fastq";
import type { queue, done } from "fastq";
import { getUser } from "./data";
import { logQueue } from "./logger";

type Task = {
  type: 'fetchProfile';
  steamid: string;
  loggedIn?: boolean;
}

export const q: queue<Task> = fastq<any, Task>(worker, 1);

async function worker (task: Task, cb: done) {
  switch (task.type) {
    case 'fetchProfile': {
      logQueue(`refetching ${task.steamid}`);
      await getUser(task.steamid, task.loggedIn, true);
      break;
    }
  }
  cb(null);
}
