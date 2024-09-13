<script lang="ts">
	import type { GameAchievement } from '$lib/types';
	import { autoPlacement, offset, shift } from 'svelte-floating-ui/dom';
	import { createFloatingActions } from 'svelte-floating-ui';
	import Portal from 'svelte-portal';
	import { scale } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import Icon from '@iconify/svelte';
  import hiddenIcon from '@iconify-icons/mdi/eye-off';

  export let achievement: GameAchievement;
  export let gameName: string = '';
  export let unlockedAt = 0;
  export let dtf: Intl.DateTimeFormat;
  export let dayDtf: Intl.DateTimeFormat;

	const showTooltip = tweened(0);
	const [floatingRef, floatingContent] = createFloatingActions({
		strategy: 'absolute',
		placement: 'right',
		middleware: [
			offset(12),
			shift(),
			autoPlacement({
				allowedPlacements: ['top', 'bottom', 'left', 'right']
			})
		]
	});
</script>

<button
  class="w-12 h-12 bg-neutral-800 border transition-all hover:scale-125 group active:scale-95"
  class:_glow={achievement.percent !== -1 && achievement.percent < 10}
  class:border-red-600={!!achievement.removedAt}
  class:border-transparent={!achievement.removedAt}
	use:floatingRef
	on:mouseenter={() => showTooltip.set(1, { duration: 100 })}
	on:mouseleave={() => showTooltip.set(0, { duration: 0 })}
	on:focus={() => showTooltip.set(1, { duration: 0 })}
	on:blur={() => showTooltip.set(0, { duration: 0 })}
	on:click
	on:click={() => showTooltip.set(0, { duration: 0 })}
>
  <img
    class={achievement.hidden ? 'blur-sm group-hover:blur-0 group-focus:blur-0 grayscale group-hover:grayscale-0 group-focus:grayscale-0 transition-all w-12 h-12 object-contain' : 'transition-all w-12 h-12 object-contain pix'}
    src={achievement.icon}
    alt={achievement.name}
  />
</button>

{#if $showTooltip === 1}
	<Portal target="body">
		<div
			class="sm:max-w-lg max-w-[90svw] text-sm md:text-base z-30 text-left absolute px-2 md:px-4 py-2 bg-neutral-950 border-2 border-black/25 text-white bg-opacity-90 rounded shadow-[0_0_5px_2px_rgba(0,0,0,.75)] backdrop-blur-md flex-col justify-center items-start inline-flex select-none"
			transition:scale={{ duration: 250, start: 0.9 }}
			use:floatingContent
		>
      <div class="flex flex-col">
        <small class="font-bold leading-4 text-neutral-100">{gameName}</small>
        <h5 class="sm:text-lg text-base leading-4 flex gap-1 items-center">
          {#if achievement.hidden}
            <Icon icon={hiddenIcon} />
          {/if}
          <span>{achievement.name}</span>
        </h5>
        {#if achievement.description}
          <p class="text-sm leading-4 mt-1 text-neutral-300">{achievement.description}</p>
        {/if}
      </div>
      {#if achievement.percent !== -1 || unlockedAt || achievement.removedAt}
        <div class="text-xs sm:text-sm mt-2 text-neutral-400 flex flex-col">
          {#if unlockedAt}
            <span>Unlocked on {dtf.format(unlockedAt * 1000)}</span>
          {/if}
          {#if achievement.percent !== -1}
            <span class:text-amber-300={achievement.percent < 10}>{achievement.percent.toFixed(1)}% of players earned this achievement</span>
          {/if}
          {#if achievement.removedAt}
            <span class="text-red-400">This achievement was removed some time before {dayDtf.format(achievement.removedAt)}</span>
          {/if}
        </div>
      {/if}
		</div>
	</Portal>
{/if}

<style lang="scss">
  ._glow {
    box-shadow: rgba(255, 184, 78, 0.6) 0px 0px 2px 1px, rgba(255, 184, 78, 0.4) 0px 0px 16px 1px;
  }
</style>
