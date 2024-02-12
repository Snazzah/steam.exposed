<script lang="ts">
	import type { SteamYearInReview } from '$lib/types';
	import BigStat from '$lib/components/BigStat.svelte';
	import GameGridChild from './GameGridChild.svelte';
	import { createEventDispatcher } from 'svelte';
	import prettyMilliseconds from 'pretty-ms';
	import PlatformSection from './PlatformSection.svelte';
	import MonthViewChart from './MonthViewChart.svelte';
	import MonthShare from './MonthShare.svelte';

	const dispatch = createEventDispatcher<{ select: number }>();

	export let apps: Record<number, string> = {};
	export let yearInReview: SteamYearInReview;

	const data = yearInReview.stats.playtime_stats.months.map((m) => ({
		month: m.rtime_month,
		value: m.stats.total_playtime_percentagex100 / 10000
	}));
	// const gameData = yearInReview.stats.playtime_stats.months.map((m) => ({
	//   month: m.rtime_month,
	//   value: m.game_summary.length
	// }));

	const longDtf = new Intl.DateTimeFormat(undefined, { month: 'long' });

	let selectedMonthIndex = -1;
	let chartType = 0;
	let chartTypes = ['Top Games', 'Platform'];
</script>

<div class="flex flex-col gap-8">
	<div
		class="flex gap-2 md:items-center flex-col md:flex-row md:justify-between px-4 py-2 rounded bg-neutral-900"
	>
		<div class="flex gap-2 items-center">
			<span>Display</span>
			{#each chartTypes as tab, i}
				<button
					class="_tab self-stretch w-fit"
					class:--active={chartType === i}
					on:click={() => (chartType = i)}
				>
					{tab}
				</button>
			{/each}
		</div>
		<MonthShare {yearInReview} {apps} />
	</div>
	<!-- <MonthViewChart
		{yearInReview} {apps} {chartType}
		data={chartType === 2 ? gameData : data} useInt={chartType === 2}
		selectedIndex={selectedMonthIndex}
		on:select={(e) => selectedMonthIndex = e.detail}
	/> -->
	<MonthViewChart
		{yearInReview}
		{apps}
		{chartType}
		{data}
		selectedIndex={selectedMonthIndex}
		on:select={(e) => (selectedMonthIndex = e.detail)}
	/>

	{#if selectedMonthIndex === -1}
		<div class="rounded-md px-4 py-2 transition-colors bg-black/50">
			Click a month column for more information.
		</div>
	{/if}

	{#each Object.keys(yearInReview.stats.playtime_stats.months) as i}
		{@const month = yearInReview.stats.playtime_stats.months[selectedMonthIndex]}
		{#if selectedMonthIndex === Number(i) && data[selectedMonthIndex].value}
			{@const date = new Date(1e3 * (month.rtime_month + 86400))}
			<div class="flex gap-8 justify-around flex-wrap">
				<BigStat
					name={`Playtime in ${longDtf.format(date)}`}
					subtext={`(${(data[selectedMonthIndex].value * 100).toFixed(2)}% of total game playtime)`}
				>
					{prettyMilliseconds(month.stats.total_playtime_seconds * 1000)}
				</BigStat>
				<BigStat name="Sessions">
					{month.stats.total_sessions.toLocaleString()}
				</BigStat>
				<BigStat name="Games Played">
					{month.game_summary.length.toLocaleString()}
				</BigStat>
			</div>
			<PlatformSection {yearInReview} stats={month.relative_monthly_stats} excludeGames />
			<div class="flex flex-col gap-8">
				<h3 class="text-3xl font-extrabold text-white mb-2">Games</h3>
				<div class="flex flex-wrap gap-4 justify-around">
					{#each month.game_summary as monthGame (monthGame.appid)}
						{@const game = yearInReview.stats.playtime_stats.game_summary.find(
							(g) => g.appid === monthGame.appid
						)}
						{#if game}
							{@const playtimeSeconds =
								month.stats.total_playtime_seconds *
								(monthGame.relative_playtime_percentagex100 / 10000)}
							<GameGridChild
								name={apps[monthGame.appid]}
								on:click={() => dispatch('select', monthGame.appid)}
								{game}
								footer={`~${prettyMilliseconds(playtimeSeconds * 1000)}`}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style lang="scss">
	._tab {
		@apply px-4 py-1 rounded-md bg-neutral-800 transition-all;

		&:hover {
			@apply bg-neutral-700;
		}

		&:active {
			@apply scale-95;
		}

		&.--active {
			@apply bg-neutral-600 text-white;
		}
	}
</style>
