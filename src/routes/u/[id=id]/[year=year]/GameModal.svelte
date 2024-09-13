<script lang="ts">
	import type { AchievementData, SteamYearInReview } from '$lib/types';
	import { calcAchievements, getGameAsset, relativeTime } from '$lib/util';
	import BigStat from '../../../../lib/components/BigStat.svelte';
	import prettyMilliseconds from 'pretty-ms';
	import Button from '$lib/components/Button.svelte';
	import Icon from '@iconify/svelte';
	import steamIcon from '@iconify-icons/mdi/steam';
	import steamDbIcon from '@iconify-icons/simple-icons/steamdb';
	import windowsIcon from '@iconify-icons/mdi/windows';
	import macIcon from '@iconify-icons/mdi/apple';
	import linuxIcon from '@iconify-icons/mdi/linux';
	import controllerIcon from '@iconify-icons/mdi/controller';
	import steamDeckIcon from '@iconify-icons/simple-icons/steamdeck';
	import vrIcon from '@iconify-icons/mdi/virtual-reality';
	import GameModalMonthChart from './GameModalMonthChart.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { onMount } from 'svelte';
	import Achievement from './Achievement.svelte';
	import GameAchievementDetail from './GameAchievementDetail.svelte';

	export let apps: Record<number, string> = {};
	export let yearInReview: SteamYearInReview;
  export let achievements: AchievementData | null = null;
	let totalStats = yearInReview.stats.playtime_stats.total_stats;

	export let appId: number;
	let game = yearInReview.stats.playtime_stats.game_summary.find((g) => g.appid === appId)!;
	let moreInfo = yearInReview.stats.playtime_stats.games.find((g) => g.appid === appId);

  const startDate = new Date(`Jan 1 ${yearInReview.stats.year}`).valueOf();
  const stopDate = new Date(`Dec 31 ${yearInReview.stats.year}`).valueOf();
  $: earnedAchievements = achievements?.games[appId]
    ? achievements.games[appId]
      ?.map((ach) => ({
      ...ach,
      unlocked: achievements.unlocked?.[appId]?.[ach.id] ?? 0
      }))
      .filter((ach) => ach.unlocked >= (startDate / 1000) && ach.unlocked < (stopDate / 1000))
      .sort((a, b) => a.unlocked - b.unlocked)
      ?? []
    : []

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
	const achDtf = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
    timeStyle: 'short'
	});
	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });

	let heroUrl = '';
	const loadHero = async () => {
		const asset = await getGameAsset(game.appid, ['libraryHero']);
		if (asset) heroUrl = asset;
	};

	// TODO show playtime streak & ranks

	onMount(() => loadHero());
</script>

<div
	class="bg-cover bg-no-repeat bg-center h-36 md:h-56 w-full flex flex-col items-start justify-between bg-slate-600/25"
	style:background-image={heroUrl ? `url(${heroUrl})` : undefined}
