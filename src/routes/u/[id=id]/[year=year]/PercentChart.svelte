<script lang="ts">
	import Icon, { type IconifyIcon } from "@iconify/svelte";
	import prettyMilliseconds from "pretty-ms";

  export let data: {
    icon?: IconifyIcon;
    name: string;
    color: string;
    value: number;
  }[] = [];
  export let formatMs = false;
  $: completeValue = data.reduce((p, v) => p + v.value, 0);
</script>

<div class="flex flex-col gap-4">
  <div class="flex relative h-4">
    {#each data as part}
      <span
        class="h-full"
        style:width={`${(part.value / completeValue) * 100}%`}
        style:background-color={part.color}
        title={`${part.name}: ${formatMs ? prettyMilliseconds(part.value * 1000) : part.value.toLocaleString()}`}
      />
    {/each}
  </div>
  <div class="flex gap-4 justify-around flex-col items-start md:flex-row md:items-center flex-wrap">
    {#each data as part}
      {#if part.value !== 0}
        <div class="flex gap-2 justify-center items-center whitespace-nowrap text-sm">
          {#if part.icon}
            <Icon icon={part.icon} class="w-4 h-4" color={part.color} />
          {:else}
            <span class="rounded-full w-4 h-4" style:background-color={part.color} />
          {/if}
          {part.name}:

          <b class="text-white">
            {formatMs ? prettyMilliseconds(part.value * 1000) : part.value.toLocaleString()}
          </b>

          {#if part.value !== 0}
            <i class="text-xs">({((part.value / completeValue) * 100).toFixed(2)}%)</i>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>
