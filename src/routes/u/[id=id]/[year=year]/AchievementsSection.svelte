<script lang="ts">
	import type { AchievementData, AppInfo, SteamYearInReview } from '$lib/types';
	import BigStat from '$lib/components/BigStat.svelte';
	import { createEventDispatcher } from 'svelte';
	import Achievement from './Achievement.svelte';
	import { calcAchievements, getCalendarRange, perfectGameIcon, plural } from '$lib/util';
  import groupBy from 'just-group-by';
	import { autoPlacement, offset, shift } from 'svelte-floating-ui/dom';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { scale } from 'svelte/transition';
	import Portal from 'svelte-portal';
	import { tweened } from 'svelte/motion';
	import Icon from '@iconify/svelte';
	import GameAchievementDetail from './GameAchievementDetail.svelte';

	const dispatch = createEventDispatcher<{ select: number }>();

	export let apps: Record<number, AppInfo> = {};
	export let yearInReview: SteamYearInReview;
  export let achievements: AchievementData;

  // Dates
  const startDate = new Date(`Jan 1 ${yearInReview.stats.year}`).valueOf();
  const stopDate = new Date(`Dec 31 ${yearInReview.stats.year}`).valueOf();

  // Achievement stuff
  const allAchievements = Object.keys(achievements.unlocked)
    .reduce((p, _appid) => {
      const appid = parseInt(_appid, 10);
      const achs = achievements.unlocked[appid];
      if (!achs) return p;
      return [
        ...p,
        ...(Object.keys(achs).map((id) => ({
          appid,
          id,
          unlocked: achievements.unlocked[appid]?.[id] ?? 0
        })))
      ]
    }, [] as { appid: number; id: string; unlocked: number }[])
    .sort((a, b) => a.unlocked - b.unlocked);
  const completedGamesThisYear = Object.keys(achievements.unlocked).filter((appidStr) => {
    // What a mess
    const appid = parseInt(appidStr);
    const { completed } = calcAchievements(
      achievements, appid,
      allAchievements.filter((a) => a.appid === appid && a.unlocked !== 0 && a.unlocked >= (startDate / 1000) && a.unlocked < (stopDate / 1000))
    );
    return completed;
  });

  // Calendar stuff
  const months = yearInReview.stats.playtime_stats.months.map((m, i) => ({
    month: m.rtime_month,
    achievements: allAchievements.filter((ach) => ach.unlocked >= m.rtime_month && (yearInReview.stats.playtime_stats.months[i + 1]?.rtime_month ?? (stopDate / 1000)) > ach.unlocked).sort((a, b) => a.unlocked - b.unlocked)
  }));
  const days = getCalendarRange(new Date(`Jan 1 ${yearInReview.stats.year}`), new Date(`Dec 31 ${yearInReview.stats.year}`));
  const calendar = groupBy(days, (d) => d.getMonth());

  // Multiple DateTimeFormats...
	const dtf = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
    timeStyle: 'short'
	});
  const dayDtf = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'long'
  });
  const shortMonthDtf = new Intl.DateTimeFormat(undefined, {
    month: 'short'
  });
  const longMonthDtf = new Intl.DateTimeFormat(undefined, {
    month: 'long'
  });

  function getMonthColumn(month: number) {
    return (Math.round(days.indexOf(calendar[month].find((d) => d.getDay() === 0)!)) + calendar[0][0].getDay()) / 7;
  }

  let hoveredDay = {
    i: 0,
    achs: 0,
    games: 0
  };
  let selected: {
    type: 'day';
    date: Date;
    achs: { appid: number; id: string; unlocked: number }[]
  } | {
    type: 'month';
    date: Date;
    month: number;
    achs: { appid: number; id: string; unlocked: number }[]
  } | null = null;
  $: selectedGames = selected ? groupBy(selected.achs, (a) => a.appid) : {};

	const showTooltip = tweened(0);
	const [floatingRef, floatingContent] = createFloatingActions({
		strategy: 'absolute',
		placement: 'top',
		middleware: [
			offset(12),
			shift(),
			autoPlacement({
				allowedPlacements: ['top', 'bottom']
			})
		],
    autoUpdate: true
	});

  // Display Types
	let displayType = 0;
	const displayTypes = ['Games', 'Achievements'];
</script>

