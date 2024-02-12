<script lang="ts">
	import { page, updated } from '$app/stores';
	import Icon from '@iconify/svelte';
	import arrowIcon from '@iconify-icons/mdi/menu-right';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	let scrollTop = browser ? document.documentElement.scrollTop : 0;
	function onScroll() {
		scrollTop = document.documentElement.scrollTop;
	}
</script>

<svelte:document on:scroll={onScroll} />

<header class="w-full bg-black/50 backdrop-blur fixed top-0 left-0 right-0 h-16 z-30">
	<div class="w-full h-full max-w-6xl mx-auto flex items-center justify-between px-4 md:px-10 py-4">
		<div class="flex gap-2 items-center justify-center">
			<a href="/" class="flex gap-2 text-white font-bold text-xl">
				<img src="/images/icon@128x.png" alt="steam.exposed" class="w-6 h-6" />
				<span>steam.exposed</span>
			</a>
			{#if $page.data.profile && scrollTop > 100}
				<div transition:fade={{ duration: 100 }} class="flex gap-2 items-center justify-center">
					<Icon icon={arrowIcon} class="w-6 h-6" />
					<div class="flex gap-2 items-center justify-center select-none">
						<div class="relative w-8 h-8">
							{#if $page.data.profileItems && $page.data.profileItems.avatar_frame.appid}
								<img
									src={`https://cdn.akamai.steamstatic.com/steamcommunity/public/images/${$page.data.profileItems.avatar_frame.image_small}`}
									class="pointer-events-none absolute top-0 bottom-0 left-0 right-0 scale-[1.22]"
									alt={`${$page.data.profile.personaname}'s Avatar Frame`}
								/>
							{/if}
							<img
								src={$page.data.profileItems && $page.data.profileItems.animated_avatar.appid
									? `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/${$page.data.profileItems.animated_avatar.image_small}`
									: $page.data.profile.avatarfull}
								class="top-0 bottom-0 left-0 right-0"
								alt={$page.data.profile.personaname}
							/>
						</div>
						<span class="text-xl font-semibold text-white truncate md:max-w-60 max-w-20"
							>{$page.data.profile.personaname}</span
						>
					</div>
				</div>
			{/if}
		</div>
		<div>
			{#if $updated}
				<button
					class="rounded px-2 py-0.5 text-black font-bold text-sm bg-blue-500 hover:bg-blue-400 shadow shadow-blue-500"
					on:click={() => location.reload()}
				>
					Site Updated, Refresh!
				</button>
			{/if}
		</div>
	</div>
</header>
