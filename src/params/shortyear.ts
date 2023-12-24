import { CURRENT_YEAR, MIN_YEAR } from '$lib/constants';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return /^y+\d{2}$/.test(param) && parseInt(param.slice(1)) >= MIN_YEAR - 2000 && 2000 + parseInt(param.slice(1)) <= CURRENT_YEAR;
};
