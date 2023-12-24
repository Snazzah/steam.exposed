<script lang="ts">
  import prettyMilliseconds from 'pretty-ms';
	import type { SteamYearInReview } from "$lib/types";
	import BigStat from '../../../../lib/components/BigStat.svelte';

  export let yearInReview: SteamYearInReview;
  let totalStats = yearInReview.stats.playtime_stats.total_stats;
  let games = yearInReview.stats.playtime_stats.game_summary;
</script>

<div class="flex gap-8 justify-around flex-wrap">
  <BigStat name="Total Playtime">
    {prettyMilliseconds(totalStats.total_playtime_seconds * 1000)}
  </BigStat>
  <BigStat name="Sessions">
    {totalStats.total_sessions.toLocaleString()}
  </BigStat>
  <BigStat name="Games Played">
    {games.filter((g) => !g.demo && !g.playtest).length.toLocaleString()}
  </BigStat>
  <BigStat name="New Games Played">
    {games.filter((g) => !g.demo && !g.playtest && g.new_this_year).length.toLocaleString()}
  </BigStat>
  <BigStat name="Demos Played">
    {games.filter((g) => g.demo).length.toLocaleString()}
  </BigStat>
  <BigStat name="Playtests Played">
    {games.filter((g) => g.playtest).length.toLocaleString()}
  </BigStat>
</div>
