<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	interface Food {
		id: number;
		name: string;
		brand: string | null;
		source: string;
		kcal100g: number | null;
		proteinG: number | null;
		carbsG: number | null;
		fatG: number | null;
		fibreG: number | null;
		servingSizesJson: string | null;
		favourite: boolean;
	}

	let query = $state('');
	let results = $state<Food[]>([]);
	let searching = $state(false);
	let upstream = $state('');
	let selected = $state<Food | null>(data.selected as Food | null);
	let qtyG = $state(100);
	let showCustom = $state(!!form?.custom);
	let debounceTimer: ReturnType<typeof setTimeout>;

	const customFields: { name: string; label: string; required: boolean }[] = [
		{ name: 'kcal100g', label: 'kcal /100g', required: true },
		{ name: 'protein100g', label: 'Protein g/100g', required: false },
		{ name: 'carbs100g', label: 'Carbs g/100g', required: false },
		{ name: 'fat100g', label: 'Fat g/100g', required: false },
		{ name: 'fibre100g', label: 'Fibre g/100g', required: false },
		{ name: 'qtyG', label: 'Amount eaten (g)', required: true }
	];

	function onQueryInput() {
		clearTimeout(debounceTimer);
		if (query.trim().length < 2) {
			results = [];
			return;
		}
		debounceTimer = setTimeout(search, 450);
	}

	async function search() {
		searching = true;
		try {
			const res = await fetch(`/api/food/search?q=${encodeURIComponent(query.trim())}`);
			const body = await res.json();
			results = body.results ?? [];
			upstream = body.upstream ?? '';
		} catch {
			results = [];
			upstream = 'error';
		} finally {
			searching = false;
		}
	}

	function select(f: Food) {
		selected = f;
		const servings = f.servingSizesJson ? JSON.parse(f.servingSizesJson) : null;
		qtyG = servings?.[0]?.g ?? 100;
	}

	const kcalPreview = $derived(
		selected?.kcal100g != null ? Math.round((selected.kcal100g * qtyG) / 100) : null
	);
	const servings = $derived(
		selected?.servingSizesJson ? (JSON.parse(selected.servingSizesJson) as { label: string; g: number }[]) : []
	);
</script>

<svelte:head>
	<title>Starbase — Log fuel</title>
</svelte:head>

<header class="lcars-panel bg-orange text-space px-5 py-4 mb-4 flex flex-wrap items-end justify-between gap-2">
	<div>
		<h1 class="font-bold text-xl tracking-[0.16em]">LOG FUEL</h1>
		<p class="text-[11px] tracking-[0.14em] opacity-80 uppercase mt-0.5">{data.meal} · {data.d}</p>
	</div>
	<span class="lcars-code text-space/60">SBS 02-2261 · INTAKE</span>
</header>

