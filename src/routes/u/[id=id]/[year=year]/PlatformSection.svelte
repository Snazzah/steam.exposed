<script lang="ts">
	import prettyMilliseconds from 'pretty-ms';
	import type { SteamYearInReview, YearInReviewGameStats } from '$lib/types';
	import BigStat from '$lib/components/BigStat.svelte';
	import PercentChart from '$lib/components/PercentChart.svelte';
	import { makePlaytimeFunction } from '$lib/util';

	export let yearInReview: SteamYearInReview;
	export let stats: YearInReviewGameStats;
	let games = yearInReview.stats.playtime_stats.game_summary;
	export let excludeGames = false;

	const getPlaytime = makePlaytimeFunction(stats);

	let platforms = [
		{
			name: 'Windows',
			percent: stats.windows_playtime_percentagex100 / 100,
			playtime: getPlaytime('windows'),
			sessions: stats.windows_sessions,
			games: games.filter((g) => g.played_windows).length,
			color: '#d67070'
		},
		{
			name: 'Mac OS',
			percent: stats.macos_playtime_percentagex100 / 100,
			playtime: getPlaytime('macos'),
			sessions: stats.macos_sessions,
			games: games.filter((g) => g.played_mac).length,
			color: '#46ab46'
		},
		{
			name: 'Linux',
			percent: stats.linux_playtime_percentagex100 / 100,
			playtime: getPlaytime('linux'),
			sessions: stats.linux_sessions,
			games: games.filter((g) => g.played_linux).length,
			color: '#683db4'
		},
		{
			name: 'Steam Deck',
			percent: stats.deck_playtime_percentagex100 / 100,
			playtime: getPlaytime('deck'),
			sessions: stats.deck_sessions,
			games: games.filter((g) => g.played_deck).length,
			color: '#3898b0'
		},
		{
			name: 'Virtual Reality',
			percent: stats.vr_playtime_percentagex100 / 100,
			playtime: getPlaytime('vr'),
			sessions: stats.vr_sessions,
			games: games.filter((g) => g.played_vr).length,
			color: '#c7b84e'
		}
	];
</script>

<div class="flex flex-col gap-8">
	<h3 class="text-3xl font-extrabold text-white mb-2">Platforms</h3>
	<div class="flex flex-col gap-4">
		<h3 class="text-2xl font-bold text-white mb-2">Playtime</h3>
		<PercentChart
			formatMs
			data={platforms.map((p) => ({
				name: p.name,
				color: p.color,
				value: Math.round(p.playtime)
			}))}
		/>
	</div>
	<div class="flex flex-col gap-4">
		<h3 class="text-2xl font-bold text-white mb-2">Sessions</h3>
		<PercentChart
			data={platforms.map((p) => ({
				name: p.name,
				color: p.color,
				value: p.sessions
			}))}
		/>
	</div>
	{#if !excludeGames}
		<div class="flex flex-col gap-4">
			<h3 class="text-2xl font-bold text-white mb-2">Games Played</h3>
			<PercentChart
				data={platforms.map((p) => ({
					name: p.name,
					color: p.color,
					value: p.games
				}))}
			/>
		</div>
	{/if}
	<div class="flex flex-col gap-4">
		<h3 class="text-2xl font-bold text-white mb-2">With Controller</h3>
		<div class="flex gap-8 justify-around flex-wrap p-4">
			<BigStat
				name="Total Playtime"
				subtext={`(${stats.controller_playtime_percentagex100 / 100}%)`}
			>
				{prettyMilliseconds(Math.round(getPlaytime('controller')) * 1000)}
			</BigStat>
			<BigStat
				name="Sessions"
				subtext={`(${((stats.controller_sessions / stats.total_sessions) * 100).toFixed(2)}%)`}
			>
				{stats.controller_sessions.toLocaleString()}
			</BigStat>
			{#if !excludeGames}
				<BigStat
					name="Games Played"
					subtext={`(${(
						(games.filter((g) => g.played_controller).length / games.length) *
						100
					).toFixed(2)}%)`}
				>
					{games.filter((g) => g.played_controller).length.toLocaleString()}
				</BigStat>
				<BigStat
					name="Demos Played"
					subtext={`(${(
						(games.filter((g) => g.demo && g.played_controller).length /
							games.filter((g) => g.demo).length) *
						100
					).toFixed(2)}%)`}
				>
					{games.filter((g) => g.demo && g.played_controller).length.toLocaleString()}
				</BigStat>
			{/if}
		</div>
	</div>
</div>
