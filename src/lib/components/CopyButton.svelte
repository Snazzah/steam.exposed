<script lang="ts">
	import Icon, { type IconifyIcon } from "@iconify/svelte";
  import copyIcon from "@iconify-icons/mdi/content-copy";
	import { tweened } from "svelte/motion";
	import { quartIn } from "svelte/easing";

  export let icon: IconifyIcon = copyIcon;
  export let title = 'Copy';
  export let text = '';

	const copyShareUrlTooltip = tweened(0, { duration: 500, easing: quartIn });
</script>

<button
  class="relative group"
  {title}
  on:click={() => {
    copyShareUrlTooltip.set(1, { duration: 0 });
    copyShareUrlTooltip.set(0);
    navigator.clipboard.writeText(text);
  }}
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
  <Icon icon={icon} class="w-4 h-4 opacity-50 group-hover:opacity-100" />
</button>
