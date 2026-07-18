<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Starbase — Ship configuration</title>
</svelte:head>

<header class="lcars-panel bg-amber text-space px-5 py-4 mb-4 flex flex-wrap items-end justify-between gap-2">
	<div>
		<h1 class="font-bold text-xl tracking-[0.16em]">SHIP CONFIGURATION</h1>
		<p class="text-[11px] tracking-[0.14em] opacity-80 uppercase mt-0.5">Operating parameters</p>
	</div>
	<span class="lcars-code text-space/60">SBS 07-2261 · PARAMETERS</span>
</header>

<form method="POST" use:enhance class="lcars-panel p-5 grid gap-4 max-w-lg">
	{#if form?.error}<p class="text-alert text-sm">{form.error}</p>{/if}
	{#if form?.saved}<p class="text-teal text-sm">Parameters updated.</p>{/if}

	<label class="flex flex-col gap-1">
		<span class="lcars-label">Ship name</span>
		<input name="shipName" value={data.settings.shipName} class="lcars-input px-4 py-3 outline-none focus:ring-2 focus:ring-amber" />
	</label>

	<label class="flex flex-col gap-1">
		<span class="lcars-label">Calorie floor (minimum safe output)</span>
		<input name="calorieFloor" type="number" value={data.settings.calorieFloor} min="1000" max="3000" class="lcars-input px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-amber" />
		<span class="text-dim text-xs">Below this, no diet XP will be awarded (M4). Sanity-check with your GP or care team.</span>
	</label>

	<label class="flex flex-col gap-1">
		<span class="lcars-label">Calorie target (band upper bound, ≈ TDEE − 300)</span>
		<input name="calorieTarget" type="number" value={data.settings.calorieTarget} min="1200" max="6000" class="lcars-input px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-amber" />
	</label>

	<button type="submit" class="lcars-pill bg-amber text-space font-bold px-6 py-3 hover:bg-orange transition-colors cursor-pointer">
		Commit parameters
	</button>
</form>
