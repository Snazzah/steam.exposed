<script lang="ts">
	import type { PlaytimeStatsGameSummary, SteamYearInReview } from "$lib/types";
	import { clickOutside } from "$lib/actions";
	import Portal from "svelte-portal";
	import GameGridChild from "./GameGridChild.svelte";
	import { fade, fly } from "svelte/transition";
	import GameModal from "./GameModal.svelte";
	import prettyMilliseconds from "pretty-ms";
	import Icon from "@iconify/svelte";
  import menuIcon from '@iconify-icons/mdi/menu-down';
  import checkIcon from '@iconify-icons/mdi/check';
  import filterIcon from '@iconify-icons/mdi/filter-outline';
  import filterUsedIcon from '@iconify-icons/mdi/filter';
  import windowsIcon from '@iconify-icons/mdi/windows';
  import macIcon from '@iconify-icons/mdi/apple';
  import linuxIcon from '@iconify-icons/mdi/linux';
  import steamDeckIcon from '@iconify-icons/simple-icons/steamdeck';
  import vrIcon from '@iconify-icons/mdi/virtual-reality';
	import { writable } from "svelte/store";
	import ThreeWaySwitch from "$lib/components/ThreeWaySwitch.svelte";

  interface SortInformation {
    playtime: number; playtimeEstimated: boolean; rank: number;
  }

  export let apps: Record<number, string> = {};
  export let yearInReview: SteamYearInReview;
  let totalStats = yearInReview.stats.playtime_stats.total_stats;
  let sortType = 0;
  const dtf = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });
  let gameSortInfo = (() => {
    const result: Record<number, SortInformation> = {};

    for (const i in yearInReview.stats.playtime_stats.game_summary) {
      const game = yearInReview.stats.playtime_stats.game_summary[i]
      const moreInfo = yearInReview.stats.playtime_stats.games.find((g) => g.appid === game.appid);
      result[game.appid] = {
        playtime: moreInfo ? moreInfo.stats.total_playtime_seconds : (totalStats.total_playtime_seconds * (game.total_playtime_percentagex100 / 10000)),
        playtimeEstimated: !moreInfo,
        rank: Number(i) + 1
      }
    }

    return result;
  })();
  function formatSortInfo(game: PlaytimeStatsGameSummary, info: SortInformation) {
    switch (sortType) {
      case 0: return `#${info.rank}`;
      case 1: return (info.playtimeEstimated ? '~' : '') + prettyMilliseconds(info.playtime * 1000);
      case 2: return `${game.total_sessions} Session${game.total_sessions === 1 ? '' : 's'}`;
      case 3: return game.rtime_release_date ? dtf.format(game.rtime_release_date * 1000) : '';
      case 4: return game.rtime_first_played_lifetime ? dtf.format(game.rtime_first_played_lifetime * 1000) : '';
    }
  }

  let showSortDropdown = false;
  const sortNames = [
    'Rank',
    'Playtime',
    'Sessions',
    'Release Date',
    'First Played'
  ];
  let filterPrompt: HTMLDivElement;
  let showFilterPopout = false;
  const defaultFilters: {
    platforms: Record<string, boolean>,
    controller: -1 | 0 | 1,
    unknown: -1 | 0 | 1,
    demo: -1 | 0 | 1,
    playtest: -1 | 0 | 1,
  } = {
    platforms: {
      windows: true,
      mac: true,
      linux: true,
      vr: true,
      deck: true
    },
    controller: 0,
    unknown: 0,
    demo: 0,
    playtest: 0
  }
  let filters = writable(defaultFilters);
  // TODO bruh
  $: filtersApplied = JSON.stringify(defaultFilters) !== JSON.stringify($filters);
  function clearFilters() {
    filters.set(defaultFilters);
  }


  $: games = sortGames(sortType, $filters);
  function sortGames(sortType: number, filters: typeof defaultFilters) {
    let sortFn: ((a: PlaytimeStatsGameSummary, b: PlaytimeStatsGameSummary) => number) | null = null;

    switch (sortType) {
      case 1: {
        sortFn = (a, b) => gameSortInfo[b.appid].playtime - gameSortInfo[a.appid].playtime;
        break;
      }
      case 2: {
        sortFn = (a, b) => b.total_sessions - a.total_sessions;
        break;
      }
      case 3: {
        sortFn = (a, b) => (b.rtime_release_date || 0) - (a.rtime_release_date || 0);
        break;
      }
      case 4: {
        sortFn = (a, b) => (b.rtime_first_played_lifetime || 0) - (a.rtime_first_played_lifetime || 0);
        break;
      }
    }

    const games = [...yearInReview.stats.playtime_stats.game_summary];
    if (sortFn) games.sort(sortFn);

    return games.filter((game) => {
      const platformFilter = (filters.platforms.windows && game.played_windows)
        || (filters.platforms.mac && game.played_mac)
        || (filters.platforms.linux && game.played_linux)
        || (filters.platforms.vr && game.played_vr)
        || (filters.platforms.deck && game.played_deck);
      if (!platformFilter) return false;

      const controllerFilter = filters.controller === 1 ? game.played_controller : filters.controller === -1 ? !game.played_controller : true;
      if (!controllerFilter) return false;

      const demoFilter = filters.demo === 1 ? game.demo : filters.demo === -1 ? !game.demo : true;
      if (!demoFilter) return false;

      const playtestFilter = filters.playtest === 1 ? game.playtest : filters.playtest === -1 ? !game.playtest : true;
      if (!playtestFilter) return false;

      const unknownFilter = filters.unknown === 1 ? !apps[game.appid] : filters.unknown === -1 ? !!apps[game.appid] : true;
      if (!unknownFilter) return false;

      return true;
    });
  }

  let selectedApp: number | null = null;
  function onModalClick (this: any, e: any) {
    if (e.target === this) selectedApp = null;
  }

  // TODO working search
