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

  export let data: PageData;

  let tabs = [
    'Overview',
    'Game List'
  ];
  let activeTab = 0;

  // TODO embed
</script>

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
      <img src="/spinner.png" alt="Loading" class="w-32 h-32" />
      <span class="text-sm">Loading...</span>
    </div>
  {:then result}
    {@const unavailable = Object.keys(result.yearInReview).length === 0}
    {#if unavailable}
      <div class="flex flex-col gap-4 justify-center items-center text-red-500">
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
        <OverallStatistics yearInReview={result.yearInReview} />
        <GamesSection yearInReview={result.yearInReview} />
        <PlatformSection yearInReview={result.yearInReview} />
        <TagStatistics tags={result.tags} yearInReview={result.yearInReview} />
      {:else if activeTab === 1}
        <GameGrid apps={result.apps} yearInReview={result.yearInReview} />
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
