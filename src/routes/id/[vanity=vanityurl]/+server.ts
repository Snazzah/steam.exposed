import { getVanityResolution } from '$lib/server/data';
import { parseYear } from '$lib/server/util';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, request }) => {
  const steamId = await getVanityResolution(params.vanity.toLowerCase());
  if (!steamId) redirect(307, '/');

  throw redirect(307, `/u/${steamId}/${parseYear(request)}`);
};
