import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, status }) => {
  if (status === 404) return;
  if (status === 500) {
    console.error('Server error!', error);
    return { message: 'Server error...' };
  }
};
