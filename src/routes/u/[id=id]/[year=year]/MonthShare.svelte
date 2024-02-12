<script lang="ts">
	import type { SteamYearInReview } from '$lib/types';
	import { page } from '$app/stores';
	import html2canvas from '@wtto00/html2canvas';
	import { steamIdToInviteUrl } from '$lib/util';
	import prettyMilliseconds from 'pretty-ms';
	import { tick, onDestroy } from 'svelte';
	import Portal from 'svelte-portal';
	import { fade, fly } from 'svelte/transition';
	import Icon, { type IconifyIcon } from '@iconify/svelte';
	import saveIcon from '@iconify-icons/mdi/download';
	import copyIcon from '@iconify-icons/mdi/content-copy';
	import screenshotIcon from '@iconify-icons/mdi/image-size-select-actual';
	import MonthViewChart from './MonthViewChart.svelte';
	import { tweened } from 'svelte/motion';

	export let apps: Record<number, string> = {};
	export let yearInReview: SteamYearInReview;
	const data = yearInReview.stats.playtime_stats.months.map((m) => ({
		month: m.rtime_month,
		value: m.stats.total_playtime_percentagex100 / 10000
	}));
	const notifTimer = tweened(0, { duration: 1000 });

	const playtimeStats = yearInReview.stats.playtime_stats;
	const inviteUrl = steamIdToInviteUrl($page.data.profile!.steamid);
	const sharePath = `/y${$page.data.year!.slice(2)}/${inviteUrl}`;

	let chart: HTMLDivElement;
	let rendering = false;
	let showModal = false;

	const loadingIcon: IconifyIcon = {
		width: 24,
		height: 24,
		body: '<defs><linearGradient id="mingcuteLoadingFill0" x1="50%" x2="50%" y1="5.271%" y2="91.793%"><stop offset="0%" stop-color="currentColor"/><stop offset="100%" stop-color="currentColor" stop-opacity=".55"/></linearGradient><linearGradient id="mingcuteLoadingFill1" x1="50%" x2="50%" y1="15.24%" y2="87.15%"><stop offset="0%" stop-color="currentColor" stop-opacity="0"/><stop offset="100%" stop-color="currentColor" stop-opacity=".55"/></linearGradient></defs><g fill="none"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="url(#mingcuteLoadingFill0)" d="M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.502 7.502 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021" transform="translate(1.5 1.625)"/><path fill="url(#mingcuteLoadingFill1)" d="M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.475 10.475 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084a1.5 1.5 0 0 1-.115-2.118" transform="translate(1.5 1.625)"/></g>'
	};

	let src = '';
	let blob: Blob | null = null;
	async function screenshot() {
		if (src) return (showModal = true);
		rendering = true;
		await tick();
		await tick();
		try {
			const canvas = await html2canvas(chart, { useCORS: true, scale: 1.5 });
			blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
			canvas.remove();

			if (blob) {
				src = URL.createObjectURL(blob);
				showModal = true;
			}
		} catch (e) {
			alert('Failed to render image!');
		} finally {
			rendering = false;
		}
	}

	async function copy() {
		if (!blob) return;
		try {
			const clipItem = new ClipboardItem(
				Object.defineProperty({}, blob.type, {
					value: blob,
					enumerable: true
				})
			);
			await navigator.clipboard.write([clipItem]);
			notifTimer.set(1, { duration: 0 });
			notifTimer.set(0);
		} catch (e) {
			alert('Failed to copy, you can right click the image and "Save image as..." instead.');
		}
	}

	function onModalClick(this: any, e: any) {
		if (e.target === this) showModal = false;
	}

	onDestroy(() => {
		if (src) URL.revokeObjectURL(src);
	});
</script>

