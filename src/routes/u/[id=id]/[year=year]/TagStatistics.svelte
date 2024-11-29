<script lang="ts">
	import type { SteamYearInReview } from '$lib/types';

	interface Props {
		tags?: { tagid: number; name: string }[];
		yearInReview: SteamYearInReview;
	}

	let { tags = [], yearInReview }: Props = $props();
</script>

<div>
	<h3 class="text-3xl font-extrabold text-white mb-6">Games by Tag</h3>
	<dl class="flex flex-col gap-1">
		{#each yearInReview.stats.playtime_stats.tag_stats.stats as tag (tag.tag_id)}
			{@const taginfo = tags.find((t) => tag.tag_id === t.tagid)}
			<div class="flex items-center justify-center gap-2">
				<dt class="text-sm w-32 text-right">{taginfo ? taginfo.name : `Tag ${tag.tag_id}`}</dt>
				<dd
					class="w-full h-10 relative bg-black/20 overflow-hidden rounded-md border border-white/25 p-1"
				>
					<div class="bg-white h-full rounded" style:width={`${tag.tag_weight}%`}></div>
					<code class="absolute right-2 top-1 bottom-1 font-m text-white font-bold drop-shadow">
						{tag.tag_weight.toFixed(2)}%
					</code>
				</dd>
			</div>
		{/each}
	</dl>
</div>
