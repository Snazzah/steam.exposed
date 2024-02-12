import type { RequestHandler } from './$types';
import { STEAM_CALLBACK } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { getLatestYear } from '$lib/util';
import { createSession } from '$lib/server/auth';
import { logInfo } from '$lib/server/logger';

const REQUIRED_PARAMS = [
	'openid.ns',
	'openid.mode',
	'openid.op_endpoint',
	'openid.claimed_id',
	'openid.identity',
	'openid.return_to',
	'openid.response_nonce',
	'openid.assoc_handle',
	'openid.signed',
	'openid.sig'
];

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (
		REQUIRED_PARAMS.map((p) => url.searchParams.has(p)).includes(false) ||
		url.searchParams.get('openid.ns') !== 'http://specs.openid.net/auth/2.0' ||
		url.searchParams.get('openid.mode') !== 'id_res' ||
		url.searchParams.get('openid.op_endpoint') !== 'https://steamcommunity.com/openid/login' ||
		!url.searchParams
			.get('openid.claimed_id')!
			.startsWith('https://steamcommunity.com/openid/id/') ||
		url.searchParams.get('openid.claimed_id') !== url.searchParams.get('openid.identity') ||
		url.searchParams.get('openid.return_to') !== STEAM_CALLBACK
	)
		throw redirect(302, '/#login_fail');

	const query = new URLSearchParams({
		'openid.ns': 'http://specs.openid.net/auth/2.0',
		'openid.mode': 'check_authentication',
		'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
		'openid.claimed_id': url.searchParams.get('openid.claimed_id')!,
		'openid.identity': url.searchParams.get('openid.identity')!,
		'openid.return_to': STEAM_CALLBACK,
		'openid.response_nonce': url.searchParams.get('openid.response_nonce')!,
		'openid.assoc_handle': url.searchParams.get('openid.assoc_handle')!,
		'openid.signed': url.searchParams.get('openid.signed')!,
		'openid.sig': url.searchParams.get('openid.sig')!
	});

	const response = await fetch(`https://steamcommunity.com/openid/login?${query.toString()}`);
	if (response.status !== 200 || !(await response.text()).includes('is_valid:true'))
		throw redirect(302, '/#login_fail');

	const steamid = url.searchParams.get('openid.identity')!.slice(37);
	const token = createSession({ i: steamid });
	cookies.set('session', token, { maxAge: 60 * 60 * 24 * 7, path: '/' });
	logInfo(`User logged in ${steamid}`);

	throw redirect(307, `/u/${steamid}/${getLatestYear()}`);
};
