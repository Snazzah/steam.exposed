<script lang="ts">
	import Icon, { type IconifyIcon } from '@iconify/svelte';

	interface Props {
		icon?: IconifyIcon | null;
		href: string;
		className?: string;
		highlight?: boolean;
		children?: import('svelte').Snippet;
	}

	let { icon = null, href, className = '', highlight = false, children }: Props = $props();
</script>

<a
	{href}
	class={`inline-flex gap-2 items-center justify-center rounded bg-neutral-600/50 px-4 py-2 transition-opacity hover:opacity-75 active:opacity-50 relative ${className}`}
	{...href.startsWith('steam://') ? {} : { target: '_blank' }}
>
	{#if highlight}
		<span
			class="absolute top-0 bottom-0 left-0 right-0 ring-2 ring-offset-2 ring-blue-500 ring-offset-neutral-950 pointer-events-none select-none rounded animate-pulse"
		></span>
	{/if}
	{#if icon}
		<Icon {icon} class="w-6 h-6" />
	{/if}
	<span>{@render children?.()}</span>
</a>
