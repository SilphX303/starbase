<script lang="ts">
	import { enhance } from '$app/forms';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	const latestWeight = $derived(data.weightSeries.at(-1) ?? null);
	const latestWaist = $derived(data.waistSeries.at(-1) ?? null);

	function emaDelta(series: { ema: number }[], back = 30): number | null {
		if (series.length < 2) return null;
		const last = series[series.length - 1].ema;
		const ref = series[Math.max(0, series.length - 1 - back)].ema;
		return Math.round((last - ref) * 10) / 10;
	}
	const weightDelta = $derived(emaDelta(data.weightSeries));
	const waistDelta = $derived(emaDelta(data.waistSeries));
</script>

<svelte:head>
	<title>Starbase — Hull Integrity</title>
</svelte:head>

<header class="lcars-panel bg-salmon text-space px-5 py-4 mb-4">
	<h1 class="font-bold text-xl tracking-widest">HULL INTEGRITY</h1>
	<p class="text-xs tracking-wider opacity-80 uppercase">Body composition — trend over datapoint</p>
</header>

{#if form?.error}<p class="text-alert text-sm mb-3">{form.error}</p>{/if}
{#if form?.ok}<p class="text-teal text-sm mb-3">Bridge report logged.</p>{/if}

<!-- Log forms -->
<section class="lcars-panel p-5 mb-4">
	<h2 class="lcars-label mb-3">Bridge report</h2>
	<div class="flex flex-wrap gap-6">
		<form method="POST" action="?/log" use:enhance class="flex items-end gap-2">
			<input type="hidden" name="type" value="weight" />
			<label class="flex flex-col gap-1">
				<span class="lcars-label">Weight (kg)</span>
				<input name="value" type="number" step="0.1" min="30" max="350" required class="bg-panel-2 rounded-xl px-4 py-3 w-32 font-mono outline-none focus:ring-2 focus:ring-salmon" />
			</label>
			<button type="submit" class="lcars-pill bg-salmon text-space font-bold px-5 py-3 hover:bg-amber transition-colors cursor-pointer">Log</button>
		</form>
		<form method="POST" action="?/log" use:enhance class="flex items-end gap-2">
			<input type="hidden" name="type" value="waist" />
			<label class="flex flex-col gap-1">
				<span class="lcars-label">Waist (cm)</span>
				<input name="value" type="number" step="0.1" min="40" max="250" required class="bg-panel-2 rounded-xl px-4 py-3 w-32 font-mono outline-none focus:ring-2 focus:ring-salmon" />
			</label>
			<button type="submit" class="lcars-pill bg-salmon text-space font-bold px-5 py-3 hover:bg-amber transition-colors cursor-pointer">Log</button>
		</form>
	</div>
	<p class="text-dim text-xs mt-3">Daily weigh-in, weekly waist is plenty. The trend line is what matters — single readings bounce around and that's normal.</p>
</section>

<!-- Trends -->
<div class="grid gap-4 lg:grid-cols-2">
	<section class="lcars-panel p-5">
		<div class="flex items-baseline justify-between mb-2">
			<h2 class="lcars-label">Weight trend (90 days)</h2>
			{#if latestWeight}
				<p class="font-mono">
					<span class="text-xl">{latestWeight.ema}</span><span class="text-dim text-sm"> kg trend</span>
					{#if weightDelta !== null}
						<span class="text-sm {weightDelta <= 0 ? 'text-teal' : 'text-amber'}">({weightDelta > 0 ? '+' : ''}{weightDelta})</span>
					{/if}
				</p>
			{/if}
		</div>
		<TrendChart points={data.weightSeries} unit="kg" color="var(--color-salmon)" />
	</section>
	<section class="lcars-panel p-5">
		<div class="flex items-baseline justify-between mb-2">
			<h2 class="lcars-label">Waist trend (90 days)</h2>
			{#if latestWaist}
				<p class="font-mono">
					<span class="text-xl">{latestWaist.ema}</span><span class="text-dim text-sm"> cm trend</span>
					{#if waistDelta !== null}
						<span class="text-sm {waistDelta <= 0 ? 'text-teal' : 'text-amber'}">({waistDelta > 0 ? '+' : ''}{waistDelta})</span>
					{/if}
				</p>
			{/if}
		</div>
		<TrendChart points={data.waistSeries} unit="cm" color="var(--color-teal)" />
	</section>
</div>

<!-- Recent readings -->
{#if data.recent.length}
	<section class="lcars-panel p-5 mt-4">
		<h2 class="lcars-label mb-2">Recent readings</h2>
		<ul class="divide-y divide-panel-2">
			{#each data.recent as m (m.id)}
				<li class="py-2 flex items-center justify-between gap-3">
					<p class="font-mono text-sm">
						<span class="text-dim">{m.takenAt.toISOString().slice(0, 10)}</span>
						· {m.type} · <span class="text-glow">{m.value} {m.unit}</span>
					</p>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={m.id} />
						<button type="submit" aria-label="Remove reading" class="text-dim hover:text-alert text-lg leading-none cursor-pointer px-2">×</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}
