<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	const MEALS = [
		{ key: 'breakfast', label: 'Alpha Shift — Breakfast' },
		{ key: 'lunch', label: 'Beta Shift — Lunch' },
		{ key: 'dinner', label: 'Gamma Shift — Dinner' },
		{ key: 'snack', label: 'Ration Supplements — Snacks' }
	] as const;

	let quickAddMeal = $state<string | null>(null);

	const byMeal = $derived(
		Object.fromEntries(MEALS.map((m) => [m.key, data.entries.filter((e) => e.meal === m.key)]))
	);

	const inBand = $derived(
		data.totals.kcal >= data.settings.calorieFloor && data.totals.kcal <= data.settings.calorieTarget
	);
	const bandPct = $derived(
		Math.min(100, Math.round((data.totals.kcal / data.settings.calorieTarget) * 100))
	);

	function shiftDay(offset: number): string {
		const dt = new Date(`${data.d}T12:00:00`);
		dt.setDate(dt.getDate() + offset);
		return dt.toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>Starbase — Reactor Core</title>
</svelte:head>

<header class="lcars-panel overflow-hidden mb-4">
	<div class="bg-orange text-space px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap">
		<div>
			<h1 class="font-bold text-xl tracking-widest">REACTOR CORE</h1>
			<p class="text-xs tracking-wider opacity-80 uppercase">Fuel intake log</p>
		</div>
		<div class="flex items-center gap-2 text-sm font-bold">
			<a href="/reactor?d={shiftDay(-1)}" class="px-3 py-1 rounded-full bg-space/20 hover:bg-space/40">←</a>
			<span class="font-mono">{data.d === data.today ? 'TODAY' : data.d}</span>
			{#if data.d < data.today}
				<a href="/reactor?d={shiftDay(1)}" class="px-3 py-1 rounded-full bg-space/20 hover:bg-space/40">→</a>
			{/if}
		</div>
	</div>
	<div class="p-5">
		<div class="flex items-baseline justify-between flex-wrap gap-2">
			<p class="font-mono text-3xl tabular-nums">
				{data.totals.kcal}<span class="text-dim text-base"> / {data.settings.calorieFloor}–{data.settings.calorieTarget} kcal</span>
			</p>
			<p class="lcars-label">
				{#if data.totals.kcal === 0}No intake logged
				{:else if data.totals.kcal < data.settings.calorieFloor}Below minimum safe output
				{:else if inBand}Reactor within operating band
				{:else}Above operating band{/if}
			</p>
		</div>
		<div class="mt-3 h-3 rounded-full bg-panel-2 overflow-hidden relative">
			<div
				class="h-full rounded-full {inBand ? 'bg-teal' : 'bg-amber'}"
				style="width: {bandPct}%"
			></div>
			<div
				class="absolute top-0 h-full w-0.5 bg-glow/40"
				style="left: {Math.round((data.settings.calorieFloor / data.settings.calorieTarget) * 100)}%"
			></div>
		</div>
		<div class="mt-3 flex gap-4 text-sm text-dim flex-wrap">
			<span>P <span class="text-glow font-mono">{data.totals.proteinG}g</span></span>
			<span>C <span class="text-glow font-mono">{data.totals.carbsG}g</span></span>
			<span>F <span class="text-glow font-mono">{data.totals.fatG}g</span></span>
			<span>Fibre <span class="text-glow font-mono">{data.totals.fibreG}g</span></span>
		</div>
	</div>
</header>

{#if form?.error}
	<p class="text-alert text-sm mb-3">{form.error}</p>
{/if}

<div class="grid gap-3">
	{#each MEALS as meal (meal.key)}
		{@const entries = byMeal[meal.key]}
		<section class="lcars-panel p-4">
			<div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
				<h2 class="lcars-label">{meal.label}</h2>
				<div class="flex gap-2">
					<a
						href="/reactor/add?meal={meal.key}&d={data.d}"
						class="lcars-pill bg-orange text-space text-xs font-bold px-3 py-1 hover:bg-amber transition-colors"
					>+ Log</a>
					<a
						href="/reactor/scan?meal={meal.key}&d={data.d}"
						class="lcars-pill bg-lavender text-space text-xs font-bold px-3 py-1 hover:bg-amber transition-colors"
					>Scan</a>
					<button
						onclick={() => (quickAddMeal = quickAddMeal === meal.key ? null : meal.key)}
						class="lcars-pill bg-panel-2 text-dim text-xs font-bold px-3 py-1 hover:text-glow transition-colors cursor-pointer"
					>Quick</button>
				</div>
			</div>

			{#if quickAddMeal === meal.key}
				<form method="POST" action="?/quickAdd" use:enhance class="flex gap-2 mb-3 flex-wrap">
					<input type="hidden" name="meal" value={meal.key} />
					<input type="hidden" name="d" value={data.d} />
					<input name="name" placeholder="Name (optional)" class="bg-panel-2 rounded-xl px-3 py-2 text-sm flex-1 min-w-32 outline-none focus:ring-2 focus:ring-orange" />
					<input name="kcal" type="number" min="1" max="5000" required placeholder="kcal" class="bg-panel-2 rounded-xl px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-orange" />
					<button type="submit" class="lcars-pill bg-orange text-space text-sm font-bold px-4 cursor-pointer">Add</button>
				</form>
			{/if}

			{#if entries.length === 0}
				<p class="text-dim text-sm">Nothing logged.</p>
			{:else}
				<ul class="divide-y divide-panel-2">
					{#each entries as e (e.id)}
						<li class="py-2 flex items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate">
									{e.foodName ?? e.templateName ?? 'Entry'}
									{#if e.foodBrand}<span class="text-dim text-sm"> · {e.foodBrand}</span>{/if}
								</p>
								<p class="text-dim text-xs font-mono">
									{#if e.qtyG}{e.qtyG}g · {/if}{Math.round(e.kcal)} kcal{#if e.proteinG != null} · P{e.proteinG}g{/if}
								</p>
							</div>
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="id" value={e.id} />
								<button type="submit" aria-label="Remove entry" class="text-dim hover:text-alert text-lg leading-none cursor-pointer px-2">×</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>

<div class="mt-4 flex gap-3 flex-wrap">
	<a href="/replicator?meal=lunch&d={data.d}" class="lcars-pill bg-mauve text-space font-bold text-sm px-4 py-2 hover:bg-amber transition-colors">Replicator Database →</a>
	<a href="/settings" class="lcars-pill bg-panel-2 text-dim font-bold text-sm px-4 py-2 hover:text-glow transition-colors">Calorie band settings</a>
</div>
