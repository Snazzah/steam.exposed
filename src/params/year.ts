import { CURRENT_YEAR, MIN_YEAR } from '$lib/constants';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return /^20[0-9]{2}$/.test(param) && parseInt(param) >= MIN_YEAR && parseInt(param) <= CURRENT_YEAR;
};
