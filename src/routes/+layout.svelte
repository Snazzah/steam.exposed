<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/source-code-pro';
	import '../app.css';
	import { PUBLIC_PLAUSIBLE_HOSTNAME, PUBLIC_DOMAIN } from '$env/static/public';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	{#if PUBLIC_PLAUSIBLE_HOSTNAME}
		<script
			data-domain={PUBLIC_DOMAIN}
			src="https://{PUBLIC_PLAUSIBLE_HOSTNAME}/js/script.js"
		></script>
	{/if}
</svelte:head>

{@render children?.()}
