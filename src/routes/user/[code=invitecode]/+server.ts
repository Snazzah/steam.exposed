import { CURRENT_YEAR } from '$lib/constants';
import { inviteUrlToSteamID } from '$lib/util';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  const steamId = inviteUrlToSteamID(params.code);
  if (!steamId) redirect(307, '/');
  throw redirect(307, `/u/${steamId}/${CURRENT_YEAR}`);
};
