<script lang="ts">
	import type { SteamYearInReview } from "$lib/types";
	import BigStat from '$lib/components/BigStat.svelte';
	import GameGridChild from "./GameGridChild.svelte";
	import { createEventDispatcher } from 'svelte';
	import { calculateBarGraph, getGameAsset } from "$lib/util";
	import prettyMilliseconds from "pretty-ms";
	import PlatformSection from "./PlatformSection.svelte";

	const dispatch = createEventDispatcher<{ select: number }>();

  export let apps: Record<number, string> = {};
  export let yearInReview: SteamYearInReview;

  const data = yearInReview.stats.playtime_stats.months.map((m) => ({
    month: m.rtime_month,
    value: m.stats.total_playtime_percentagex100 / 10000
  }));
  const { topPercentage, ySteps } = calculateBarGraph(data, 4, 5);

  const longDtf = new Intl.DateTimeFormat(undefined, { month: 'long' });
  const shortDtf = new Intl.DateTimeFormat(undefined, { month: 'short' });

  const gameColorClasses = ['bg-gray-800 group-hover:bg-gray-700', 'bg-gray-700 group-hover:bg-gray-600', 'bg-gray-600 group-hover:bg-gray-500'];
  let selectedMonthIndex = -1;
  let chartType = 0;
  let chartTypes = [
    'Top Games',
    'Platform'
  ];
</script>

<div class="flex flex-col gap-8">
  <div class="flex gap-2 items-center px-4 py-2 rounded bg-neutral-900">
    <span>Display</span>
    {#each chartTypes as tab, i}
      <button
        class="_tab self-stretch w-fit"
        class:--active={chartType === i}
        on:click={() => chartType = i}
      >
        {tab}
      </button>
    {/each}
  </div>
  <div class="h-60 relative flex-none flex pt-5 gap-[1px] md:gap-0.5 text-xs text-neutral-400">
    <div class="flex flex-col justify-between pb-5 pr-1 items-end tracking-[-0.1em]">
      {#each ySteps as step}
        <div class="w-5">
          <span class="absolute -mt-4">{Math.round(step)}%</span>
          <hr class="border-t border-neutral-500 border-dashed h-[1px] w-full absolute" />
        </div>
      {/each}
      <div class="w-5">
        <span class="absolute -mt-4">0%</span>
        <hr class="border-t border-neutral-500 h-[1px] w-full absolute" />
      </div>
    </div>
    {#each data as m, i}
      {@const date = new Date(1e3 * (m.month + 86400))}
      {@const month = yearInReview.stats.playtime_stats.months[i]}
      <div class="flex flex-col w-full justify-end">
        <button
          class={`flex flex-col w-full h-full relative justify-end rounded ${selectedMonthIndex === i ? 'bg-neutral-500/50' : 'hover:bg-neutral-500/25'} group`}
          on:click={() => selectedMonthIndex = i}
        >
          <div class="bg-gray-500 group-hover:bg-gray-400 w-full rounded relative" style:height={`${m.value * 100 * (1 / (topPercentage / 100))}%`}>
            {#if m.value}
              <span class="absolute w-full text-center text-neutral-200 group-hover:text-white -top-4 hidden md:block">{(m.value * 100).toFixed(2)}%</span>

              <div class="absolute flex flex-col w-full top-0 bottom-0 overflow-hidden rounded" class:hidden={chartType !== 0}>
                {#each month.game_summary.slice(0, 3) as game, i (`${game.appid}:${m.month}`)}
                  <div class={`relative overflow-hidden ${gameColorClasses[i]}`} style:height={`${game.relative_playtime_percentagex100 / 100}%`}>
                    {#await getGameAsset(game.appid, ['libraryHero', 'libraryCover', 'portrait']) then asset}
                      {#if asset}
                        <img class="w-full h-full object-cover group-hover:brightness-110" src={asset} alt={apps[game.appid] || `App ${game.appid}`} />
                      {/if}
                    {/await}
                  </div>
                {/each}
              </div>

              <div class="absolute flex flex-col w-full top-0 bottom-0 overflow-hidden rounded" class:hidden={chartType !== 1}>
                <div class="group-hover:brightness-110" style:background-color='#d67070' style:height={`${month.relative_monthly_stats.windows_playtime_percentagex100 / 100}%`} />
                <div class="group-hover:brightness-110" style:background-color='#46ab46' style:height={`${month.relative_monthly_stats.macos_playtime_percentagex100 / 100}%`} />
                <div class="group-hover:brightness-110" style:background-color='#683db4' style:height={`${month.relative_monthly_stats.linux_playtime_percentagex100 / 100}%`} />
                <div class="group-hover:brightness-110" style:background-color='#3898b0' style:height={`${month.relative_monthly_stats.deck_playtime_percentagex100 / 100}%`} />
                <div class="group-hover:brightness-110" style:background-color='#c7b84e' style:height={`${month.relative_monthly_stats.vr_playtime_percentagex100 / 100}%`} />
              </div>
            {/if}
          </div>
        </button>
        <span class="w-full text-center h-5 pt-1 tracking-tighter whitespace-nowrap" class:text-white={selectedMonthIndex === i} class:font-bold={selectedMonthIndex === i}>
          <span class="md:block hidden">{longDtf.format(date)}</span>
          <span class="md:hidden block">{shortDtf.format(date)}</span>
        </span>
      </div>
    {/each}
  </div>

  {#if selectedMonthIndex === -1}
    <div class="rounded-md px-4 py-2 transition-colors bg-black/50">
      Click a month column for more information.
    </div>
  {/if}

  {#each Object.keys(yearInReview.stats.playtime_stats.months) as i}
    {@const month = yearInReview.stats.playtime_stats.months[selectedMonthIndex]}
    {#if selectedMonthIndex === Number(i) && data[selectedMonthIndex].value}
      {@const date = new Date(1e3 * (month.rtime_month + 86400))}
      <div class="flex gap-8 justify-around flex-wrap">
        <BigStat name={`Playtime in ${longDtf.format(date)}`} subtext={`(${(data[selectedMonthIndex].value * 100).toFixed(2)}% of total game playtime)`}>
          {prettyMilliseconds(month.stats.total_playtime_seconds * 1000)}
        </BigStat>
        <BigStat name="Sessions">
          {month.stats.total_sessions.toLocaleString()}
        </BigStat>
        <BigStat name="Games Played">
          {month.game_summary.length.toLocaleString()}
        </BigStat>
      </div>
      <PlatformSection {yearInReview} stats={month.relative_monthly_stats} excludeGames />
      <div class="flex flex-col gap-8">
        <h3 class="text-3xl font-extrabold text-white mb-2">Games</h3>
        <div class="flex flex-wrap gap-4 justify-around">
          {#each month.game_summary as monthGame (monthGame.appid)}
            {@const game = yearInReview.stats.playtime_stats.game_summary.find((g) => g.appid === monthGame.appid)}
            {#if game}
              {@const playtimeSeconds = month.stats.total_playtime_seconds * (monthGame.relative_playtime_percentagex100 / 10000)}
              <GameGridChild
                name={apps[monthGame.appid]}
                on:click={() => dispatch('select', monthGame.appid)}
                {game}
                footer={`~${prettyMilliseconds(playtimeSeconds * 1000)}`}
              />
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  ._tab {
    @apply px-4 py-1 rounded-md bg-neutral-800 transition-all;

    &:hover {
      @apply bg-neutral-700;
    }

    &:active {
      @apply scale-95;
    }

    &.--active {
      @apply bg-neutral-600 text-white;
    }
  }
</style>
