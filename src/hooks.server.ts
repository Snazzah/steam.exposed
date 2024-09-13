import { logInfo } from '$lib/server/logger';
import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, status }) => {
  if (status === 404) return;
  if (status === 500) {
    console.error('Server error!', error);
    return { message: 'Server error...' };
  }
};

process.on('sveltekit:shutdown', async (signal: NodeJS.Signals) => {
  logInfo(`Received signal: ${signal}. Gracefully shutting down...`);
  // anything you need to clean up manually goes in here
  // await sleep(5000);
  // await jobs.stop();
  // await db.close();
});
