<script lang="ts">
	import Icon, { type IconifyIcon } from "@iconify/svelte";

  export let icon: IconifyIcon | null = null;
  export let href: string;
</script>

<a
  href={href}
  class="inline-flex gap-2 items-center justify-center rounded bg-neutral-600/50 px-4 py-2 transition-opacity hover:opacity-75 active:opacity-50"
  {...(href.startsWith('steam://') ? {} : { target: '_blank' })}
>
  {#if icon}
    <Icon icon={icon} class="w-6 h-6" />
  {/if}
  <span><slot /></span>
</a>
