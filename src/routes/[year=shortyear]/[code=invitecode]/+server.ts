import { inviteUrlToSteamID } from '$lib/util';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const steamId = inviteUrlToSteamID(params.code);
	if (!steamId) redirect(307, '/');
	throw redirect(307, `/u/${steamId}/${2000 + parseInt(params.year.slice(1))}`);
};
