<script lang="ts">
	import { onMount } from 'svelte';
	interface Props {
		mount?(): void;
	}
	let { mount }: Props = $props();
	onMount(() => mount?.());
</script>
