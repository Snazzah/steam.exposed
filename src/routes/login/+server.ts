import type { RequestHandler } from './$types';
import { STEAM_CALLBACK } from '$env/static/private';
import { getSession } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { getLatestYear } from '$lib/util';

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionData = getSession(cookies.get('session'));
  if (sessionData) throw redirect(307, `/u/${sessionData.i}/${getLatestYear()}`);

  const query = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.mode': 'checkid_setup',
    'openid.return_to': STEAM_CALLBACK
  });

  throw redirect(307, `https://steamcommunity.com/openid/login?${query.toString()}`);
};
