<script lang="ts">
	import Icon from "@iconify/svelte";
  import sendIcon from "@iconify-icons/mdi/send";
  import menuIcon from '@iconify-icons/mdi/menu-down';
  import checkIcon from '@iconify-icons/mdi/check';
	import Footer from "$lib/components/Footer.svelte";
	import { MIN_YEAR, getLatestYear, resolveToURL } from "$lib/util";
	import { clickOutside } from "$lib/actions";
	import { onMount } from "svelte";
	import { updated } from "$app/stores";

  const LATEST_YEAR = getLatestYear();
  let selectedYear = LATEST_YEAR;
  let showYearDropdown = false;
  const yearsAvailable = (() => {
    const years: number[] = [];
    for (let i = LATEST_YEAR; i >= MIN_YEAR; i--) years.push(i);
    return years;
  })();

  let input = '';
  let inputErrored = false;
  function submitInput() {
    const url = resolveToURL(input, selectedYear);
    if (!url) inputErrored = true;
    else location.href = url;
  }

  let errorPrompt = '';
  onMount(() => {
    if (location.hash === '#user_not_found') errorPrompt = "Failed to go to that user's profile...";
  })
</script>

<svelte:head>
  <title>steam.exposed</title>
  <meta content="steam.exposed" property="og:title" />
  <meta content="https://steam.exposed/images/social.png" property="og:image" />
  <meta content="image/png" property="og:image:type" />
  <meta content="Breakdowns of Steam's Year in Reviews" property="og:description" />
  <meta content="https://steam.exposed" property="og:url" />
  <meta property="twitter:card" content="summary_large_image">
</svelte:head>

<main class="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
  <div class="bg-[url('/images/steam_fade.svg')] bg-contain bg-no-repeat bg-center flex flex-col justify-end text-center pt-60">
    <h1 class="_shadow text-white font-bold text-4xl">steam.exposed</h1>
    <span  class="_shadow">Breakdowns of Steam's Year in Reviews</span>
  </div>
  {#if errorPrompt}
    <div class="px-4 py-2 rounded bg-red-500 text-white font-bold">
      {errorPrompt}
    </div>
  {/if}
  {#if $updated}
    <button class="px-4 py-1 rounded text-black font-bold text-sm transition-colors bg-blue-500 hover:bg-blue-400 shadow shadow-blue-500" on:click={() => location.reload()}>
      Site Updated, Refresh!
    </button>
  {/if}
  <div class="flex md:block flex-col gap-4 md:relative w-full max-w-lg">
    <input
      on:keypress={(e) => {
        if (e.key === 'Enter') submitInput();
      }}
      on:keydown={() => {
        if (inputErrored) inputErrored = false;
      }}
      bind:value={input}
      class="w-full px-4 py-2 md:pr-36 transition-all border border-neutral-600 hover:border-neutral-400 rounded bg-neutral-900 placeholder:text-neutral-600"
      placeholder="Steam ID, Custom URL, Share URL..."
      class:text-red-500={inputErrored}
    />
    <div class="flex md:absolute right-0 transition-all h-full top-0 bottom-0 gap-2 md:gap-0" use:clickOutside on:blur={() => showYearDropdown = false}>
      <div class="flex h-full relative w-full md:w-auto">
        <button
          on:click={() => showYearDropdown = !showYearDropdown}
          class="flex h-full w-full md:w-auto py-2 px-4 md:px-2 hover:text-white items-center justify-between rounded border md:border-none border-neutral-600 hover:border-neutral-400 bg-neutral-900 md:bg-transparent"
        >
          <span>{selectedYear}</span>
          <Icon icon={menuIcon} class="w-6 h-6" />
        </button>

        {#if showYearDropdown}
          <div class="absolute top-full w-full bg-neutral-800 rounded mt-2 z-20 flex flex-col overflow-hidden drop-shadow-md">
            {#each yearsAvailable as year}
              <button
                class="w-full py-2 px-4 md:px-2 transition-all hover:bg-neutral-700 flex items-center justify-between"
                on:click={() => {
                  selectedYear = year;
                  showYearDropdown = false;
                }}
              >
                <span>{year}</span>
                {#if selectedYear === year}
                  <Icon icon={checkIcon} class="w-6 h-6 md:w-4 md:h-4" />
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button
        class="hover:text-white transition-all h-[42px] px-4 py-2 rounded bg-neutral-900 md:bg-transparent border md:border-none border-neutral-600 hover:border-neutral-400"
        on:click={submitInput}
      >
        <Icon icon={sendIcon} class="w-5 h-5" />
      </button>
    </div>
    {#if inputErrored}
      <div class="text-sm text-red-500 md:absolute md:bottom-full md:mb-1">Couldn't do anything with that, try using URLs?</div>
    {/if}
  </div>
  <Footer inline />
</main>

<style lang="scss">
  ._shadow {
    filter: drop-shadow(0px 0px 2px black);
  }
</style>
