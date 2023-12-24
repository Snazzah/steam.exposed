<script lang="ts">
  import type { PageData } from './$types';
  import Icon from '@iconify/svelte';
  import steamIcon from '@iconify-icons/mdi/steam';
  import cancelIcon from '@iconify-icons/mdi/cancel';
	import TagStatistics from './TagStatistics.svelte';
	import GameGrid from './GameGrid.svelte';
	import OverallStatistics from './OverallStatistics.svelte';
	import PlatformSection from './PlatformSection.svelte';
	import GamesSection from './GamesSection.svelte';
	import Button from '$lib/components/Button.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import prettyMilliseconds from 'pretty-ms';

  export let data: PageData;
  const available = Object.keys(data.yearInReview).length !== 0;

  let tabs = [
    'Overview',
    'Game List'
  ];
  let activeTab = 0;

  let playtimeStats = !available ? null : data.yearInReview.stats.playtime_stats;
</script>

<svelte:head>
  <meta content={`${data.profile.personaname}'s ${data.year} Year in Review`} property="og:title" />
  <meta content={data.profile.avatarfull} property="og:image" />
  <meta content="image/png" property="og:image:type" />
  <meta
    content={!playtimeStats
    ? 'Failed to get information...'
    : [
      `${playtimeStats.game_summary.length.toLocaleString()} games`,
      `${playtimeStats.total_stats.total_sessions.toLocaleString()} sessions`,
      `${prettyMilliseconds(playtimeStats.total_stats.total_playtime_seconds * 1000, { compact: true, verbose: true })} of total playtime`
    ].join(', ')} property="og:description" />
  <meta content={`https://steam.exposed/u/${data.profile.steamid}/${data.year}`} property="og:url" />
  <meta property="twitter:card" content="summary">
  <title>{data.profile.personaname}'s {data.year} Year in Review - steam.exposed</title>
</svelte:head>

<Header />

<main class="flex flex-col max-w-6xl mx-auto py-10 px-4 md:px-10 gap-10 mt-16">
  <div class="flex flex-col items-center gap-10 md:flex-row">
    <img src={data.profile.avatarfull} class="w-44 h-44 rounded" alt={data.profile.personaname} />
    <div class="flex flex-col items-center md:items-start">
      <h2 class="text-5xl font-bold  text-white">{data.profile.personaname}</h2>
      <span class="text-3xl">{data.year} Year In Review</span>
      <div class="flex flex-col gap-4 mt-6 md:flex-row">
        <Button href={`https://store.steampowered.com/yearinreview/${data.profile.steamid}/${data.year}`}>
          View on Steam
        </Button>
        <Button href={data.profile.profileurl} icon={steamIcon}>
          Steam Profile
        </Button>
      </div>
    </div>
  </div>

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
        <span class="text-neutral-500 text-center">The data for {data.year}'s year in review wound up empty, has this user created their year in review?</span>
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
