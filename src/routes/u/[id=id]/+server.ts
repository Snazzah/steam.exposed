import { getLatestYear } from '$lib/util';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	throw redirect(307, `/u/${params.id}/${getLatestYear()}`);
};
