<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { quartIn } from 'svelte/easing';
	import prettyMilliseconds from 'pretty-ms';
	import type { PageData } from './$types';
	import Icon from '@iconify/svelte';
	import steamIcon from '@iconify-icons/mdi/steam';
	import cancelIcon from '@iconify-icons/mdi/cancel';
	import menuIcon from '@iconify-icons/mdi/chevron-down';
	import linkIcon from '@iconify-icons/mdi/link';
	import shareIcon from '@iconify-icons/mdi/share-variant';
	import twitterIcon from '@iconify-icons/mdi/twitter';
	import TagStatistics from './TagStatistics.svelte';
	import GameGrid from './GameGrid.svelte';
	import OverallStatistics from './OverallStatistics.svelte';
	import PlatformSection from './PlatformSection.svelte';
	import GamesSection from './GamesSection.svelte';
	import PlaytimeStreak from './PlaytimeStreak.svelte';
	import Button from '$lib/components/Button.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { getLatestYear, loadingIcon, MIN_YEAR, steamIdToInviteUrl } from '$lib/util';
	import GameModal from './GameModal.svelte';
	import Portal from 'svelte-portal';
	import { fade, fly } from 'svelte/transition';
	import MonthView from './MonthView.svelte';
	import AchievementsSection from './AchievementsSection.svelte';
	import type { AchievementData } from '$lib/types';
	import { SSEClient } from '$lib/sse';
	import OnMount from '$lib/components/OnMount.svelte';
	import { goto, replaceState } from '$app/navigation';
	import { clickOutside } from '$lib/actions';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const available = Object.keys(data.yearInReview).length !== 0;

	const tabs = ['Overview', 'Game List', 'By Month', 'Playtime Streak', 'Achievements'];
	const tabLinks = ['', 'games', 'months', 'streak', 'achievements'];
	let activeTab = $state(0);
	let playtimeStats = !available ? null : data.yearInReview.stats.playtime_stats;

	let selectedApp = $state<number | null>(null);
	function onModalClick(this: any, e: any) {
		if (e.target === this) {
			selectedApp = null;
			replaceState(!location.hash ? '' : location.hash.split('?app=')[0], {});
		}
	}

	const shareUrl = `https://steam.exposed/y${data.year.slice(2)}/${steamIdToInviteUrl(
		data.profile.steamid
	)}`;
	const shareContent = {
		title: `${data.profile.personaname}'s ${data.year} Steam Replay on steam.exposed`,
		text: !playtimeStats
			? 'Failed to get information...'
			: [
					`${playtimeStats.game_summary.length.toLocaleString()} games`,
					`${playtimeStats.total_stats.total_sessions.toLocaleString()} sessions`,
					`${playtimeStats.summary_stats.total_achievements.toLocaleString()} achievements`,
					`${prettyMilliseconds(playtimeStats.total_stats.total_playtime_seconds * 1000, {
						compact: true,
						verbose: true
					})} of total playtime`
				].join(', '),
		url: shareUrl
	};
	const copyShareUrlTooltip = tweened(0, { duration: 500, easing: quartIn });
	let shareAvailable = $state(false);

	let showYearDropdown = $state(false);
	const yearsAvailable = $derived(() => {
		const years: number[] = [];
		for (let i = getLatestYear(); i >= MIN_YEAR; i--) years.push(i);
		return years;
	});

	let achievements = $state<AchievementData | null>(data.achievementData ?? null);
	let achievementsLoading = $state(!data.achievementData);
	let achievementsLoadingText = $state('');
	let achievementsLoadingProgress = $state(-1);
	let achievementsError: any = $state(null);
	const sseClient = new SSEClient();

	function onDataLoaded() {
		if (!achievements) sseClient.connect(`/u/${data.profile.steamid}/${data.year}/_sse`);

		if (location.hash.startsWith('#/')) {
			const referencedTab = location.hash.slice(2);
			const index = tabLinks.indexOf(referencedTab);
			if (index !== -1) activeTab = index;
		}

		if (location.hash.includes('?app=')) {
			const [rest, app] = location.hash.split('?app=');
			const appid = parseInt(app, 10);
			if (
				isNaN(appid) ||
				!isFinite(appid) ||
				appid < 0 ||
				!playtimeStats ||
				!playtimeStats.game_summary.find((g) => g.appid === appid)
			) {
				replaceState(rest, {});
				return;
			}

			selectedApp = appid;
		}
	}

	function onAppSelect(appid: number) {
		selectedApp = appid;
		if (!location.hash.includes('?app='))
			replaceState(`${location.hash || '#'}?app=${selectedApp}`, {});
	}

	onMount(() => {
		shareAvailable = 'share' in navigator && navigator.canShare(shareContent);

		sseClient.on('opened', () => console.log('[SSE] Opened'));
		sseClient.on('retry', ({ attempts }) => console.log('[SSE] Retrying', { attempts }));
		sseClient.on('closed', () => console.log('[SSE] Closed'));
		sseClient.on('init', (info) => {
			if (info.streaming === false) {
				achievementsLoading = false;
				achievements = info.data;
				sseClient.close();
			}
		});
		sseClient.on('update', (update) => {
			if (update.text) achievementsLoadingText = update.text;
			if (update.progress) achievementsLoadingProgress = update.progress;
		});
		sseClient.on('end', (info) => {
			if (info.error) {
				achievementsLoading = false;
				achievementsError = { message: info.error };
			} else if (info.data) {
				achievementsLoading = false;
				achievements = info.data;
			}
			sseClient.close();
		});

		return () => sseClient.close();
	});
