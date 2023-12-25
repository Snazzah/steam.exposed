<script lang="ts">
	import { updated } from '$app/stores';
</script>

<header class="w-full bg-black/50 backdrop-blur fixed top-0 left-0 right-0 h-16 z-30">
  <div class="w-full h-full max-w-6xl mx-auto flex items-center justify-between px-4 md:px-10 py-4">
    <div class="flex gap-2 items-center justify-center">
      <a href="/" class="text-white font-bold text-xl">steam.exposed</a>
      {#if $updated}
        <button class="rounded px-2 py-0.5 text-black font-bold text-sm bg-blue-500 hover:bg-blue-400 shadow shadow-blue-500" on:click={() => location.reload()}>
          Site Updated, Refresh!
        </button>
      {/if}
    </div>
    <span></span>
  </div>
</header>