</script>

<div class="flex flex-col md:flex-row gap-2 md:gap-8 w-full justify-between">
  <div class="relative flex-grow">
    <span class="absolute bottom-full md:top-full my-1 text-sm">
      {games.length.toLocaleString()} games
      {#if games.length !== yearInReview.stats.playtime_stats.game_summary.length}
        <span class="text-neutral-500">(out of {yearInReview.stats.playtime_stats.game_summary.length.toLocaleString()})</span>
      {/if}
    </span>
    <input class="w-full px-4 py-2 transition-all border border-neutral-600 hover:border-neutral-400 rounded bg-neutral-900 placeholder:text-neutral-600" placeholder="Search..." />
  </div>
  <div class="flex items-center justify-center gap-2 relative">
    <span class="flex-none">Sort by</span>
    <div class="w-60 flex-grow relative" use:clickOutside on:blur={() => showSortDropdown = false}>
      <button
        on:click={() => showSortDropdown = !showSortDropdown}
        class="w-full px-4 py-2 transition-all border border-neutral-600 hover:border-neutral-400 bg-neutral-900 rounded flex items-center justify-between"
        class:border-neutral-300={showSortDropdown}
      >
        <span>{sortNames[sortType]}</span>
        <Icon icon={menuIcon} class="w-6 h-6" />
      </button>
      {#if showSortDropdown}
        <div class="absolute top-full w-full bg-neutral-800 rounded mt-2 z-20 flex flex-col overflow-hidden drop-shadow-md">
          {#each sortNames as sortName, i}
            <button
              class="w-full px-4 py-2 transition-all hover:bg-neutral-700 flex items-center justify-between"
              on:click={() => {
                sortType = i;
                showSortDropdown = false;
              }}
            >
              <span>{sortName}</span>
              {#if sortType === i}
                <Icon icon={checkIcon} class="w-6 h-6" />
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <div use:clickOutside={{ ignore: filterPrompt }} on:blur={() => showFilterPopout = false}>
      <button
        on:click={() => showFilterPopout = !showFilterPopout}
        class="p-2 transition-all border border-neutral-600 hover:border-neutral-400 rounded flex items-center justify-center"
        class:border-neutral-300={showFilterPopout}
        class:bg-neutral-800={filtersApplied}
        class:bg-neutral-900={!filtersApplied}
      >
        <Icon icon={filtersApplied ? filterUsedIcon : filterIcon} class="w-6 h-6" />
      </button>
    </div>
    {#if showFilterPopout}
      {@const platformTypes = [
        { icon: windowsIcon, name: 'windows' },
        { icon: macIcon, name: 'mac' },
        { icon: linuxIcon, name: 'linux' },
        { icon: steamDeckIcon, name: 'deck' },
        { icon: vrIcon, name: 'vr' }
      ]}
      <div
        class="absolute top-full w-full p-4 gap-4 drop-shadow-md bg-neutral-800 rounded mt-2 z-20 flex flex-col overflow-hidden select-none"
        bind:this={filterPrompt}
      >
        <div class="flex flex-col gap-2">
          <span>Filter by platform played</span>
          <div class="flex gap-2">
            {#each platformTypes as platform}
              <button
                class={`p-2 rounded transition-all w-full flex items-center justify-center ${$filters.platforms[platform.name] ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-900 text-neutral-600'}`}
                on:click={() => filters.update((f) => ({ ...f, platforms: { ...f.platforms, [platform.name]: !f.platforms[platform.name] } }))}
              >
                <Icon icon={platform.icon} class="w-6 h-6" />
              </button>
            {/each}
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span>Played with Controller</span>
            <ThreeWaySwitch
              value={$filters.controller}
              on:update={(value) => filters.update((f) => ({ ...f, controller: value.detail }))}
            />
          </div>
          <div class="flex items-center justify-between">
            <span>Demos</span>
            <ThreeWaySwitch
              value={$filters.demo}
              on:update={(value) => filters.update((f) => ({ ...f, demo: value.detail }))}
            />
          </div>
          <div class="flex items-center justify-between">
            <span>Playtests</span>
            <ThreeWaySwitch
              value={$filters.playtest}
              on:update={(value) => filters.update((f) => ({ ...f, playtest: value.detail }))}
            />
          </div>
          <div class="flex items-center justify-between">
            <span>Unknown Apps <span class="text-sm opacity-50" title="Apps that could not be fetched information from.">(?)</span></span>
            <ThreeWaySwitch
              value={$filters.unknown}
              on:update={(value) => filters.update((f) => ({ ...f, unknown: value.detail }))}
            />
          </div>
        </div>
        <button
          class="hover:underline font-bold px-2 py-1 hover:bg-neutral-600 rounded"
          on:click={clearFilters}
        >
          Clear filters
        </button>
      </div>
    {/if}
  </div>
</div>

<div class="flex flex-wrap gap-4 justify-around">
  {#each games as game (game.appid)}
    {@const sortInfo = gameSortInfo[game.appid]}
    <GameGridChild
      name={apps[game.appid]}
      {game}
      on:click={() => selectedApp = game.appid}
      footer={formatSortInfo(game, sortInfo)}
    />
  {/each}
  {#if games.length === 0}
    <div class="w-full text-center italic text-neutral-600 py-10">No games found with the filters provided.</div>
  {/if}
</div>

{#if selectedApp !== null}
  <Portal target="body">
    <div
      transition:fade={{ duration: 100 }}
      class="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-25 backdrop-blur-sm select-none flex items-end md:items-center justify-center md:px-8 z-30"
      aria-hidden="true"
      on:click={onModalClick}
    >
      <div
        transition:fly={{ duration: 250 , y: 32 }}
        class="w-[1024px] max-h-[calc(100vh-6rem)] relative text-neutral-200 bg-neutral-900 rounded-t md:rounded-b shadow-lg flex-col justify-start items-start inline-flex overflow-hidden"
      >
        <GameModal appId={selectedApp} {apps} {yearInReview} />
      </div>
    </div>
  </Portal>
{/if}
