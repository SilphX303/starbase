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

<header class="mb-4 md:mb-5">
	<div class="lcars-panel bg-panel-2 px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
		<div>
			<h1 class="font-bold text-xl md:text-2xl tracking-[0.18em]">BRIDGE</h1>
			<p class="lcars-label mt-0.5">{data.settings.shipName} — ship systems overview</p>
		</div>
		<div class="text-right">
			<p class="lcars-readout text-amber">{stardate}</p>
			<p class="lcars-label mt-0.5">{data.user?.email}</p>
		</div>
	</div>
</header>

<!-- Officer record plaque -->
<section class="lcars-panel mb-4 md:mb-5">
	<div class="bg-amber text-space px-5 py-3 flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-3 min-w-0">
			<h2 class="font-bold tracking-[0.16em] uppercase leading-none">{data.game.rank}</h2>
			<span class="flex gap-1" aria-hidden="true">
				{#each [0, 1, 2, 3] as i (i)}
					<span class="w-1.5 h-3.5 rounded-sm bg-space/30"></span>
				{/each}
			</span>
		</div>
		<div class="flex items-center gap-3">
			<span class="lcars-code text-space/70">OFFICER RECORD · SBS 01-2261</span>
			<p class="lcars-readout text-sm font-bold bg-space/15 rounded-md px-2 py-0.5">
				LEVEL {data.game.level}
			</p>
		</div>
	</div>
	<div class="p-5">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
			<p class="lcars-readout text-sm">
				<span class="text-glow">{data.game.levelInto}</span><span class="text-dim"> / {data.game.levelNext} XP to level {data.game.level + 1}</span>
			</p>
			<p class="lcars-readout text-sm text-dim">
				Today <span class="text-amber">+{data.game.todayXp}</span> · Career {data.game.totalXp} XP
			</p>
		</div>
		<div class="bar-track h-2.5">
			<div class="bar-fill bg-amber" style="width: {levelPct}%"></div>
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-4">
			<p class="text-sm text-dim">
				Log streak <span class="text-glow lcars-readout">{data.game.streak.current}d</span>
				<span class="text-dim">(best {data.game.streak.best})</span>
			</p>
			<p class="text-sm text-dim flex items-center gap-1.5">
				Shields
				{#each [0, 1, 2] as i (i)}
					<span
						class="inline-block w-3 h-3 rounded-full {i < data.game.streak.shields
							? 'bg-teal'
							: 'bg-panel-2'}"
					></span>
				{/each}
			</p>
		</div>
	</div>
</section>

<!-- Duty roster -->
<section class="lcars-panel p-5 mb-4 md:mb-5">
	<div class="flex items-baseline justify-between gap-2 mb-3">
		<h2 class="lcars-label">Today's patrols · 50 XP each</h2>
		<span class="lcars-code hidden sm:block">DUTY ROSTER 07</span>
	</div>
	<ul class="grid gap-2 sm:grid-cols-3">
		{#each data.game.patrols as p (p.key)}
			<li
				class="rounded-2xl p-3 pl-4 relative overflow-hidden {p.done
					? 'bg-teal/15 border border-teal/40'
					: 'bg-panel-2 border border-transparent'}"
			>
				<span
					class="absolute left-0 top-0 bottom-0 w-1.5 {p.done ? 'bg-teal' : 'bg-rail'}"
					aria-hidden="true"
				></span>
				<p class="font-bold text-sm {p.done ? 'text-teal' : ''}">{p.done ? '✓ ' : ''}{p.title}</p>
				<p class="text-dim text-xs mt-1">{p.flavour}</p>
			</li>
		{/each}
	</ul>
</section>

<div class="lcars-divider mb-4 md:mb-5" aria-hidden="true">
	<span class="flex-1 bg-rail"></span>
	<span class="w-10 bg-amber/60"></span>
	<span class="w-4 bg-rail"></span>
</div>

<div class="grid gap-3 md:gap-4 sm:grid-cols-2">
	{#each systems as system (system.name)}
		<SystemPanel {...system} />
	{/each}
</div>

<div class="lcars-panel mt-4 md:mt-5 p-5 border border-panel-2">
	<div class="flex items-baseline justify-between gap-2 mb-2">
		<p class="lcars-label">Ops log</p>
		<span class="lcars-code">SBS 47-0518</span>
	</div>
	<p class="text-sm text-dim leading-relaxed">
		All stations online: fuel logging, body telemetry, exercise, habits and the XP/mission
		layer are operational. Weekly directives and story arcs arrive in the next refit.
	</p>
</div>
