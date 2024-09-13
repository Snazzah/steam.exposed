<script lang="ts">
	import { plural, showLowestFixed } from '$lib/util';
	import Icon from '@iconify/svelte';
  import awardIcon from '@iconify-icons/mdi/medal';

  export let achAmount: number;
  export let achTotal: number;
  export let achEarned: number;
  export let achEarnedBefore: number;
  export let completed: boolean;
  export let earnedPercent: number;
</script>

<div class="flex justify-between font-medium">
  <span>
    {plural(achAmount, 'achievement')} earned
    {#if achTotal !== 0}
      out of {achTotal.toLocaleString()}
    {/if}
    {#if achEarnedBefore > 1}
      ({achEarnedBefore.toLocaleString()} earned before)
    {/if}
  </span>
  {#if achTotal !== 0}
    <div class={completed ? 'flex gap-1 text-white justify-center items-center' : 'flex gap-1 justify-center items-center'}>
      {#if completed}
        <Icon icon={awardIcon} class="w-5 h-5" title="Completed!" />
      {/if}
      <span class:font-bold={completed} class:text-blue-300={achEarnedBefore === 0}>
        {Math.round(((achEarned + achEarnedBefore) / achTotal) * 100)}%
      </span>
      {#if achEarnedBefore !== 0}
        <span class="text-blue-400">(+{showLowestFixed(earnedPercent)}%)</span>
      {/if}
    </div>
  {/if}
</div>
{#if achTotal !== 0}
  <div class="relative rounded-full bg-neutral-700 w-full h-2 overflow-hidden">
    <div class="h-full bg-blue-400 absolute left-0" style:width={`${((achEarned + achEarnedBefore) / achTotal) * 100}%`} />
    <div class="h-full bg-blue-600 absolute left-0" style:width={`${(achEarnedBefore / achTotal) * 100}%`} />
  </div>
{/if}