{#if form?.error}
	<p class="text-alert text-sm mb-3">{form.error}</p>
{/if}

{#if selected}
	<!-- Portion panel -->
	<section class="lcars-panel p-5 mb-4">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="font-bold text-lg">{selected.name}</h2>
				<p class="text-dim text-sm">
					{selected.brand ?? (selected.source === 'custom' ? 'Custom entry' : 'Federation database')}
					{#if selected.kcal100g != null} · {selected.kcal100g} kcal/100g{/if}
				</p>
			</div>
			<button onclick={() => (selected = null)} class="text-dim hover:text-glow cursor-pointer" aria-label="Deselect">×</button>
		</div>

		<form method="POST" action="?/log" use:enhance class="mt-4 flex items-end gap-3 flex-wrap">
			<input type="hidden" name="foodId" value={selected.id} />
			<input type="hidden" name="meal" value={data.meal} />
			<input type="hidden" name="d" value={data.d} />
			<label class="flex flex-col gap-1">
				<span class="lcars-label">Amount (g)</span>
				<input
					name="qtyG" type="number" bind:value={qtyG} min="1" max="5000" required
					class="lcars-input px-4 py-3 w-32 font-mono outline-none focus:ring-2 focus:ring-orange"
				/>
			</label>
			{#each servings as s (s.label)}
				<button type="button" onclick={() => (qtyG = s.g)} class="lcars-pill bg-panel-2 text-sm px-3 py-2 hover:text-glow text-dim cursor-pointer">
					{s.label}
				</button>
			{/each}
			<div class="flex-1"></div>
			<div class="text-right">
				{#if kcalPreview != null}
					<p class="lcars-readout text-2xl">{kcalPreview} <span class="text-dim text-sm">kcal</span></p>
				{/if}
				<button type="submit" class="lcars-pill bg-orange text-space font-bold px-6 py-3 mt-1 hover:bg-amber transition-colors cursor-pointer">
					Engage
				</button>
			</div>
		</form>
	</section>
{/if}

<!-- Search -->
<section class="lcars-panel p-5 mb-4">
	<label class="flex flex-col gap-1">
		<span class="lcars-label">Search Federation food database</span>
		<input
			bind:value={query}
			oninput={onQueryInput}
			placeholder="e.g. hummus, porridge oats…"
			class="lcars-input px-4 py-3 outline-none focus:ring-2 focus:ring-orange"
		/>
	</label>
	{#if searching}
		<p class="text-dim text-sm mt-3 animate-pulse">Scanning subspace…</p>
	{:else if results.length}
		<ul class="divide-y divide-panel-2 mt-3">
			{#each results as f (f.id)}
				<li>
					<button onclick={() => select(f)} class="w-full text-left py-2 hover:bg-panel-2 rounded-lg px-2 cursor-pointer flex justify-between gap-2">
						<span class="min-w-0">
							<span class="block truncate">{f.favourite ? '★ ' : ''}{f.name}</span>
							<span class="text-dim text-xs">{f.brand ?? f.source}</span>
						</span>
						{#if f.kcal100g != null}
							<span class="text-dim font-mono text-sm shrink-0">{f.kcal100g} kcal/100g</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
		{#if upstream === 'offline'}
			<p class="text-dim text-xs mt-2">Subspace link down — showing local cache only.</p>
		{/if}
	{:else if query.trim().length >= 2}
		<p class="text-dim text-sm mt-3">No matches. Try the scanner or a custom entry.</p>
	{/if}
</section>

<!-- Recents -->
{#if data.recents.length}
	<section class="lcars-panel p-5 mb-4">
		<h2 class="lcars-label mb-2">Recent rations</h2>
		<div class="flex flex-wrap gap-2">
			{#each data.recents as f (f.id)}
				<button onclick={() => select(f as Food)} class="lcars-pill bg-panel-2 text-sm px-3 py-2 hover:text-glow cursor-pointer {f.favourite ? 'text-amber' : 'text-dim'}">
					{f.favourite ? '★ ' : ''}{f.name}
				</button>
			{/each}
		</div>
	</section>
{/if}

<!-- Custom food -->
<section class="lcars-panel p-5">
	<button onclick={() => (showCustom = !showCustom)} class="lcars-label cursor-pointer hover:text-glow">
		{showCustom ? '▾' : '▸'} Custom entry (per 100g)
	</button>
	{#if showCustom}
		<form method="POST" action="?/custom" use:enhance class="mt-3 grid gap-3 sm:grid-cols-2">
			<input type="hidden" name="meal" value={data.meal} />
			<input type="hidden" name="d" value={data.d} />
			<label class="flex flex-col gap-1 sm:col-span-2">
				<span class="lcars-label">Name</span>
				<input name="name" required class="lcars-input px-4 py-3 outline-none focus:ring-2 focus:ring-orange" />
			</label>
			{#each customFields as f (f.name)}
				<label class="flex flex-col gap-1">
					<span class="lcars-label">{f.label}</span>
					<input name={f.name} type="number" step="0.1" min="0" required={f.required} class="lcars-input px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-orange" />
				</label>
			{/each}
			<button type="submit" class="lcars-pill bg-orange text-space font-bold px-6 py-3 sm:col-span-2 hover:bg-amber transition-colors cursor-pointer">
				Create & log
			</button>
		</form>
	{/if}
</section>

<a href="/reactor?d={data.d}" class="inline-block mt-4 text-dim hover:text-glow text-sm">← Back to Reactor</a>
