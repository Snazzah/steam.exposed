import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	return /^[0-9]+$/.test(param) && BigInt(param) >= 76561197962146232n;
};
