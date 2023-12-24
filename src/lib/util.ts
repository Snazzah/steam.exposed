export function getLatestYear() {
  const currentYear = new Date().getFullYear();
  const nextDate = new Date(`December 15 ${currentYear}`);
  if (nextDate.valueOf() < Date.now()) return currentYear;
  return currentYear - 1;
}
export const MIN_YEAR = 2022;

export function clampYear(unparsedYear: string | number) {
  const year = typeof unparsedYear === 'string' ? parseInt(unparsedYear) : Math.round(unparsedYear);
  const LATEST_YEAR = getLatestYear();
  if (!year || isNaN(year) || !isFinite(year)) return LATEST_YEAR;
  return Math.max(MIN_YEAR, Math.min(year, LATEST_YEAR))
}

export const inviteUrlDictionary: Record<string, string> = {
  'b': '0',
  'c': '1',
  'd': '2',
  'f': '3',
  'g': '4',
  'h': '5',
  'j': '6',
  'k': '7',
  'm': '8',
  'n': '9',
  'p': 'a',
  'q': 'b',
  'r': 'c',
  't': 'd',
  'v': 'e',
  'w': 'f',
};

export function inviteUrlToSteamID(inviteCode: string) {
  try {
    const accountId = BigInt(parseInt(inviteCode.split('').map((c) => inviteUrlDictionary[c]).filter((c) => !!c).join(''), 16));
    return (1n << 56n) | (1n << 52n) | (1n << 32n) | accountId;
  } catch (e) {
    return null;
  }
}

export function steamIdToInviteUrl(steamid: string) {
  try {
    const accountId = BigInt(steamid) & 0xFFFFFFFFn;

    // cursed.
    return accountId.toString(16).split('').map((c) => Object.entries(inviteUrlDictionary).find(([, h]) => h === c)?.[0] || '').join('');
  } catch (e) {
    return null;
  }
}

export function relativeTime(rtf: Intl.RelativeTimeFormat, seconds: number) {
	if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
	if (Math.abs(seconds) <= 3600) return rtf.format(Math.round(seconds / 60), 'minute');
	if (Math.abs(seconds) <= 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
	if (Math.abs(seconds) <= 2592000) return rtf.format(Math.round(seconds / 86400), 'day');
	if (Math.abs(seconds) <= 31536000) return rtf.format(Math.round(seconds / 2592000), 'month');
	return rtf.format(Math.round(seconds / 31536000), 'year');
}