>
	<div class="flex w-full items-center justify-end gap-2 p-2 mb-10">
		{#if game.demo}
			<span class="text-xs md:text-sm px-2 bg-green-400 text-black rounded _badge">DEMO</span>
		{/if}
		{#if game.playtest}
			<span class="text-xs md:text-sm px-2 bg-zinc-500 text-white rounded _badge">PLAYTEST</span>
		{/if}
		{#if game.new_this_year}
			<span class="text-xs md:text-sm px-2 bg-purple-500 text-white rounded _badge"
				>NEW THIS YEAR</span
			>
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
	<div
		class="flex flex-col w-full items-start justify-center px-4 py-2 backdrop-blur-sm overflow-ellipsis bg-black/25"
	>
		<h3 class="_gameheadername font-bold md:text-4xl text-ellipsis">
			{apps[appId] || `App ${appId}`}
		</h3>
	</div>
</div>

<div class="flex flex-col p-4 gap-8 w-full overflow-y-auto light-scrollbar">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-4 md:flex-row">
			<dl class="flex flex-col w-full">
				<dt class="font-bold text-white text-lg">App ID</dt>
				<dd class="flex gap-2 items-center">
					<code class="select-all">{appId}</code>
					<CopyButton text={String(appId)} />
				</dd>
			</dl>
			<dl class="flex flex-col w-full">
				<dt class="font-bold text-white text-lg">Release Date</dt>
				{#if game.rtime_release_date}
					<dd>
						{dtf.format(game.rtime_release_date * 1000)}
						<span class="text-neutral-400">
              ({relativeTime(rtf, game.rtime_release_date - Date.now() / 1000)})
            </span>
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
					<span class="text-neutral-400"
						>({relativeTime(rtf, game.rtime_first_played_lifetime - Date.now() / 1000)})</span
					>
				</dd>
			</dl>
			<dl class="flex flex-col w-full">
				<dt class="font-bold text-white text-lg">Played on</dt>
				<dd class="flex flex-row gap-1">
					<Icon
						title="Windows"
						icon={windowsIcon}
						class={`w-6 h-6 ${!game.played_windows ? 'opacity-25' : ''}`}
					/>
					<Icon
						title="Mac OS"
						icon={macIcon}
						class={`w-6 h-6 ${!game.played_mac ? 'opacity-25' : ''}`}
					/>
					<Icon
						title="Linux"
						icon={linuxIcon}
						class={`w-6 h-6 ${!game.played_linux ? 'opacity-25' : ''}`}
					/>
					<Icon
						title="Virtual Reality"
						icon={vrIcon}
						class={`w-6 h-6 ${!game.played_vr ? 'opacity-25' : ''}`}
					/>
					<Icon
						title="Steam Deck"
						icon={steamDeckIcon}
						class={`w-6 h-6 ${!game.played_deck ? 'opacity-25' : ''}`}
					/>
					<Icon
						title="Controller"
						icon={controllerIcon}
						class={`w-6 h-6 ${!game.played_controller ? 'opacity-25' : ''}`}
					/>
				</dd>
			</dl>
		</div>
		<div class="flex flex-col gap-4 md:flex-row">
			<Button href={`steam://open/library/details/${appId}`} icon={steamIcon}>
				View in Library
			</Button>
			<Button
				href={`https://store.steampowered.com/app/${appId}/?utm_source=SteamExposed`}
				icon={steamIcon}
			>
				Store Page
			</Button>
			<Button
				href={`https://steamdb.info/app/${appId}/info/?utm_source=SteamExposed`}
				icon={steamDbIcon}
			>
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
			<BigStat
				name="Total Playtime (estimated)"
				subtext={`(${game.total_playtime_percentagex100 / 100}%)`}
			>
				~{prettyMilliseconds(
					totalStats.total_playtime_seconds * (game.total_playtime_percentagex100 / 10000) * 1000
				)}
			</BigStat>
		{/if}
		<BigStat name="Sessions">
			{game.total_sessions.toLocaleString()}
		</BigStat>
	</div>
	<GameModalMonthChart {appId} {yearInReview} />
  {#if earnedAchievements.length > 0 && achievements}
    {@const { achTotal, achEarned, achEarnedBefore, earnedPercent, completed } = calcAchievements(achievements, appId, earnedAchievements)}
    <div class="flex flex-col gap-4">
      <h3 class="text-3xl font-extrabold text-white mb-2">Achievements Earned This Year</h3>
      <div class="flex flex-col">
        <GameAchievementDetail
          achAmount={earnedAchievements.length}
          {achTotal} {achEarned} {achEarnedBefore} {completed} {earnedPercent}
        />
      </div>
      <div class="flex gap-2 flex-wrap">
        {#each earnedAchievements as ach (`modal-${appId}:${ach.id}`)}
          <Achievement achievement={ach} unlockedAt={ach.unlocked} dtf={achDtf} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
	._gameheadername {
		filter: drop-shadow(0px 0px 2px black);
	}
	._badge {
		filter: drop-shadow(0px 0px 2px black);
	}
</style>