<div class="flex flex-col gap-8">
  <div class="flex gap-8 justify-around flex-wrap">
    <BigStat
      name="Achievements Earned"
    >
      {achievements.total.toLocaleString()}
    </BigStat>
    <BigStat
      name="Rare Achievements Earned"
      subtext={`(${(
        (achievements.totalRare / achievements.total) *
        100
      ).toFixed(2)}%)`}
    >
      {achievements.totalRare.toLocaleString()}
    </BigStat>
    <BigStat
      name="Games with Achievements"
      subtext={`(${(
        (achievements.gamesWithAchievements / yearInReview.stats.playtime_stats.game_summary.length) *
        100
      ).toFixed(2)}%)`}
    >
      {achievements.gamesWithAchievements.toLocaleString()}
    </BigStat>
    <BigStat
      name="Completed Games This Year"
    >
      {completedGamesThisYear.length.toLocaleString()}
    </BigStat>
  </div>
  <div class="grid grid-rows-7 w-fit gap-px max-w-full overflow-x-auto mx-auto pb-2 pt-6 relative select-none">
    <!-- Month names -->
    {#each Object.keys(calendar) as monthStr}
      {@const month = parseInt(monthStr, 10)}
      {@const monthName = shortMonthDtf.format(new Date(1e3 * (months[month].month + 86400)))}
      {@const active = selected?.type === 'month' && selected.month === month}
      <button
        class="absolute font-bold transition-all hover:underline decoration-blue-400"
        class:text-blue-400={active}
        class:text-white={!active}
        style:left={`${getMonthColumn(month) * 17}px`}
        on:click={() => selected = { type: 'month', month, date: calendar[month][0], achs: months[month].achievements }}
      >
        {monthName}
      </button>
    {/each}

    <!-- Hover reference -->
    <div
      class="absolute w-4 h-4 pointer-events-none transition-all"
      style:top={`${(days[hoveredDay.i].getDay() * 17) + 24}px`}
      style:left={`${(Math.floor((hoveredDay.i + days[0].getDay()) / 7) * 17)}px`}
      use:floatingRef
    />

    <!-- Date cells -->
    {#each days as date, i}
      {@const column = Math.floor((i + days[0].getDay()) / 7) + 1}
      {@const achs = allAchievements.filter((a) => date.valueOf() <= a.unlocked * 1000 && (date.valueOf() + 86400000) > a.unlocked * 1000)}
      {@const games = Object.keys(groupBy(achs, (a) => a.appid)).length }
      {@const plus = achs.length > 50}
      {@const active = selected ? selected.type === 'month' ? selected.month === date.getMonth() : selected.date === date : false}
      <button
        class="_cell"
        style:grid-row={date.getDay() + 1}
        style:grid-column={column}
        class:_empty={achs.length === 0}
        class:_plus={plus}
        class:_active={active}
        on:mouseenter={() => {
          hoveredDay = { i, achs: achs.length, games };
          showTooltip.set(1, { duration: 0 });
        }}
        on:mouseleave={() => {
          if (hoveredDay.i === i) showTooltip.set(0, { duration: 250 });
        }}
        on:click={() => selected = { type: 'day', date, achs }}
      >
        {plus ? '+' : (achs.length || '')}
      </button>
    {/each}
  </div>
  {#if !achievements.complete}
    <div class="flex gap-2 md:items-center flex-col md:flex-row px-4 py-2 rounded bg-red-900/50 text-red-100">
      <span>Some games failed to load, so this data may be incomplete, check back later.</span>
    </div>
  {/if}
  {#if selected}
    <div class="flex flex-col gap-8">
      <div class="flex gap-2 md:items-center flex-col md:flex-row px-4 py-2 rounded bg-neutral-900">
        <span>Display</span>
        <div class="flex gap-2 items-center flex-wrap">
          {#each displayTypes as tab, i}
            <button
              class="_tab self-stretch w-fit"
              class:--active={displayType === i}
              on:click={() => (displayType = i)}
            >
              {tab}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <h3 class="font-bold text-white text-2xl">{(selected.type === 'month' ? longMonthDtf : dayDtf).format(selected.date)}</h3>
        <span>{plural(selected.achs.length, 'achievement')} over {plural(Object.keys(selectedGames).length, 'game')}</span>
      </div>

      {#if displayType === 1}
        <div class="flex gap-2 flex-wrap">
          {#each selected.achs as ach (`${selected.date}:${ach.appid}:${ach.id}`)}
            {@const achievement = achievements.games[ach.appid]?.find((a) => a.id === ach.id)}
            {#if achievement}
              <Achievement
                {achievement}
                gameName={apps[ach.appid]?.name}
                unlockedAt={achievements.unlocked[ach.appid]?.[ach.id] ?? 0}
                {dtf} {dayDtf}
                on:click={() => dispatch('select', ach.appid)}
              />
            {/if}
          {/each}
        </div>
      {:else}
        {#each Object.keys(selectedGames) as appidStr (`${selected.date}:${appidStr}`)}
          {@const appid = parseInt(appidStr, 10)}
          {@const { achTotal, achEarned, achEarnedBefore, earnedPercent, completed } = calcAchievements(achievements, appid, selectedGames[appid])}

          <div class="flex flex-col gap-2">
            <div class="flex gap-4 items-center flex-none flex-col sm:flex-row">
              <button
                class="rounded sm:w-[184px] w-full aspect-[184/69] relative bg-neutral-800 transition-transform hover:scale-105 active:scale-95"
                on:click={() => dispatch('select', appid)}
              >
                <img
                  class="rounded w-full h-full object-cover"
                  src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_231x87.jpg`}
                  alt={apps[appid]?.name || `App ${appid}`}
                />
                {#if completed}
                  <Icon icon={perfectGameIcon} class="absolute -bottom-5 -left-5 w-10 h-10 pointer-events-none" />
                {/if}
              </button>
              <div class="flex flex-col flex-1 w-full">
                <h5 class="text-white text-xl font-bold">{apps[appid]?.name || `App ${appid}`}</h5>
                <GameAchievementDetail
                  achAmount={selectedGames[appid].length}
                  {achTotal} {achEarned} {achEarnedBefore} {completed} {earnedPercent}
                />
              </div>
            </div>
            {#if selectedGames[appid].length > 0}
              <div class="flex gap-2 flex-wrap">
                {#each selectedGames[appid] as ach (`gamerow-${selected.date}:${ach.appid}:${ach.id}`)}
                  {@const achievement = achievements.games[ach.appid]?.find((a) => a.id === ach.id)}
                  {#if achievement}
                    <Achievement
                      {achievement}
                      gameName={apps[ach.appid]?.name}
                      unlockedAt={achievements.unlocked[ach.appid]?.[ach.id] ?? 0}
                      {dtf} {dayDtf}
                      on:click={() => dispatch('select', ach.appid)}
                    />
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="flex flex-col gap-2 justify-center items-center text-neutral-400 italic">
                <span>No achievements...</span>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    <div class="flex flex-col gap-2 justify-center items-center text-neutral-400 italic">
      <span>Click on a day or month for more information.</span>
    </div>
  {/if}
</div>

{#if $showTooltip !== 0}
	<Portal target="body">
		<div
			class="sm:max-w-lg max-w-[90svw] text-sm md:text-base z-20 text-center absolute px-2 md:px-4 py-2 bg-neutral-950 border-2 border-black/25 text-white bg-opacity-90 rounded shadow-[0_0_5px_2px_rgba(0,0,0,.75)] backdrop-blur-md flex-col justify-center items-center inline-flex gap-1 select-none pointer-events-none"
			transition:scale={{ duration: 250, start: 0.9 }}
			use:floatingContent
		>
      <h5 class="leading-4 flex gap-1 font-bold">
        {dayDtf.format(days[hoveredDay.i])}
      </h5>
      <span class="text-neutral-400">
        {plural(hoveredDay.achs, 'achievement')} over {plural(hoveredDay.games, 'game')}
      </span>
		</div>
	</Portal>
{/if}

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

  ._cell {
    @apply text-xs w-3 h-3 m-0.5 rounded-sm ring-1 ring-neutral-800 text-neutral-300 flex justify-center items-center whitespace-nowrap transition-all;

    &:hover {
      @apply ring-neutral-600 text-neutral-100 font-bold w-4 h-4 m-0;
    }

    &._plus {
      @apply text-indigo-500 font-extrabold;
    }

    &._empty {
      @apply ring-neutral-900 pointer-events-none;
    }

    &._active {
      @apply w-4 h-4 m-0 ring-neutral-200 font-bold text-black bg-neutral-100;

      &._plus {
        @apply text-indigo-500;
      }
    }
  }
</style>
