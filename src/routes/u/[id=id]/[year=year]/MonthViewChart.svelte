<script lang="ts">
	import type { SteamYearInReview } from "$lib/types";
	import { calculateBarGraph, getGameAsset } from "$lib/util";
	import { createEventDispatcher } from "svelte";

  export let apps: Record<number, string> = {};
  export let yearInReview: SteamYearInReview;
  export let data: {
    month: number;
    value: number;
  }[];
  export let chartType = 0;
  export let selectedIndex = -1;
  export let canvasFix = false;
  export let useInt = false;

  const gameColorClasses = ['bg-gray-800 group-hover:bg-gray-700', 'bg-gray-700 group-hover:bg-gray-600', 'bg-gray-600 group-hover:bg-gray-500'];
  const { topPercentage, ySteps } = calculateBarGraph(data, 4, 5);
  $: console.log({ topPercentage, ySteps })

  const longDtf = new Intl.DateTimeFormat(undefined, { month: 'long' });
  const shortDtf = new Intl.DateTimeFormat(undefined, { month: 'short' });
	const dispatch = createEventDispatcher<{ select: number }>();
</script>

<div class="h-60 relative flex-none flex pt-5 gap-[1px] md:gap-0.5 text-xs text-neutral-400" class:leading-[0]={canvasFix}>
  <div class="flex flex-col justify-between pb-5 pr-1 items-end tracking-[-0.1em]">
    {#each ySteps as step}
      <div class="w-5">
        <span class="absolute -mt-4">{useInt ? Math.round(step / 100) : `${Math.round(step)}%`}</span>
        <hr class="border-t border-neutral-500 border-dashed h-[1px] w-full absolute" />
      </div>
    {/each}
    <div class="w-5">
      <span class="absolute -mt-4">0{!useInt ? '%' : ''}</span>
      <hr class="border-t border-neutral-500 h-[1px] w-full absolute" />
    </div>
  </div>
  {#each data as m, i}
    {@const date = new Date(1e3 * (m.month + 86400))}
    {@const month = yearInReview.stats.playtime_stats.months[i]}
    <div class="flex flex-col w-full justify-end">
      <button
        class={`flex flex-col w-full h-full relative justify-end rounded ${selectedIndex === i ? 'bg-neutral-500/50' : 'hover:bg-neutral-500/25'} group`}
        on:click={() => dispatch('select', i)}
      >
        <div class="bg-gray-500 group-hover:bg-gray-400 w-full rounded relative" style:height={`${m.value * 100 * (1 / (topPercentage / 100))}%`}>
          {#if m.value}
            <span class="absolute w-full text-center text-neutral-200 group-hover:text-white -top-4 hidden md:block">
              {useInt ? m.value : `${(m.value * 100).toFixed(2)}%`}
            </span>

            <div class="absolute flex flex-col w-full top-0 bottom-0 overflow-hidden rounded" class:hidden={chartType !== 0}>
              {#each month.game_summary.slice(0, 3) as game, i (`${game.appid}:${m.month}`)}
                <div class={`relative overflow-hidden ${gameColorClasses[i]}`} style:height={`${game.relative_playtime_percentagex100 / 100}%`}>
                  {#await getGameAsset(game.appid, ['libraryCover', 'portrait']) then asset}
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
      <span class="w-full text-center h-5 pt-1 tracking-tighter whitespace-nowrap" class:text-white={selectedIndex === i} class:font-bold={selectedIndex === i}>
        <span class="md:block hidden">{longDtf.format(date)}</span>
        <span class="md:hidden block">{shortDtf.format(date)}</span>
      </span>
    </div>
  {/each}
</div>
