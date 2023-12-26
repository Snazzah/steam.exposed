<script lang="ts">
  import prettyMilliseconds from 'pretty-ms';
	import type { SteamYearInReview } from "$lib/types";
	import BigStat from '../../../../lib/components/BigStat.svelte';
	import PercentChart from './PercentChart.svelte';

  export let yearInReview: SteamYearInReview;
  let totalStats = yearInReview.stats.playtime_stats.total_stats;
  let games = yearInReview.stats.playtime_stats.game_summary;

  function getPlaytime(type: 'vr' | 'deck' | 'controller' | 'linux' | 'macos' | 'windows') {
    const percent = totalStats[`${type}_playtime_percentagex100`] / 10000;
    return totalStats.total_playtime_seconds * percent;
  }

  let platforms = [
    {
      name: 'Windows',
      percent: totalStats.windows_playtime_percentagex100 / 100,
      playtime: getPlaytime('windows'),
      sessions: totalStats.windows_sessions,
      games: games.filter((g) => g.played_windows).length,
      color: '#d67070'
    },
    {
      name: 'Mac OS',
      percent: totalStats.macos_playtime_percentagex100 / 100,
      playtime: getPlaytime('macos'),
      sessions: totalStats.macos_sessions,
      games: games.filter((g) => g.played_mac).length,
      color: '#46ab46'
    },
    {
      name: 'Linux',
      percent: totalStats.linux_playtime_percentagex100 / 100,
      playtime: getPlaytime('linux'),
      sessions: totalStats.linux_sessions,
      games: games.filter((g) => g.played_linux).length,
      color: '#683db4'
    },
    {
      name: 'Steam Deck',
      percent: totalStats.deck_playtime_percentagex100 / 100,
      playtime: getPlaytime('deck'),
      sessions: totalStats.deck_sessions,
      games: games.filter((g) => g.played_deck).length,
      color: '#3898b0'
    },
    {
      name: 'Virtual Reality',
      percent: totalStats.vr_playtime_percentagex100 / 100,
      playtime: getPlaytime('vr'),
      sessions: totalStats.vr_sessions,
      games: games.filter((g) => g.played_vr).length,
      color: '#c7b84e'
    }
  ];
</script>

<div class="flex flex-col gap-8">
  <h3 class="text-3xl font-extrabold text-white mb-2">Platforms</h3>
  <div class="flex flex-col gap-4">
    <h3 class="text-2xl font-bold text-white mb-2">Playtime</h3>
    <PercentChart
      formatMs
      data={platforms.map((p) => ({
        name: p.name,
        color: p.color,
        value: Math.round(p.playtime)
      }))}
    />
  </div>
  <div class="flex flex-col gap-4">
    <h3 class="text-2xl font-bold text-white mb-2">Sessions</h3>
    <PercentChart
      data={platforms.map((p) => ({
        name: p.name,
        color: p.color,
        value: p.sessions
      }))}
    />
  </div>
  <div class="flex flex-col gap-4">
    <h3 class="text-2xl font-bold text-white mb-2">Games Played</h3>
    <PercentChart
      data={platforms.map((p) => ({
        name: p.name,
        color: p.color,
        value: p.games
      }))}
    />
  </div>
  <div class="flex flex-col gap-4">
    <h3 class="text-2xl font-bold text-white mb-2">With Controller</h3>
    <div class="flex gap-8 justify-around flex-wrap p-4">
      <BigStat
        name="Total Playtime"
        subtext={`(${totalStats.controller_playtime_percentagex100 / 100}%)`}
      >
        {prettyMilliseconds(Math.round(getPlaytime('controller')) * 1000)}
      </BigStat>
      <BigStat
        name="Sessions"
        subtext={`(${((totalStats.controller_sessions / totalStats.total_sessions) * 100).toFixed(2)}%)`}
      >
        {totalStats.controller_sessions.toLocaleString()}
      </BigStat>
      <BigStat
        name="Games Played"
        subtext={`(${((games.filter((g) => g.played_controller).length / games.length) * 100).toFixed(2)}%)`}
      >
        {games.filter((g) => g.played_controller).length.toLocaleString()}
      </BigStat>
      <BigStat
        name="Demos Played"
        subtext={`(${((games.filter((g) => g.demo && g.played_controller).length / games.filter((g) => g.demo).length) * 100).toFixed(2)}%)`}
      >
        {games.filter((g) => g.demo && g.played_controller).length.toLocaleString()}
      </BigStat>
    </div>
  </div>
</div>
