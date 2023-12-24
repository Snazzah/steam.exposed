<script lang="ts">
	import Icon from "@iconify/svelte";
  import sendIcon from "@iconify-icons/mdi/send";
  import menuIcon from '@iconify-icons/mdi/menu-down';
	import Footer from "$lib/components/Footer.svelte";

  // TODO metadata, favicon
  // TODO working input, year dropdown
  // TODO make new icon?
</script>
<main class="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
  <div class="bg-[url('/steam_fade.svg')] bg-contain bg-no-repeat bg-center flex flex-col justify-end text-center pt-60">
    <h1 class="_shadow text-white font-bold text-4xl">steam.exposed</h1>
    <span  class="_shadow">Breakdowns of Steam's Year in Reviews</span>
  </div>
  <div class="relative w-full max-w-lg">
    <input class="w-full px-4 py-2 transition-all border border-neutral-600 hover:border-neutral-400 rounded bg-neutral-900 placeholder:text-neutral-600" placeholder="Steam ID 64 / Custom URL" />
    <div class="flex absolute right-0 transition-all h-full top-0 bottom-0">
      <button class="flex h-full hover:text-white items-center justify-center">
        <span>2023</span>
        <Icon icon={menuIcon} class="w-6 h-6" />
      </button>
      <button class="hover:text-white transition-all h-full px-4">
        <Icon icon={sendIcon} class="w-5 h-5" />
      </button>
    </div>
  </div>
  <Footer inline />
</main>

<style lang="scss">
  ._shadow {
    filter: drop-shadow(0px 0px 2px black);
  }
</style>
