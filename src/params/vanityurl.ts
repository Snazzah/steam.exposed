import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return /^[a-z0-9]{2,32}$/.test(param.toLowerCase());
};
