<script lang="ts">
	import type { SteamYearInReview } from "$lib/types";
	import { calculateBarGraph } from "$lib/util";
	import prettyMilliseconds from "pretty-ms";

  export let yearInReview: SteamYearInReview;
  export let appId: number;

  const game = yearInReview.stats.playtime_stats.game_summary.find((g) => g.appid === appId)!;
  const moreInfo = yearInReview.stats.playtime_stats.games.find((g) => g.appid === appId);
  const totalStats = yearInReview.stats.playtime_stats.total_stats;
  const playtimeSeconds = moreInfo ? moreInfo.stats.total_playtime_seconds : totalStats.total_playtime_seconds * (game.total_playtime_percentagex100 / 10000);

  const longDtf = new Intl.DateTimeFormat(undefined, { month: 'long' });
  const shortDtf = new Intl.DateTimeFormat(undefined, { month: 'short' });

  const data = yearInReview.stats.playtime_stats.months.map((m) => ({
    month: m.rtime_month,
    value: (m.game_summary.find((g) => g.appid === appId)?.total_playtime_percentagex100 ?? 0) / game.total_playtime_percentagex100
  }));
  const { topPercentage, ySteps } = calculateBarGraph(data);

  let selectedMonthIndex = -1;
</script>

<div class="flex flex-col gap-4">
  <h3 class="text-3xl font-extrabold text-white mb-2">Playtime Breakdown</h3>
  <div class={`rounded-md px-4 py-2 transition-colors ${selectedMonthIndex === -1 ? 'bg-black/50' : 'bg-neutral-700'}`}>
    {#if selectedMonthIndex === -1}
      Hover over a month column for more information.
    {:else}
      {@const month = yearInReview.stats.playtime_stats.months[selectedMonthIndex]}
      {@const date = new Date(1e3 * (month.rtime_month + 86400))}
      <b class="text-white">{longDtf.format(date)}:</b>
      {#if data[selectedMonthIndex].value}
        {(data[selectedMonthIndex].value * 100).toFixed(2)}% of total game playtime, ~{prettyMilliseconds(playtimeSeconds * data[selectedMonthIndex].value * 1000)}
      {:else}
        <i class="text-neutral-400">No playtime this month</i>
      {/if}
    {/if}
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="h-60 relative flex-none flex pt-5 gap-[1px] md:gap-0.5 text-xs text-neutral-400" on:mouseleave={() => selectedMonthIndex = -1}>
    <div class="flex flex-col justify-between pb-5 pr-1 items-end tracking-[-0.1em]">
      {#each ySteps as step}
        <div class="w-5">
          <span class="absolute -mt-4">{step}%</span>
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
      <div class="flex flex-col w-full justify-end">
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <div class="flex flex-col w-full h-full relative justify-end rounded hover:bg-neutral-500/25 group" on:mouseover={() => selectedMonthIndex = i}>
          <div class="bg-green-500 group-hover:bg-green-400 w-full rounded relative" style:height={`${m.value * 100 * (1 / (topPercentage / 100))}%`}>
            {#if m.value}
              <span class="absolute w-full text-center text-neutral-200 group-hover:text-white -top-4 hidden md:block">{(m.value * 100).toFixed(2)}%</span>
            {/if}
          </div>
        </div>
        <span class="w-full text-center h-5 pt-1 tracking-tighter whitespace-nowrap">
          <span class="md:block hidden">{longDtf.format(date)}</span>
          <span class="md:hidden block">{shortDtf.format(date)}</span>
        </span>
      </div>
    {/each}
  </div>
</div>
