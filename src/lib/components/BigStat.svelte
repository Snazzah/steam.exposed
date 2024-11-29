<script lang="ts">
	interface Props {
		name: string;
		small?: boolean;
		subtext?: string;
		children?: import('svelte').Snippet;
	}

	let { name, small = false, subtext = '', children }: Props = $props();
</script>

<div class="flex flex-col gap-2 justify-center items-center">
	<div class="flex flex-col justify-center items-center">
		<span
			class={`text-white font-bold whitespace-nowrap ${
				small ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
			}`}
		>
			{@render children?.()}
		</span>

		{#if subtext}
			<span class="text-sm">{subtext}</span>
		{/if}
	</div>
	<span class="text-sm md:text-base">{name}</span>
</div>
