<script lang="ts">
  import prettyMilliseconds from 'pretty-ms';
	import type { SteamYearInReview } from "$lib/types";
	import BigStat from '$lib/components/BigStat.svelte';

  export let yearInReview: SteamYearInReview;
  let totalStats = yearInReview.stats.playtime_stats.total_stats;
  let summaryStats = yearInReview.stats.playtime_stats.summary_stats;
</script>

<div class="flex gap-8 justify-around flex-wrap">
  <BigStat name="Total Playtime" subtext={`(${((totalStats.total_playtime_seconds / 31536000) * 100).toFixed(2)}% of an entire year)`}>
    {prettyMilliseconds(totalStats.total_playtime_seconds * 1000)}
  </BigStat>
  <BigStat name="Sessions">
    {totalStats.total_sessions.toLocaleString()}
  </BigStat>
  <BigStat name="Achievements Earned" subtext={`(${summaryStats.total_rare_achievements.toLocaleString()} rare achievements, ${((summaryStats.total_rare_achievements / summaryStats.total_achievements) * 100).toFixed(2)}%)`}>
    {summaryStats.total_achievements.toLocaleString()}
  </BigStat>
</div>
