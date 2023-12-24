<script lang="ts">
	import Icon from "@iconify/svelte";
  import steamIcon from "@iconify-icons/mdi/steam";
  import twitterIcon from "@iconify-icons/mdi/twitter";
  import chartIcon from "@iconify-icons/mdi/chart-arc";
  import kofiIcon from "@iconify-icons/simple-icons/kofi";

  export let inline = false;
</script>

<footer class={`flex flex-col items-center justify-center text-center gap-4 text-sm ${inline ? 'max-w-lg' : 'w-full px-4 py-10 mt-10'}`}>
  <div class="flex items-center justify-center gap-2">
    <span>Made by <a href="https://snazzah.com" target="_blank" class="hover:underline text-white">Snazzah</a></span>
    <span>∙</span>
    <a href="https://github.com/Snazzah/steam.exposed" target="_blank" class="hover:underline text-white">Source Code</a>
    <span>∙</span>
    <div class="flex items-center justify-center gap-1">
      <a href="/u/76561198063017988" class="hover:text-white">
        <Icon icon={chartIcon} class="w-6 h-6" />
      </a>
      <a href="https://twitter.com/Snazzah" target="_blank" class="hover:text-white">
        <Icon icon={twitterIcon} class="w-6 h-6" />
      </a>
      <a href="https://steamcommunity.com/id/Snazzah/" target="_blank" class="hover:text-white">
        <Icon icon={steamIcon} class="w-6 h-6" />
      </a>
      <a href="https://ko-fi.com/Snazzah/" target="_blank" class="hover:text-white">
        <Icon icon={kofiIcon} class="w-6 h-6" />
      </a>
    </div>
  </div>
  <div class="flex flex-col items-center justify-center gap-1">
    <span>This website is not affiliated with Steam or Valve.</span>
    <span>Steam and the Steam Logo are trademarks of Valve Corporation. All other trademarks are property of their respective owners.</span>
  </div>
</footer>

