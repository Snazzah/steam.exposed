import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	return /^[bcdfghjkmnpqrtvw-]{4,9}$/.test(param);
};
