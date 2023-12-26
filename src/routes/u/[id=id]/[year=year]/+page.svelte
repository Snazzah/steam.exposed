<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { quartIn } from 'svelte/easing';
	import prettyMilliseconds from 'pretty-ms';
  import type { PageData } from './$types';
  import Icon from '@iconify/svelte';
  import steamIcon from '@iconify-icons/mdi/steam';
  import cancelIcon from '@iconify-icons/mdi/cancel';
  import linkIcon from '@iconify-icons/mdi/link';
  import shareIcon from '@iconify-icons/mdi/share-variant';
  import twitterIcon from '@iconify-icons/mdi/twitter';
	import TagStatistics from './TagStatistics.svelte';
	import GameGrid from './GameGrid.svelte';
	import OverallStatistics from './OverallStatistics.svelte';
	import PlatformSection from './PlatformSection.svelte';
	import GamesSection from './GamesSection.svelte';
	import Button from '$lib/components/Button.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { steamIdToInviteUrl } from '$lib/util';

  export let data: PageData;
  const available = Object.keys(data.yearInReview).length !== 0;

  let tabs = [
    'Overview',
    'Game List'
  ];
  let activeTab = 0;
  let playtimeStats = !available ? null : data.yearInReview.stats.playtime_stats;

  const shareUrl = `https://steam.exposed/y${data.year.slice(2)}/${steamIdToInviteUrl(data.profile.steamid)}`
	const shareContent = {
		title: `${data.profile.personaname}'s ${data.year} Year in Review on steam.exposed`,
		text: !playtimeStats
      ? 'Failed to get information...'
      : [
        `${playtimeStats.game_summary.length.toLocaleString()} games`,
        `${playtimeStats.total_stats.total_sessions.toLocaleString()} sessions`,
        `${prettyMilliseconds(playtimeStats.total_stats.total_playtime_seconds * 1000, { compact: true, verbose: true })} of total playtime`
      ].join(', '),
		url: shareUrl
	};
	const copyShareUrlTooltip = tweened(0, { duration: 500, easing: quartIn });
  let shareAvailable = false;
  onMount(() => {
    shareAvailable = 'share' in navigator && navigator.canShare(shareContent);
  });
</script>

<svelte:head>
  <meta content={shareContent.title} property="og:title" />
  <meta content={data.profile.avatarfull} property="og:image" />
  <meta content="image/png" property="og:image:type" />
  <meta content={shareContent.text} property="og:description" />
  <meta content={`https://steam.exposed/u/${data.profile.steamid}/${data.year}`} property="og:url" />
  <meta property="twitter:card" content="summary">
  <title>{data.profile.personaname}'s {data.year} Year in Review - steam.exposed</title>
</svelte:head>

<Header />

<main class="flex flex-col max-w-6xl mx-auto py-10 px-4 md:px-10 gap-10 pt-[6.5rem]">
  <div class="flex flex-col items-center gap-10 md:flex-row">
    <img src={data.profile.avatarfull} class="w-44 h-44 rounded" alt={data.profile.personaname} />
    <div class="flex flex-col items-center md:items-start">
      <h2 class="text-5xl font-bold  text-white">{data.profile.personaname}</h2>
      <span class="text-3xl">{data.year} Year In Review</span>
      <div class="flex flex-col md:flex-row text-sm gap-2 justify-center items-center mt-2 relative">
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
          on:click={() => {
            copyShareUrlTooltip.set(1, { duration: 0 });
            copyShareUrlTooltip.set(0);
            navigator.clipboard.writeText(shareUrl)
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
              on:click={() => navigator.share(shareContent)}
            >
              <Icon icon={shareIcon} />
            </button>
          {/if}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.title.replace('steam.exposed', 'SteamExposed') + ' ' + shareUrl)}&related=Snazzah`}
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
        <Button href={data.profile.profileurl} icon={steamIcon}>
          Steam Profile
        </Button>
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
          <span class="text-neutral-400 text-center">The data for {data.year}'s year in review wound up empty. The account must set their Year in Review's <b>Page Visibility</b> to <b>Public</b>.</span>
        </div>
      {:else}
        <div class="flex gap-2 whitespace-nowrap w-full">
          {#each tabs as tab, i}
            <button
              class="_tab"
              class:--active={activeTab === i}
              on:click={() => activeTab = i}
            >
              {tab}
            </button>
          {/each}
        </div>
        {#if activeTab === 0}
          <OverallStatistics yearInReview={data.yearInReview} />
          <GamesSection yearInReview={data.yearInReview} />
          <PlatformSection yearInReview={data.yearInReview} />
          <TagStatistics tags={result.tags} yearInReview={data.yearInReview} />
        {:else if activeTab === 1}
          <GameGrid apps={result.apps} yearInReview={data.yearInReview} />
        {/if}
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
    @apply px-4 py-2 rounded-md bg-neutral-700 transition-all self-stretch;

    &:hover {
      @apply bg-neutral-600
    }

    &:active {
      @apply scale-95
    }

    &.--active {
      @apply bg-neutral-500 text-white;
    }
  }
</style>
