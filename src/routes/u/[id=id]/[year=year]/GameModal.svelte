<script lang="ts">
	import type { SteamYearInReview } from "$lib/types";
	import { relativeTime } from "$lib/util";
	import BigStat from "../../../../lib/components/BigStat.svelte";
	import prettyMilliseconds from "pretty-ms";
	import Button from "$lib/components/Button.svelte";
	import Icon from "@iconify/svelte";
  import steamIcon from '@iconify-icons/mdi/steam';
  import steamDbIcon from '@iconify-icons/simple-icons/steamdb';
  import windowsIcon from '@iconify-icons/mdi/windows';
  import macIcon from '@iconify-icons/mdi/apple';
  import linuxIcon from '@iconify-icons/mdi/linux';
  import controllerIcon from '@iconify-icons/mdi/controller';
  import steamDeckIcon from '@iconify-icons/simple-icons/steamdeck';
  import vrIcon from '@iconify-icons/mdi/virtual-reality';
	import GameModalMonthChart from "./GameModalMonthChart.svelte";

  export let apps: Record<number, string> = {};
  export let yearInReview: SteamYearInReview;
  let totalStats = yearInReview.stats.playtime_stats.total_stats;

  export let appId: number;
  let game = yearInReview.stats.playtime_stats.game_summary.find((g) => g.appid === appId)!;
  let moreInfo = yearInReview.stats.playtime_stats.games.find((g) => g.appid === appId);

  const dtf = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short'
  });
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });

  // TODO show playtime streak & ranks
</script>


<div
  class="bg-cover bg-no-repeat bg-center h-36 md:h-56 w-full flex flex-col items-start justify-between bg-slate-600/25"
  style:background-image={`url(https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg)`}
>
  <div class="flex w-full items-center justify-end gap-2 p-2">
    {#if game.demo}
      <span class="text-xs md:text-sm px-2 bg-green-400 text-black rounded _badge">DEMO</span>
    {/if}
    {#if game.playtest}
      <span class="text-xs md:text-sm px-2 bg-zinc-500 text-white rounded _badge">PLAYTEST</span>
    {/if}
    {#if game.new_this_year}
      <span class="text-xs md:text-sm px-2 bg-purple-500 text-white rounded _badge">NEW THIS YEAR</span>
    {/if}
    {#if !apps[appId]}
      <span
        class="px-2 bg-neutral-700 text-white rounded _demo"
        title="Failed to fetch more information about this app. Assets may still load."
      >
        ?
      </span>
    {/if}
  </div>
  <div class="flex flex-col w-full items-start justify-center px-4 py-2 backdrop-blur-sm overflow-ellipsis bg-black/25">
    <h3 class="_gameheadername font-bold md:text-4xl text-ellipsis">{apps[appId] || `App ${appId}`}</h3>
  </div>
</div>

<div class="flex flex-col p-4 gap-8 w-full overflow-y-auto">
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 md:flex-row">
      <dl class="flex flex-col w-full">
        <dt class="font-bold text-white text-lg">App ID</dt>
        <dd><code>{appId}</code></dd>
      </dl>
      <dl class="flex flex-col w-full">
        <dt class="font-bold text-white text-lg">Release Date</dt>
        {#if game.rtime_release_date}
          <dd>
            {dtf.format(game.rtime_release_date * 1000)}
            <span class="text-neutral-400">({relativeTime(rtf, game.rtime_release_date - (Date.now() / 1000))})</span>
          </dd>
        {:else}
          <dd class="italic text-neutral-500">Unknown</dd>
        {/if}
      </dl>
    </div>
    <div class="flex flex-col gap-4 md:flex-row">
      <dl class="flex flex-col w-full">
        <dt class="font-bold text-white text-lg">First Played</dt>
        <dd>
          {dtf.format(game.rtime_first_played_lifetime * 1000)}
          <span class="text-neutral-400">({relativeTime(rtf, game.rtime_first_played_lifetime - (Date.now() / 1000))})</span>
        </dd>
      </dl>
      <dl class="flex flex-col w-full">
        <dt class="font-bold text-white text-lg">Played on</dt>
        <dd class="flex flex-row gap-1">
          <Icon title="Windows" icon={windowsIcon} class={`w-6 h-6 ${!game.played_windows ? 'opacity-25' : ''}`} />
          <Icon title="Mac OS" icon={macIcon} class={`w-6 h-6 ${!game.played_mac ? 'opacity-25' : ''}`} />
          <Icon title="Linux" icon={linuxIcon} class={`w-6 h-6 ${!game.played_linux ? 'opacity-25' : ''}`} />
          <Icon title="Virtual Reality" icon={vrIcon} class={`w-6 h-6 ${!game.played_vr ? 'opacity-25' : ''}`} />
          <Icon title="Steam Deck" icon={steamDeckIcon} class={`w-6 h-6 ${!game.played_deck ? 'opacity-25' : ''}`} />
          <Icon title="Controller" icon={controllerIcon} class={`w-6 h-6 ${!game.played_controller ? 'opacity-25' : ''}`} />
        </dd>
      </dl>
    </div>
    <div class="flex flex-col gap-4 md:flex-row">
      <Button href={`steam://open/library/details/${appId}`} icon={steamIcon}>
        View in Library
      </Button>
      <Button href={`https://store.steampowered.com/app/${appId}/?utm_source=SteamExposed`} icon={steamIcon}>
        Store Page
      </Button>
      <Button href={`https://steamdb.info/app/${appId}/info/?utm_source=SteamExposed`} icon={steamDbIcon}>
        SteamDB
      </Button>
    </div>
  </div>
  <div class="flex gap-8 justify-around flex-wrap">
    {#if moreInfo}
      <BigStat name="Total Playtime" subtext={`(${game.total_playtime_percentagex100 / 100}%)`}>
        {prettyMilliseconds(moreInfo.stats.total_playtime_seconds * 1000)}
      </BigStat>
    {:else}
      <BigStat name="Total Playtime (estimated)" subtext={`(${game.total_playtime_percentagex100 / 100}%)`}>
        ~{prettyMilliseconds((totalStats.total_playtime_seconds * (game.total_playtime_percentagex100 / 10000)) * 1000)}
      </BigStat>
    {/if}
    <BigStat name="Sessions">
      {game.total_sessions.toLocaleString()}
    </BigStat>
  </div>
  <GameModalMonthChart {appId} {yearInReview} />
</div>

<style lang="scss">
  ._gameheadername {
    filter: drop-shadow(0px 0px 2px black);
  }
  ._badge {
    filter: drop-shadow(0px 0px 2px black);
  }
</style>
