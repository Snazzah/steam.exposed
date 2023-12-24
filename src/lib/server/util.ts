import { MIN_YEAR, getLatestYear } from "$lib/util";

export function parseYear(request: Request) {
  const LATEST_YEAR = getLatestYear();
  let year = LATEST_YEAR;

  if (request.url.includes('?year=20')) {
    const url = new URL(request.url);
    const setYear = url.searchParams.get('year');
    if (setYear && /^20[0-9]{2}$/.test(setYear)) {
      const parsedYear = parseInt(setYear);
      if (parsedYear >= MIN_YEAR && parsedYear <= LATEST_YEAR) year = parsedYear;
    }
  }

  return year;
}
