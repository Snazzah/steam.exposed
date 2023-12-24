<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { browser } from "$app/environment";
	import { autoPlacement, offset, shift } from 'svelte-floating-ui/dom';
	import { createFloatingActions } from 'svelte-floating-ui';
	import Portal from 'svelte-portal';
	import type { PlaytimeStatsGameSummary } from "$lib/types";
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';

  export let name: string | undefined = undefined;
  export let game: PlaytimeStatsGameSummary;
  export let footer = '';

  let coverUrl = '';
  let element: HTMLButtonElement;
	const loadCover = () => {
		if (!browser) return;
		const img = new Image();
		img.onload = () => coverUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
    img.onerror = () => {
      const img = new Image();
      img.onload = () => coverUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/portrait.png`;
      img.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/portrait.png`;
    }
		img.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`;
	};

  onMount(() => {
    const intersectionObserverSupport =
      'IntersectionObserver' in window &&
      'IntersectionObserverEntry' in window &&
      'intersectionRatio' in window.IntersectionObserverEntry.prototype;
    if (!intersectionObserverSupport) return void loadCover();

    const unobserve = () => observer.unobserve(element);
    const observer = new IntersectionObserver((elements) => {
      if (elements[0]?.isIntersecting) {
        unobserve();
        loadCover();
      }
    });
    observer.observe(element);
    return unobserve;
  });

	const showTooltip = tweened(0);
  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement: 'top',
    middleware: [offset(24), shift(), autoPlacement({
      allowedPlacements: ['top', 'bottom']
    })]
  });
</script>

<button
  bind:this={element}
  use:floatingRef
  on:mouseenter={() => showTooltip.set(1, { duration: 500 })}
  on:mouseleave={() => showTooltip.set(0, { duration: 0 })}
  on:focus={() => showTooltip.set(1, { duration: 0 })}
  on:blur={() => showTooltip.set(0, { duration: 0 })}
  on:click
  on:click={() => showTooltip.set(0, { duration: 0 })}
  class="_game w-24 md:w-48"
>
  {#if coverUrl}
    <img
      transition:fade
      class="absolute w-full h-full top-0 text-center bg-neutral-900"
      src={coverUrl}
      alt={name || `App ${game.appid}`}
    />
  {:else}
    <span
      transition:fade
      class="absolute w-full h-full top-0 left-0 text-center align-middle overflow-hidden py-8 px-2 text-sm md:text-xl select-none _appname"
    >
      {name || `App ${game.appid}`}
    </span>
  {/if}
  {#if footer}
    <div class="absolute bottom-0 left-0 right-0 flex items-center justify-center px-1">
      <span class="text-xs md:text-sm px-4 bg-zinc-600 rounded-t text-center _footer">{footer}</span>
    </div>
  {/if}
  {#if game.demo || !name}
    <div class="absolute text-xs md:text-sm top-1 right-1 flex gap-1">
      {#if game.demo}
        <span class="px-2 bg-green-400 text-black rounded _demo">DEMO</span>
      {/if}
      {#if !name}
        <span
          class="px-2 bg-neutral-700 text-white rounded _demo"
          title="Failed to fetch more information about this app. Assets may still load."
        >
          ?
        </span>
      {/if}
    </div>
  {/if}
</button>


{#if $showTooltip === 1}
  <Portal target="body">
    <div
      class="max-w-[240px] text-sm md:text-base z-20 text-center absolute px-2 md:px-4 py-2 bg-neutral-900 text-white bg-opacity-90 rounded shadow-md backdrop-blur-sm flex-col justify-center items-center inline-flex select-none"
      transition:scale={{ duration: 250, start: 0.9 }}
      use:floatingContent
    >
      {name || `App ${game.appid}`}
    </div>
  </Portal>
{/if}

<style lang="scss">
  ._game {
    @apply flex-none relative aspect-[2/3];
    @apply bg-neutral-900 shadow transition-all select-none;

    &:hover {
      @apply z-10;
      transform: perspective(100rem) rotateX(10deg) scale(1.05);
    }
  }

  ._appname {
    filter: drop-shadow(0px 2px 2px black);
  }

  ._footer, ._demo {
    filter: drop-shadow(0px 0px 2px black);
  }
</style>
