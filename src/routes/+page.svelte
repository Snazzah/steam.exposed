<script lang="ts">
	import Icon from "@iconify/svelte";
  import sendIcon from "@iconify-icons/mdi/send";
  import menuIcon from '@iconify-icons/mdi/menu-down';
  import checkIcon from '@iconify-icons/mdi/check';
	import Footer from "$lib/components/Footer.svelte";
	import { MIN_YEAR, getLatestYear, inviteUrlToSteamID } from "$lib/util";
	import { clickOutside } from "$lib/actions";

  const LATEST_YEAR = getLatestYear();
  let selectedYear = LATEST_YEAR;
  let showYearDropdown = false;
  const yearsAvailable = (() => {
    const years: number[] = [];
    for (let i = LATEST_YEAR; i >= MIN_YEAR; i--) years.push(i);
    return years;
  })();

  let input = '';
  let inputErrored = false;
  function submitInput() {
    if (input.includes('://s.team/')) {
      const shareUrlMatch = input.match(/^\s*https?:\/\/s\.team\/y(\d{2})\/([bcdfghjkmnpqrtvw-]{4,9})/);
      if (shareUrlMatch) return location.href = `/u/${inviteUrlToSteamID(shareUrlMatch[2])}/${2000 + parseInt(shareUrlMatch[1])}`;

      const shortUrlMatch = input.match(/^\s*https?:\/\/s\.team\/p\/([bcdfghjkmnpqrtvw-]{4,9})/);
      if (shortUrlMatch) return location.href = `/u/${inviteUrlToSteamID(shortUrlMatch[1])}/${selectedYear}`;
    }

    if (input.includes('://store.steampowered.com/yearinreview/')) {
      const yearInReviewUrl = input.match(/^\s*https?:\/\/store\.steampowered\.com\/yearinreview\/([0-9]+)\/(20[0-9]{2})/);
      if (yearInReviewUrl) return location.href = `/u/${yearInReviewUrl[1]}/${yearInReviewUrl[2]}`;
    }

    if (input.includes('://steamcommunity.com/')) {
      const vanityUrl = input.match(/^\s*https?:\/\/steamcommunity\.com\/id\/([A-Za-z0-9]{2,32})/);
      if (vanityUrl) return location.href = `/id/${vanityUrl[1]}?year=${selectedYear}`;

      const profileUrl = input.match(/^\s*https?:\/\/steamcommunity\.com\/profiles\/([0-9]+)/);
      if (profileUrl) return location.href = `/u/${profileUrl[1]}/${selectedYear}`;

      const userUrl = input.match(/^\s*https?:\/\/steamcommunity\.com\/user\/([bcdfghjkmnpqrtvw-]{4,9})/);
      if (userUrl) return location.href = `/u/${inviteUrlToSteamID(userUrl[1])}/${selectedYear}`;
    }

    if (input.includes('://steamdb.info/calculator/')) {
      const steamDbMatch = input.match(/^\s*https?:\/\/steamdb\.info\/calculator\/([0-9]+)/);
      if (steamDbMatch) return location.href = `/u/${steamDbMatch[1]}/${selectedYear}`;
    }

    if (input.startsWith('STEAM_1:')) {
      const steam2Match = input.match(/^STEAM_1:([01]):(\d+)$/);
      if (steam2Match) {
        const accountId = BigInt((parseInt(steam2Match[2], 10) * 2) + parseInt(steam2Match[1], 10));
        return location.href = `/u/${(1n << 56n) | (1n << 52n) | (1n << 32n) | accountId}/${selectedYear}`;
      }
    }

    if (input.startsWith('[U:1:')) {
      const steam3Match = input.match(/^\[U:1:(\d+)\]$/);
      if (steam3Match) {
        const accountId = BigInt(steam3Match[1]);
        return location.href = `/u/${(1n << 56n) | (1n << 52n) | (1n << 32n) | accountId}/${selectedYear}`;
      }
    }

    if (/^[0-9]+$/.test(input) && BigInt(input) >= 76561197962146232n) return location.href = `/u/${input}/${selectedYear}`;
    if (/^[A-Za-z0-9]{2,32}$/.test(input)) return location.href = `/id/${input}?year=${selectedYear}`;

    inputErrored = true;
  }

  // TODO metadata, favicon
  // TODO make new icon?
</script>
<main class="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
  <div class="bg-[url('/steam_fade.svg')] bg-contain bg-no-repeat bg-center flex flex-col justify-end text-center pt-60">
    <h1 class="_shadow text-white font-bold text-4xl">steam.exposed</h1>
    <span  class="_shadow">Breakdowns of Steam's Year in Reviews</span>
  </div>
  <div class="flex md:block flex-col gap-4 md:relative w-full max-w-lg">
    <input
      on:keypress={(e) => {
        if (e.key === 'Enter') submitInput();
      }}
      on:keydown={() => {
        if (inputErrored) inputErrored = false;
      }}
      bind:value={input}
      class="w-full px-4 py-2 md:pr-36 transition-all border border-neutral-600 hover:border-neutral-400 rounded bg-neutral-900 placeholder:text-neutral-600"
      placeholder="Steam ID, Custom URL, Share URL..."
      class:text-red-500={inputErrored}
    />
    <div class="flex md:absolute right-0 transition-all h-full top-0 bottom-0 gap-2 md:gap-0" use:clickOutside on:blur={() => showYearDropdown = false}>
      <div class="flex h-full relative w-full md:w-auto">
        <button
          on:click={() => showYearDropdown = !showYearDropdown}
          class="flex h-full w-full md:w-auto py-2 px-4 md:px-2 hover:text-white items-center justify-between rounded border md:border-none border-neutral-600 hover:border-neutral-400 bg-neutral-900 md:bg-transparent"
        >
          <span>{selectedYear}</span>
          <Icon icon={menuIcon} class="w-6 h-6" />
        </button>

        {#if showYearDropdown}
          <div class="absolute top-full w-full bg-neutral-800 rounded mt-2 z-20 flex flex-col overflow-hidden drop-shadow-md">
            {#each yearsAvailable as year}
              <button
                class="w-full py-2 px-4 md:px-2 transition-all hover:bg-neutral-700 flex items-center justify-between"
                on:click={() => {
                  selectedYear = year;
                  showYearDropdown = false;
                }}
              >
                <span>{year}</span>
                {#if selectedYear === year}
                  <Icon icon={checkIcon} class="w-6 h-6 md:w-4 md:h-4" />
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button
        class="hover:text-white transition-all h-[42px] px-4 py-2 rounded bg-neutral-900 md:bg-transparent border md:border-none border-neutral-600 hover:border-neutral-400"
        on:click={submitInput}
      >
        <Icon icon={sendIcon} class="w-5 h-5" />
      </button>
    </div>
    {#if inputErrored}
      <div class="text-sm text-red-500 md:absolute md:bottom-full md:mb-1">Couldn't do anything with that, try using URLs?</div>
    {/if}
  </div>
  <Footer inline />
</main>

<style lang="scss">
  ._shadow {
    filter: drop-shadow(0px 0px 2px black);
  }
</style>
