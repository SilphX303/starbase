<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	let showAdd = $state(false);

	const doneCount = $derived(data.habits.filter((h) => data.ticks[h.id]).length);
</script>

<svelte:head>
	<title>Starbase — Life Support</title>
</svelte:head>

<header class="lcars-panel bg-teal text-space px-5 py-4 mb-4 flex flex-wrap items-end justify-between gap-2">
	<div>
		<h1 class="font-bold text-xl tracking-[0.16em]">LIFE SUPPORT</h1>
		<p class="text-[11px] tracking-[0.14em] opacity-80 uppercase mt-0.5">Habits & recovery · {doneCount}/{data.habits.length} systems green today</p>
	</div>
	<span class="lcars-code text-space/60">SBS 05-2261 · ENV CONTROL</span>
</header>

{#if form?.error}<p class="text-alert text-sm mb-3">{form.error}</p>{/if}

<!-- Today's checks -->
<section class="lcars-panel p-5 mb-4">
	<h2 class="lcars-label mb-3">Today's system checks · 10 XP each</h2>
	<div class="grid gap-2 sm:grid-cols-2">
		{#each data.habits as habit (habit.id)}
			{@const done = !!data.ticks[habit.id]}
			<form method="POST" action="?/toggle" use:enhance>
				<input type="hidden" name="habitId" value={habit.id} />
				<input type="hidden" name="d" value={data.d} />
				<button
					type="submit"
					class="w-full text-left rounded-2xl p-4 transition-colors cursor-pointer {done
						? 'bg-teal/15 border border-teal/40'
						: 'bg-panel-2 hover:bg-panel-2/60 border border-transparent'}"
				>
					<p class="font-bold text-sm {done ? 'text-teal' : ''}">
						{habit.icon ? habit.icon + ' ' : ''}{done ? '✓ ' : ''}{habit.name}
					</p>
					<p class="text-dim text-xs mt-1">{done ? 'Nominal — tap to undo' : 'Tap when done'}</p>
				</button>
			</form>
		{/each}
	</div>
</section>

<!-- Week grid -->
<section class="lcars-panel p-5 mb-4 overflow-x-auto">
	<h2 class="lcars-label mb-3">Last 7 days</h2>
	<table class="text-sm">
		<thead>
			<tr>
				<th class="text-left pr-4"></th>
				{#each data.week.dates as wd (wd)}
					<th class="px-2 text-dim font-mono text-xs font-normal">{wd.slice(8)}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.habits as habit (habit.id)}
				<tr>
					<td class="pr-4 py-1 whitespace-nowrap text-dim">{habit.icon ?? ''} {habit.name}</td>
					{#each data.week.dates as wd (wd)}
						<td class="px-2 py-1 text-center">
							<span class="inline-block w-3 h-3 rounded-full {data.week.grid[wd]?.[habit.id] ? 'bg-teal' : 'bg-panel-2'}"></span>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<!-- Manage habits -->
<section class="lcars-panel p-5">
	<button onclick={() => (showAdd = !showAdd)} class="lcars-label cursor-pointer hover:text-glow">
		{showAdd ? '▾' : '▸'} Manage habits
	</button>
	{#if showAdd}
		<form method="POST" action="?/add" use:enhance class="mt-3 flex gap-2 flex-wrap items-end">
			<label class="flex flex-col gap-1">
				<span class="lcars-label">Icon (optional)</span>
				<input name="icon" maxlength="4" class="lcars-input px-3 py-2 w-16 text-center outline-none focus:ring-2 focus:ring-teal" />
			</label>
			<label class="flex flex-col gap-1 flex-1 min-w-48">
				<span class="lcars-label">New habit</span>
				<input name="name" required maxlength="80" placeholder="e.g. No sugary drinks" class="lcars-input px-3 py-2 outline-none focus:ring-2 focus:ring-teal" />
			</label>
			<button type="submit" class="lcars-pill bg-teal text-space font-bold text-sm px-4 py-2 hover:bg-amber transition-colors cursor-pointer">Add</button>
		</form>
		<ul class="mt-4 divide-y divide-panel-2">
			{#each data.habits as habit (habit.id)}
				<li class="py-2 flex items-center justify-between gap-3">
					<span class="text-sm text-dim">{habit.icon ?? ''} {habit.name}</span>
					<form method="POST" action="?/deactivate" use:enhance>
						<input type="hidden" name="habitId" value={habit.id} />
						<button type="submit" class="text-dim hover:text-alert text-xs cursor-pointer">retire</button>
					</form>
				</li>
			{/each}
		</ul>
		<p class="text-dim text-xs mt-3">Retiring a habit keeps its history; it just leaves the daily roster.</p>
	{/if}
</section>
