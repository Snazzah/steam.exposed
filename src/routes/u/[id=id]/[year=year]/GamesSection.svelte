<script lang="ts">
	import BigStat from '$lib/components/BigStat.svelte';
	import type { SteamYearInReview } from '$lib/types';
	import PercentChart from '$lib/components/PercentChart.svelte';

	interface Props {
		yearInReview: SteamYearInReview;
	}

	let { yearInReview }: Props = $props();
	let games = yearInReview.stats.playtime_stats.game_summary;
	const YEAR = 31536e3;
	const endDate = new Date(`December 15 ${yearInReview.stats.year}`).getTime() / 1e3;

	function makeReleaseDateChart() {
		const parts = [
			{
				name: `New Releases (in ${yearInReview.stats.year})`,
				color: '#d67070',
				value: 0
			},
			{
				name: 'Recent Favorites (1-7 years ago)',
				color: '#683db4',
				value: 0
			},
			{
				name: 'Classic Games (>8 years ago)',
				color: '#3898b0',
				value: 0
			}
		];

		for (const game of games) {
			if (!game.rtime_release_date || (game.rtime_release_date || endDate) / YEAR >= endDate)
				parts[0].value++;
			else {
				const years = (endDate - game.rtime_release_date) / YEAR;
				if (years < 1) parts[0].value++;
				else if (years <= 7) parts[1].value++;
				else parts[2].value++;
			}
		}

		return parts;
	}
</script>

<div class="flex flex-col gap-8">
	<h3 class="text-3xl font-extrabold text-white mb-2">Games</h3>
	<div class="flex gap-8 justify-around flex-wrap">
		<BigStat
			name="Games Played"
			subtext={`(${yearInReview.stats.playtime_stats.summary_stats.total_games_with_achievements.toLocaleString()} games with achievements)`}
		>
			{games.filter((g) => !g.demo && !g.playtest).length.toLocaleString()}
		</BigStat>
		<BigStat name="New Games Played">
			{games.filter((g) => !g.demo && !g.playtest && g.new_this_year).length.toLocaleString()}
		</BigStat>
		<BigStat name="Demos Played">
			{games.filter((g) => g.demo).length.toLocaleString()}
		</BigStat>
		<BigStat name="Playtests Played">
			{games.filter((g) => g.playtest).length.toLocaleString()}
		</BigStat>
	</div>
	<div class="flex flex-col gap-4">
		<h3 class="text-2xl font-bold text-white mb-2">Type</h3>
		<PercentChart
			data={[
				{
					name: 'Game',
					color: '#22d3ee',
					value: games.filter((g) => !g.demo && !g.playtest).length
				},
				{
					name: 'Demo',
					color: '#a3e635',
					value: games.filter((g) => g.demo).length
				},
				{
					name: 'Playtest',
					color: '#57534e',
					value: games.filter((g) => g.playtest).length
				}
			]}
		/>
	</div>
	<div class="flex flex-col gap-4">
		<h3 class="text-2xl font-bold text-white mb-2">New Games Played This Year</h3>
		<PercentChart
			data={[
				{
					name: 'Game',
					color: '#22d3ee',
					value: games.filter((g) => !g.demo && !g.playtest && g.new_this_year).length
				},
				{
					name: 'Demo',
					color: '#a3e635',
					value: games.filter((g) => g.demo && g.new_this_year).length
				},
				{
					name: 'Playtest',
					color: '#57534e',
					value: games.filter((g) => g.playtest && g.new_this_year).length
				}
			]}
		/>
	</div>
	<div class="flex flex-col gap-4">
		<h3 class="text-2xl font-bold text-white mb-2">Release Date</h3>
		<PercentChart data={makeReleaseDateChart()} />
	</div>
</div>
