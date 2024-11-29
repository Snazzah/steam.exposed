<script lang="ts">
	import type { AppInfo, SteamYearInReview } from '$lib/types';
	import { page } from '$app/stores';
	import html2canvas from '@wtto00/html2canvas';
	import { loadingIcon, steamIdToInviteUrl } from '$lib/util';
	import prettyMilliseconds from 'pretty-ms';
	import { tick, onDestroy } from 'svelte';
	import Portal from 'svelte-portal';
	import { fade, fly } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import saveIcon from '@iconify-icons/mdi/download';
	import copyIcon from '@iconify-icons/mdi/content-copy';
	import screenshotIcon from '@iconify-icons/mdi/image-size-select-actual';
	import MonthViewChart from './MonthViewChart.svelte';
	import { tweened } from 'svelte/motion';

	interface Props {
		apps?: Record<number, AppInfo>;
		yearInReview: SteamYearInReview;
	}

	let { apps = {}, yearInReview }: Props = $props();
	const data = yearInReview.stats.playtime_stats.months.map((m) => ({
		month: m.rtime_month,
		value: m.stats.total_playtime_percentagex100 / 10000
	}));
	const notifTimer = tweened(0, { duration: 1000 });

	const playtimeStats = yearInReview.stats.playtime_stats;
	const inviteUrl = steamIdToInviteUrl($page.data.profile!.steamid);
	const sharePath = `/y${$page.data.year!.slice(2)}/${inviteUrl}`;

	let chart = $state<HTMLDivElement | undefined>();
	let rendering = $state(false);
	let showModal = $state(false);

	let src = $state('');
	let blob: Blob | null = null;
	async function screenshot() {
		if (src) return (showModal = true);
		rendering = true;
		await tick();
		await tick();
		try {
			const canvas = await html2canvas(chart!, { useCORS: true, scale: 1.5 });
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
		onclick={screenshot}
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
				onclick={onModalClick}
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
							onclick={copy}
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
