<script lang="ts">
	export let name: string;
	export let small = false;
	export let subtext = '';
</script>

<div class="flex flex-col gap-2 justify-center items-center">
	<div class="flex flex-col justify-center items-center">
		<span
			class={`text-white font-bold whitespace-nowrap ${
				small ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
			}`}
		>
			<slot />
		</span>

		{#if subtext}
			<span class="text-sm">{subtext}</span>
		{/if}
	</div>
	<span class="text-sm md:text-base">{name}</span>
</div>