{#if $page.data.profile}
	<button
		class="flex gap-2 opacity-50 hover:opacity-75 active:opacity-100 transition-opacity md:flex-row-reverse"
		on:click={screenshot}
		disabled={rendering}
		title="Create screenshot of chart"
	>
		<Icon
			icon={rendering ? loadingIcon : screenshotIcon}
			class={`w-6 h-6${rendering ? ' animate-spin' : ''}`}
		/>
		<span>{rendering ? 'rendering' : 'screenshot'}</span>
	</button>

	{#if rendering}
		<!-- <div class="border-white border"> -->
		<div class="w-0 h-0 overflow-hidden absolute">
			<div
				class="w-[800px] h-[400px] relative bg-neutral-950 flex flex-col pointer-events-none select-none"
				bind:this={chart}
			>
				<div class="bg-black/50 flex p-4 gap-4 h-24 relative">
					<img
						src={$page.data.profile.avatarfull}
						class="w-16 h-16 rounded bg-neutral-700"
						alt={$page.data.profile.personaname}
					/>
					<div class="flex flex-col">
						<b class="text-white text-xl">{$page.data.profile.personaname}</b>
						<span>{$page.data.year} Year In Review</span>
					</div>
					<span class="absolute bottom-3 right-2 tracking-tighter flex">
						<code class="text-white">steam.exposed</code>
						<code class="opacity-75">{sharePath}</code>
					</span>
				</div>
				<div
					class="flex justify-around bg-black/25 h-6 leading-[0] pt-1 text-sm border-t border-white/10"
				>
					<span
						><span class="text-white"
							>{prettyMilliseconds(playtimeStats.total_stats.total_playtime_seconds * 1000, {
								compact: true,
								verbose: true
							})}</span
						> of playtime</span
					>
					<span
						><span class="text-white">{playtimeStats.game_summary.length.toLocaleString()}</span> games</span
					>
					<span
						><span class="text-white"
							>{playtimeStats.total_stats.total_sessions.toLocaleString()}</span
						> sessions</span
					>
					<span
						><span class="text-white"
							>{playtimeStats.summary_stats.total_achievements.toLocaleString()}</span
						> achievements</span
					>
				</div>
				<div class="p-4">
					<!-- <div class="px-4 py-8"> -->
					<MonthViewChart {yearInReview} {apps} {data} canvasFix />
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal Portal -->
	{#if showModal && src}
		<Portal target="body">
			<div
				transition:fade={{ duration: 100 }}
				class="fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-25 backdrop-blur-sm select-none flex items-end md:items-center justify-center md:px-8 z-30"
				aria-hidden="true"
				on:click={onModalClick}
			>
				<div
					transition:fly={{ duration: 250, y: 32 }}
					class="w-[1024px] max-h-[calc(100svh-6rem)] relative text-neutral-200 rounded-t md:rounded-b shadow-lg flex-col justify-start items-start inline-flex overflow-hidden"
				>
					<img
						class="rounded border-4 border-neutral-800"
						draggable
						{src}
						alt={`${$page.data.profile.personaname}'s ${$page.data.year} Year in Review Month Chart`}
					/>
					<div class="flex w-full md:mt-2 bg-neutral-800 md:bg-transparent gap-2">
						<a
							class="flex gap-2 items-center justify-center w-full md:rounded px-2 py-4 md:bg-neutral-800 hover:bg-neutral-700 transition-colors"
							href={src}
							download={`steamexposed_${inviteUrl}-${$page.data.year}_month.png`}
						>
							<Icon icon={saveIcon} class="w-6 h-6" />
							<span>Save</span>
						</a>
						<button
							class="flex gap-2 items-center justify-center w-full md:rounded px-2 py-4 md:bg-neutral-800 hover:bg-neutral-700 transition-colors"
							on:click={copy}
						>
							<Icon icon={copyIcon} class="w-6 h-6" />
							<span>{$notifTimer === 0 ? 'Copy' : 'Copied!'}</span>
						</button>
					</div>
				</div>
			</div>
		</Portal>
	{/if}
{/if}