</script>

<svelte:head>
	<title>{data.profile.personaname}'s {data.year} Replay - steam.exposed</title>
	<meta content={shareContent.title} property="og:title" />
	<meta content={data.profile.avatarfull} property="og:image" />
	<meta content="image/png" property="og:image:type" />
	<meta content={shareContent.text} property="og:description" />
	<meta
		content={`https://steam.exposed/u/${data.profile.steamid}/${data.year}`}
		property="og:url"
	/>
	<meta property="twitter:card" content="summary" />
	{#if data.profileItems && data.profileItems.avatar_frame.appid}
		{#if data.profileItems.animated_avatar.appid}
			<link
				rel="preload"
				as="image"
				href={`https://cdn.akamai.steamstatic.com/steamcommunity/public/images/${data.profileItems.animated_avatar.image_small}`}
			/>
		{/if}
		{#if data.profileItems.avatar_frame.appid}
			<link
				rel="preload"
				as="image"
				href={`https://cdn.akamai.steamstatic.com/steamcommunity/public/images/${data.profileItems.avatar_frame.image_small}`}
			/>
		{/if}
	{/if}
	<link rel="preload" as="image" href={data.profile.avatarfull} />
</svelte:head>

<Header />

<main class="flex flex-col max-w-6xl mx-auto py-10 px-4 md:px-10 gap-10 pt-[6.5rem]">
	<div class="flex flex-col items-center gap-10 md:flex-row">
		<div class="relative w-44 h-44">
			{#if data.profileItems && data.profileItems.avatar_frame.appid}
				<img
					src={`https://cdn.akamai.steamstatic.com/steamcommunity/public/images/${data.profileItems.avatar_frame.image_small}`}
					class="pointer-events-none absolute top-0 bottom-0 left-0 right-0 scale-[1.22]"
					alt={`${data.profile.personaname}'s Avatar Frame`}
				/>
			{/if}
			<img
				src={data.profileItems && data.profileItems.animated_avatar.appid
					? `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/${data.profileItems.animated_avatar.image_small}`
					: data.profile.avatarfull}
				class="top-0 bottom-0 left-0 right-0"
				alt={data.profile.personaname}
			/>
		</div>
		<div class="flex flex-col items-center md:items-start">
			<h2 class="text-5xl font-bold text-white">{data.profile.personaname}</h2>
			<span class="text-3xl">
        <div
          class="relative inline-block z-10"
          use:clickOutside
          onblur={() => (showYearDropdown = false)}
        >
          <button
            class="px-2 py-1 rounded bg-black/50 transition-all hover:bg-neutral-800 active:scale-95 peer"
            onclick={() => (showYearDropdown = !showYearDropdown)}
          >
            {data.year}
          </button>
          <Icon icon={menuIcon} class="absolute right-2 peer-hover:-right-10 z-[-1] opacity-0 peer-hover:opacity-100 top-0 bottom-0 my-auto w-8 h-8 rounded-full transition-all bg-neutral-800/50 backdrop-blur-md pointer-events-none" />

					{#if showYearDropdown}
            <div
              class="absolute top-full w-full bg-neutral-800 rounded mt-2 z-20 flex flex-col overflow-hidden drop-shadow-md text-2xl ring-2 ring-black/50"
              transition:fly={{ y: 10 }}
            >
              {#each yearsAvailable() as year}
                <button
                  class="w-full py-1 px-4 md:px-2 transition-all hover:bg-neutral-700 focus:bg-neutral-700 outline-none flex items-center justify-between data-[selected]:underline data-[selected]:decoration-sky-400 data-[selected]:text-white data-[selected]:pointer-events-none data-[selected]:opacity-35 data-[selected]:select-none"
                  data-selected={String(year) === data.year ? 'true' : null}
                  disabled={String(year) === data.year}
                  onclick={() => {
                    goto(`/u/${data.profile.steamid}/${year}`);
                    showYearDropdown = false;
                  }}
                >
                  {year}
                </button>
              {/each}
          </div>
					{/if}
        </div>
        <span>Steam Replay</span>
      </span>
			<div
				class="flex flex-col md:flex-row text-sm gap-2 justify-center items-center mt-2 relative"
			>
				{#if $copyShareUrlTooltip !== 0}
					<span
						class="absolute bottom-full text-base pointer-events-none left-0 px-2 py-1 bg-neutral-800/75 backdrop-blur rounded"
						style:opacity={$copyShareUrlTooltip}
						style:margin-bottom={`${4 + Math.round((1 - $copyShareUrlTooltip) * 24)}px`}
					>
						Copied!
					</span>
				{/if}
				<button
					class="px-2 py-1 flex justify-center items-center gap-1 rounded bg-black/50 transition-all hover:bg-neutral-800 active:bg-neutral-700"
					title="Copy Share URL"
					onclick={() => {
						copyShareUrlTooltip.set(1, { duration: 0 });
						copyShareUrlTooltip.set(0);
						navigator.clipboard.writeText(shareUrl);
					}}
				>
					<Icon icon={linkIcon} />
					<code>{shareUrl}</code>
				</button>
				<div class="flex justify-center items-center gap-2">
					{#if shareAvailable}
						<button
							class="px-2 py-1 flex justify-center items-center gap-1 rounded bg-neutral-900 transition-all hover:bg-neutral-800 active:bg-neutral-700"
							title="Share..."
							onclick={() => navigator.share(shareContent)}
						>
							<Icon icon={shareIcon} />
						</button>
					{/if}
					<a
						href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
							shareContent.title.replace('steam.exposed', 'SteamExposed') + ' ' + shareUrl
						)}&related=Snazzah`}
						target="_blank"
						class="px-2 py-1 flex justify-center items-center gap-1 rounded bg-neutral-900 transition-all hover:bg-neutral-800 active:bg-neutral-700"
						title="Share on Twitter..."
					>
						<Icon icon={twitterIcon} />
					</a>
				</div>
			</div>
			<div class="flex flex-col gap-4 mt-6 md:flex-row">
				<Button
					href={`https://store.steampowered.com/yearinreview/${data.profile.steamid}/${data.year}`}
					highlight={!available}
				>
					View on Steam
				</Button>
				<Button href={data.profile.profileurl} icon={steamIcon}>Steam Profile</Button>
			</div>
		</div>
	</div>

	{#if !data.data}
		<div class="flex flex-col gap-2 justify-center items-center select-none mt-20">
			<span class="text-sm">Data loading was skipped, you should fix your User Agent header.</span>
		</div>
	{:else}
		{#await data.data}
			<div class="flex flex-col gap-2 justify-center items-center select-none mt-20">
				<img src="/images/spinner.png" alt="Loading" class="w-32 h-32" />
				<span class="text-sm">Loading...</span>
			</div>
		{:then result}
			{@const unavailable = Object.keys(data.yearInReview).length === 0}
			{#if unavailable}
				<div class="flex flex-col gap-4 justify-center items-center text-red-500 mt-20">
					<Icon icon={cancelIcon} class="w-16 h-16" />
					<h3 class="text-2xl font-bold">Data Unavailable</h3>
					<span class="text-neutral-400 text-center">
						The data for {data.year}'s replay wound up empty. The account must set their
						Steam Replay <b>Page Visibility</b> to <b>Public</b>.
					</span>
				</div>
			{:else}
				<OnMount mount={onDataLoaded} />
				<div
					class="flex gap-2 whitespace-nowrap w-full flex-wrap md:flex-nowrap justify-center md:justify-start"
				>
					{#each tabs as tab, i}
						{@const isAchTab = tab === 'Achievements'}
						<button
							class="_tab w-[calc(50%-4px)] md:w-fit"
							class:__active={activeTab === i}
							onclick={() => {
								activeTab = i;
								replaceState(i === 0 ? '' : `#/${tabLinks[i]}`, {});
							}}
						>
							{#if isAchTab && achievementsLoading}
								<Icon icon={loadingIcon} class="w-6 h-6 animate-spin flex-none" />
							{/if}
							<span>{tab}</span>
						</button>
					{/each}
				</div>
				{#if activeTab === 0}
					<OverallStatistics yearInReview={data.yearInReview} />
					<GamesSection yearInReview={data.yearInReview} />
					<PlatformSection
						yearInReview={data.yearInReview}
						stats={data.yearInReview.stats.playtime_stats.total_stats}
					/>
					<TagStatistics tags={result.tags} yearInReview={data.yearInReview} />
				{:else if activeTab === 1}
					<GameGrid
						apps={result.apps}
						yearInReview={data.yearInReview}
						{achievements}
						onselect={onAppSelect}
					/>
				{:else if activeTab === 2}
					<MonthView apps={result.apps} yearInReview={data.yearInReview} onselect={onAppSelect} />
				{:else if activeTab === 3}
					<PlaytimeStreak
						apps={result.apps}
						yearInReview={data.yearInReview}
						onselect={onAppSelect}
					/>
				{:else if activeTab === 4}
					{#if achievementsLoading}
						<div class="flex flex-col gap-2 justify-center items-center select-none mt-20">
							<img src="/images/spinner.png" alt="Loading" class="w-32 h-32" />
							<span class="text-sm">{achievementsLoadingText || 'Loading achievements...'}</span>
							<span class="text-xs"
								>This usually takes a while depending on how many games this person unlocked
								achievements in.</span
							>
							{#if achievementsLoadingProgress !== -1}
								<div class="relative rounded-full bg-neutral-700 w-full h-2 overflow-hidden">
									<div
										class="h-full bg-blue-400 absolute left-0 transition-all"
										style:width={`${achievementsLoadingProgress * 100}%`}
									></div>
								</div>
							{/if}
						</div>
					{:else if achievementsError || !achievements}
						<div class="flex flex-col gap-4 justify-center items-center text-red-500 mt-20">
							<Icon icon={cancelIcon} class="w-16 h-16" />
							<h3 class="text-2xl font-bold">Failed to load achievements</h3>
							<span class="text-neutral-400 text-center">
								A server error occurred while doing this, probably try again later.
							</span>
						</div>
					{:else if achievements}
						<AchievementsSection
							apps={result.apps}
							yearInReview={data.yearInReview}
							{achievements}
							onselect={onAppSelect}
						/>
					{/if}
				{/if}
			{/if}

			<!-- Modal Portal -->
			{#if selectedApp !== null}
				<Portal target="body">
					<div
						transition:fade={{ duration: 100 }}
						class="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-25 backdrop-blur-sm select-none flex items-end md:items-center justify-center md:px-8 z-30"
						aria-hidden="true"
						onclick={onModalClick}
					>
						<div
							transition:fly={{ duration: 250, y: 32 }}
							class="w-[1024px] max-h-[calc(100svh-6rem)] relative text-neutral-200 bg-neutral-900 rounded-t md:rounded-b shadow-lg flex-col justify-start items-start inline-flex overflow-hidden"
						>
							<GameModal
								appId={selectedApp}
								apps={result.apps}
								yearInReview={data.yearInReview}
								{achievements}
							/>
						</div>
					</div>
				</Portal>
			{/if}
		{:catch error}
			<div class="flex flex-col gap-4 justify-center items-center text-red-500 mt-20">
				<Icon icon={cancelIcon} class="w-16 h-16" />
				<h3 class="text-2xl font-bold">Error</h3>
				<span class="text-neutral-500 text-center">{error.message}</span>
			</div>
		{/await}
	{/if}
</main>

<Footer />

<style lang="scss">
	._tab {
		@apply px-4 py-2 rounded-md bg-neutral-700 transition-all self-stretch flex justify-center items-center gap-1;

		&:hover {
			@apply bg-neutral-600;
		}

		&:active {
			@apply scale-95;
		}

		&.__active {
			@apply bg-neutral-500 text-white;
		}
	}
</style>
