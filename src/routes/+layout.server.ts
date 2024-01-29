import { getSession } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { getUser } from '$lib/server/data';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const data = getSession(cookies.get('session'));
  if (data) {
    const sessionUser = await getUser(data.i);
    if (sessionUser === null || sessionUser === 0) cookies.delete('session', { path: '/' });
    else return { sessionUser };
  }

  return { sessionUser: null };
};
