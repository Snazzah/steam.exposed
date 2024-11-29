<script lang="ts">
	import Icon from '@iconify/svelte';
	import minusIcon from '@iconify-icons/mdi/minus';
	import slashIcon from '@iconify-icons/mdi/slash-forward';
	import plusIcon from '@iconify-icons/mdi/plus';

	interface Props {
		value?: -1 | 0 | 1;
		onupdate(value: -1 | 0 | 1): void;
	}

	let { value = 0, onupdate }: Props = $props();
</script>

<div class="flex rounded overflow-hidden bg-neutral-900 gap-[1px]">
	<button class:-active={value === -1} onclick={() => onupdate(-1)}>
		<Icon icon={minusIcon} class="w-6 h-6" />
	</button>
	<button
		class="ring-[1px] ring-neutral-700"
		class:-active={value === 0}
		onclick={() => onupdate(0)}
	>
		<Icon icon={slashIcon} class="w-6 h-6" />
	</button>
	<button class:-active={value === 1} onclick={() => onupdate(1)}>
		<Icon icon={plusIcon} class="w-6 h-6" />
	</button>
</div>

<style lang="scss">
	button {
		@apply w-8 text-center flex items-center justify-center;

		&.-active {
			@apply text-white font-bold;
			&:nth-child(1) {
				@apply bg-red-600;
			}
			&:nth-child(2) {
				@apply bg-neutral-600;
			}
			&:nth-child(3) {
				@apply bg-green-600;
			}
		}
	}
</style>
