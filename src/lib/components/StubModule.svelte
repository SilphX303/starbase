<script lang="ts">
	let {
		title,
		domain,
		milestone,
		color
	}: { title: string; domain: string; milestone: string; color: string } = $props();
</script>

<svelte:head>
	<title>Starbase — {title}</title>
</svelte:head>

<div class="lcars-panel overflow-hidden">
	<div class="{color} text-space px-5 py-4 flex flex-wrap items-end justify-between gap-2">
		<div>
			<h1 class="font-bold text-xl tracking-[0.16em] uppercase">{title}</h1>
			<p class="text-[11px] tracking-[0.14em] opacity-80 uppercase mt-0.5">{domain}</p>
		</div>
		<span class="lcars-code text-space/60">SBS 00-2261 · REFIT</span>
	</div>
	<div class="p-6">
		<p class="lcars-label mb-2">Station status</p>
		<p class="text-dim leading-relaxed">
			This station is not yet commissioned. Scheduled for refit <span class="text-amber font-mono">{milestone}</span>.
		</p>
		<a href="/" class="lcars-pill inline-block mt-6 px-5 py-2 bg-panel-2 text-glow font-bold text-sm hover:bg-amber hover:text-space transition-colors">
			← Return to Bridge
		</a>
	</div>
</div>
