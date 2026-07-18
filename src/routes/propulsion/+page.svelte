<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	const TYPES = ['walk', 'run', 'cycle', 'swim', 'strength', 'stretch', 'other'];
	const maxSteps = $derived(Math.max(1, ...data.steps.map((s) => s.steps ?? 0)));
	const activeDays = $derived(new Set(data.sessions.map((s) => s.startedAt.toISOString().slice(0, 10))).size);
</script>

<svelte:head>
	<title>Starbase — Propulsion</title>
</svelte:head>

<header class="lcars-panel bg-lavender text-space px-5 py-4 mb-4 flex flex-wrap items-end justify-between gap-2">
	<div>
		<h1 class="font-bold text-xl tracking-[0.16em]">PROPULSION</h1>
		<p class="text-[11px] tracking-[0.14em] opacity-80 uppercase mt-0.5">Exercise & movement</p>
	</div>
	<span class="lcars-code text-space/60">SBS 04-2261 · DRIVE SYSTEMS</span>
</header>

{#if form?.error}<p class="text-alert text-sm mb-3">{form.error}</p>{/if}
{#if form?.ok}<p class="text-teal text-sm mb-3">Logged. Thrusters recalibrated.</p>{/if}

<!-- Week summary -->
<section class="lcars-panel p-5 mb-4 flex flex-wrap gap-6">
	<div>
		<p class="lcars-label">Active minutes (7 days)</p>
		<p class="lcars-readout text-3xl">{data.activeMinutes}<span class="text-dim text-base"> min</span></p>
	</div>
	<div>
		<p class="lcars-label">Active days (7 days)</p>
		<p class="lcars-readout text-3xl">{activeDays}<span class="text-dim text-base"> / 7</span></p>
	</div>
	<div class="flex-1 min-w-48">
		<p class="lcars-label mb-1">Rest-day doctrine</p>
		<p class="text-dim text-xs leading-relaxed">Six active days is a full-power week; the seventh is scheduled maintenance. Rest is part of the mission, not a failure of it.</p>
	</div>
</section>

<!-- Log session -->
<section class="lcars-panel p-5 mb-4">
	<h2 class="lcars-label mb-3">Log exercise session</h2>
	<form method="POST" action="?/logSession" use:enhance class="flex flex-wrap items-end gap-3">
		<label class="flex flex-col gap-1">
			<span class="lcars-label">Type</span>
			<select name="type" class="lcars-input px-4 py-3 outline-none focus:ring-2 focus:ring-lavender">
				{#each TYPES as t (t)}<option value={t}>{t}</option>{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1">
			<span class="lcars-label">Minutes</span>
			<input name="durationMin" type="number" min="1" max="600" required class="lcars-input px-4 py-3 w-24 font-mono outline-none focus:ring-2 focus:ring-lavender" />
		</label>
		<label class="flex flex-col gap-1">
			<span class="lcars-label">Intensity</span>
			<select name="intensity" class="lcars-input px-4 py-3 outline-none focus:ring-2 focus:ring-lavender">
				<option value="low">low</option>
				<option value="moderate" selected>moderate</option>
				<option value="high">high</option>
			</select>
		</label>
		<label class="flex flex-col gap-1">
			<span class="lcars-label">kcal (optional)</span>
			<input name="kcalEst" type="number" min="0" max="5000" class="lcars-input px-4 py-3 w-24 font-mono outline-none focus:ring-2 focus:ring-lavender" />
		</label>
		<label class="flex flex-col gap-1">
			<span class="lcars-label">Date</span>
			<input name="d" type="date" value={data.today} max={data.today} class="lcars-input px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-lavender" />
		</label>
		<button type="submit" class="lcars-pill bg-lavender text-space font-bold px-6 py-3 hover:bg-amber transition-colors cursor-pointer">Log</button>
	</form>
</section>

<!-- Steps -->
<section class="lcars-panel p-5 mb-4">
	<div class="flex flex-wrap items-end justify-between gap-3 mb-3">
		<h2 class="lcars-label">Steps</h2>
		<form method="POST" action="?/logSteps" use:enhance class="flex items-end gap-2">
			<label class="flex flex-col gap-1">
				<span class="lcars-label">Steps</span>
				<input name="steps" type="number" min="0" max="200000" required class="lcars-input px-3 py-2 w-28 font-mono text-sm outline-none focus:ring-2 focus:ring-lavender" />
			</label>
			<label class="flex flex-col gap-1">
				<span class="lcars-label">Date</span>
				<input name="d" type="date" value={data.today} max={data.today} class="lcars-input px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-lavender" />
			</label>
			<button type="submit" class="lcars-pill bg-lavender text-space font-bold text-sm px-4 py-2 hover:bg-amber transition-colors cursor-pointer">Set</button>
		</form>
	</div>
	{#if data.steps.length}
		<div class="flex items-end gap-1 h-28">
			{#each data.steps as s (s.date)}
				<div class="flex-1 flex flex-col items-center gap-1 min-w-0">
					<span class="text-dim text-[10px] font-mono">{s.steps != null ? (s.steps >= 1000 ? Math.round(s.steps / 1000) + 'k' : s.steps) : ''}</span>
					<div class="w-full rounded-t-md bg-lavender" style="height: {Math.max(2, Math.round(((s.steps ?? 0) / maxSteps) * 80))}px"></div>
					<span class="text-dim text-[10px] font-mono">{s.date.slice(8)}</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-dim text-sm">No step data yet — enter today's count or wire up a sync bridge later.</p>
	{/if}
</section>

<!-- Sessions -->
<section class="lcars-panel p-5">
	<h2 class="lcars-label mb-2">Sessions (last 7 days)</h2>
	{#if data.sessions.length === 0}
		<p class="text-dim text-sm">No sessions logged.</p>
	{:else}
		<ul class="divide-y divide-panel-2">
			{#each data.sessions as s (s.id)}
				<li class="py-2 flex items-center justify-between gap-3">
					<p class="text-sm">
						<span class="text-dim font-mono">{s.startedAt.toISOString().slice(0, 10)}</span>
						· <span class="capitalize">{s.type}</span>
						· <span class="font-mono">{s.durationMin} min</span>
						· {s.intensity}
						{#if s.kcalEst}<span class="text-dim font-mono"> · ~{s.kcalEst} kcal</span>{/if}
					</p>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={s.id} />
						<button type="submit" aria-label="Remove session" class="text-dim hover:text-alert text-lg leading-none cursor-pointer px-2">×</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>
