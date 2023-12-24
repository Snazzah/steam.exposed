import { parseYear } from '$lib/server/util';
import { inviteUrlToSteamID } from '$lib/util';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, request }) => {
  const steamId = inviteUrlToSteamID(params.code);
  if (!steamId) redirect(307, '/');
  throw redirect(307, `/u/${steamId}/${parseYear(request)}`);
};
