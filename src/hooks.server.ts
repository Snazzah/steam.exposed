import { logInfo } from '$lib/server/logger';
import { user } from '$lib/server/steam';
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
	user.logOff();
});

if (!user.steamID) user.logOn({ anonymous: true });
