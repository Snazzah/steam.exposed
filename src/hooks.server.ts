import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ status }) => {
  if (status === 404) return;
  if (status === 500) return { message: 'Server error...' };
};
