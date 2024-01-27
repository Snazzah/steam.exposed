<script lang="ts">
	import type { SteamYearInReview } from "$lib/types";
	import BigStat from '$lib/components/BigStat.svelte';
	import GameGridChild from "./GameGridChild.svelte";
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ select: number }>();

  export let apps: Record<number, string> = {};
  export let yearInReview: SteamYearInReview;
  let playtimeStreak = yearInReview.stats.playtime_stats.playtime_streak;

  const dtf = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
</script>

<div class="flex flex-col gap-8">
  <BigStat name="Longest Playtime Streak">
    {playtimeStreak.longest_consecutive_days} Days
  </BigStat>
  <div class="flex justify-between pt-2 border-t-2 border-dashed font-bold">
    <span>{dtf.format(playtimeStreak.rtime_start * 1000)}</span>
    <span>{dtf.format((playtimeStreak.rtime_start + (playtimeStreak.longest_consecutive_days * 60 * 60 * 24)) * 1000)}</span>
  </div>
  <div class="flex flex-wrap gap-4 justify-around">
    {#each playtimeStreak.streak_games as streakGame (streakGame.appid)}
      {@const game = yearInReview.stats.playtime_stats.game_summary.find((g) => g.appid === streakGame.appid)}
      {#if game}
        <GameGridChild
          name={apps[streakGame.appid]}
          on:click={() => dispatch('select', streakGame.appid)}
          {game}
        />
      {/if}
    {/each}
  </div>
</div>
