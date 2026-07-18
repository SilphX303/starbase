<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	const ALL_TAGS = ['low-gi', 'high-fibre', 'high-protein', 'quick', 'batch-cook', 'veggie', 'visceral-cut'];
	const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

	let activeTags = $state<string[]>([]);
	let mealTypeFilter = $state<string>('all');
	let expanded = $state<number | null>(null);
	let logMeal = $state<string>(data.meal);

	function toggleTag(tag: string) {
		activeTags = activeTags.includes(tag) ? activeTags.filter((t) => t !== tag) : [...activeTags, tag];
	}

	const filtered = $derived(
		data.templates.filter(
			(t) =>
				(mealTypeFilter === 'all' || t.mealType === mealTypeFilter) &&
				activeTags.every((tag) => t.tags.includes(tag))
		)
	);
</script>

<svelte:head>
	<title>Starbase — Replicator</title>
</svelte:head>

<header class="lcars-panel bg-mauve text-space px-5 py-4 mb-4">
	<h1 class="font-bold text-xl tracking-widest">REPLICATOR DATABASE</h1>
	<p class="text-xs tracking-wider opacity-80 uppercase">Curated meal patterns · one-tap logging</p>
</header>

<section class="lcars-panel p-4 mb-4">
	<div class="flex flex-wrap gap-2 mb-3">
		<button onclick={() => (mealTypeFilter = 'all')} class="lcars-pill text-xs font-bold px-3 py-1 cursor-pointer {mealTypeFilter === 'all' ? 'bg-mauve text-space' : 'bg-panel-2 text-dim hover:text-glow'}">All</button>
		{#each MEAL_TYPES as mt (mt)}
			<button onclick={() => (mealTypeFilter = mt)} class="lcars-pill text-xs font-bold px-3 py-1 capitalize cursor-pointer {mealTypeFilter === mt ? 'bg-mauve text-space' : 'bg-panel-2 text-dim hover:text-glow'}">{mt}</button>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2">
		{#each ALL_TAGS as tag (tag)}
			<button onclick={() => toggleTag(tag)} class="lcars-pill text-xs px-3 py-1 cursor-pointer {activeTags.includes(tag) ? 'bg-teal text-space font-bold' : 'bg-panel-2 text-dim hover:text-glow'}">{tag}</button>
		{/each}
	</div>
	<div class="mt-3 flex items-center gap-2 flex-wrap">
		<span class="lcars-label">Log to:</span>
		{#each MEAL_TYPES as mt (mt)}
			<button onclick={() => (logMeal = mt)} class="lcars-pill text-xs font-bold px-3 py-1 capitalize cursor-pointer {logMeal === mt ? 'bg-orange text-space' : 'bg-panel-2 text-dim hover:text-glow'}">{mt}</button>
		{/each}
		<span class="text-dim text-xs font-mono">{data.d}</span>
	</div>
</section>

<div class="grid gap-3">
	{#each filtered as t (t.id)}
		<section class="lcars-panel p-4">
			<div class="flex items-start justify-between gap-3">
				<button onclick={() => (expanded = expanded === t.id ? null : t.id)} class="text-left cursor-pointer min-w-0">
					<h2 class="font-bold">{t.name}</h2>
					<p class="text-dim text-xs font-mono mt-0.5">
						{Math.round(t.kcal)} kcal · P{t.proteinG}g · C{t.carbsG}g · F{t.fatG}g · Fibre {t.fibreG}g
					</p>
					<div class="flex flex-wrap gap-1 mt-1.5">
						<span class="lcars-pill bg-panel-2 text-dim text-[10px] px-2 py-0.5 uppercase">{t.mealType}</span>
						{#each t.tags as tag (tag)}
							<span class="lcars-pill bg-panel-2 text-teal text-[10px] px-2 py-0.5">{tag}</span>
						{/each}
					</div>
				</button>
				<form method="POST" action="?/log" use:enhance class="shrink-0">
					<input type="hidden" name="templateId" value={t.id} />
					<input type="hidden" name="meal" value={logMeal} />
					<input type="hidden" name="d" value={data.d} />
					<button type="submit" class="lcars-pill bg-mauve text-space font-bold text-sm px-4 py-2 hover:bg-amber transition-colors cursor-pointer">
						Replicate
					</button>
				</form>
			</div>
			{#if expanded === t.id}
				<div class="mt-3 pt-3 border-t border-panel-2 text-sm">
					{#if t.flavourText}<p class="text-mauve italic mb-1">"{t.flavourText}"</p>{/if}
					{#if t.methodText}<p class="text-dim leading-relaxed">{t.methodText}</p>{/if}
				</div>
			{/if}
		</section>
	{:else}
		<p class="text-dim text-sm">No patterns match those filters.</p>
	{/each}
</div>

<a href="/reactor?d={data.d}" class="inline-block mt-4 text-dim hover:text-glow text-sm">← Back to Reactor</a>
