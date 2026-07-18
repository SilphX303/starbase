<script lang="ts">
	import SystemPanel from '$lib/components/SystemPanel.svelte';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	// All four ship systems online.
	const systems = $derived([
		{
			name: 'Hull Integrity',
			domain: 'Body composition',
			status: data.hullStatus,
			color: 'bg-salmon',
			href: '/hull'
		},
		{
			name: 'Reactor Core',
			domain: 'Metabolic health / diet',
			status: data.reactorStatus,
			color: 'bg-orange',
			href: '/reactor'
		},
		{
			name: 'Propulsion',
			domain: 'Exercise & movement',
			status: data.propulsionStatus,
			color: 'bg-lavender',
			href: '/propulsion'
		},
		{
			name: 'Life Support',
			domain: 'Habits & recovery',
			status: data.lifeSupportStatus,
			color: 'bg-teal',
			href: '/life-support'
		}
	]);

	const levelPct = $derived(Math.round((data.game.levelInto / data.game.levelNext) * 100));
	const stardate = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
</script>

<header class="mb-4 md:mb-6">
	<div class="lcars-panel bg-panel-2 px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
		<div>
			<h1 class="font-bold text-xl md:text-2xl tracking-widest">BRIDGE</h1>
			<p class="lcars-label">{data.settings.shipName} — ship systems overview</p>
		</div>
		<div class="text-right">
			<p class="font-mono text-amber">{stardate}</p>
			<p class="lcars-label">{data.user?.email}</p>
		</div>
	</div>
</header>

<!-- Officer record -->
<section class="lcars-panel overflow-hidden mb-4 md:mb-6">
	<div class="bg-amber text-space px-5 py-3 flex flex-wrap items-baseline justify-between gap-2">
		<h2 class="font-bold tracking-widest uppercase">{data.game.rank}</h2>
		<p class="font-mono text-sm">LEVEL {data.game.level}</p>
	</div>
	<div class="p-5">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
			<p class="font-mono tabular-nums text-sm">
				<span class="text-glow">{data.game.levelInto}</span><span class="text-dim"> / {data.game.levelNext} XP to level {data.game.level + 1}</span>
			</p>
			<p class="font-mono tabular-nums text-sm text-dim">
				Today <span class="text-amber">+{data.game.todayXp}</span> · Career {data.game.totalXp} XP
			</p>
		</div>
		<div class="h-2.5 rounded-full bg-panel-2 overflow-hidden">
			<div class="h-full rounded-full bg-amber" style="width: {levelPct}%"></div>
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-4">
			<p class="text-sm text-dim">
				Log streak <span class="text-glow font-mono">{data.game.streak.current}d</span>
				<span class="text-dim">(best {data.game.streak.best})</span>
			</p>
			<p class="text-sm text-dim flex items-center gap-1">
				Shields
				{#each [0, 1, 2] as i (i)}
					<span class="inline-block w-3 h-3 rounded-full {i < data.game.streak.shields ? 'bg-teal' : 'bg-panel-2'}"></span>
				{/each}
			</p>
		</div>
	</div>
</section>

<!-- Duty roster -->
<section class="lcars-panel p-5 mb-4 md:mb-6">
	<h2 class="lcars-label mb-3">Today's patrols · 50 XP each</h2>
	<ul class="grid gap-2 sm:grid-cols-3">
		{#each data.game.patrols as p (p.key)}
			<li class="rounded-2xl p-3 {p.done ? 'bg-teal/15 border border-teal/40' : 'bg-panel-2'}">
				<p class="font-bold text-sm {p.done ? 'text-teal' : ''}">{p.done ? '✓ ' : ''}{p.title}</p>
				<p class="text-dim text-xs mt-1">{p.flavour}</p>
			</li>
		{/each}
	</ul>
</section>

<div class="grid gap-3 md:gap-4 sm:grid-cols-2">
	{#each systems as system (system.name)}
		<SystemPanel {...system} />
	{/each}
</div>

<div class="lcars-panel mt-4 md:mt-6 p-5 border border-panel-2">
	<p class="lcars-label mb-2">Ops log</p>
	<p class="text-sm text-dim leading-relaxed">
		All stations online: fuel logging, body telemetry, exercise, habits and the XP/mission
		layer are operational. Weekly directives and story arcs arrive in the next refit.
	</p>
</div>
