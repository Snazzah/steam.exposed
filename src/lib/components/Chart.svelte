<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, type ChartConfiguration } from 'chart.js/auto';

  let canvas: HTMLCanvasElement;
  export let options: ChartConfiguration;
  export let chart: Chart | null = null;
  onMount(()=> {
    const ctx = canvas.getContext('2d')!;
    chart = new Chart(ctx, options as any);
  })

  export let _class = '';
</script>
<canvas bind:this={canvas} class={_class} />
