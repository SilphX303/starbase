<script lang="ts">
	import SystemPanel from '$lib/components/SystemPanel.svelte';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	// Placeholder statuses — derived from real logs from M2 onwards.
	const systems = [
		{
			name: 'Hull Integrity',
			domain: 'Body composition',
			status: null,
			color: 'bg-salmon',
			href: '/hull'
		},
		{
			name: 'Reactor Core',
			domain: 'Metabolic health / diet',
			status: null,
			color: 'bg-orange',
			href: '/reactor'
		},
		{
			name: 'Propulsion',
			domain: 'Exercise & movement',
			status: null,
			color: 'bg-lavender',
			href: '/propulsion'
		},
		{
			name: 'Life Support',
			domain: 'Habits & recovery',
			status: null,
			color: 'bg-teal',
			href: '/life-support'
		}
	];

	const stardate = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
</script>

<header class="mb-4 md:mb-6">
	<div class="lcars-panel bg-panel-2 px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
		<div>
			<h1 class="font-bold text-xl md:text-2xl tracking-widest">BRIDGE</h1>
			<p class="lcars-label">ISV Endeavour — ship systems overview</p>
		</div>
		<div class="text-right">
			<p class="font-mono text-amber">{stardate}</p>
			<p class="lcars-label">{data.user?.email}</p>
		</div>
	</div>
</header>

<div class="grid gap-3 md:gap-4 sm:grid-cols-2">
	{#each systems as system (system.name)}
		<SystemPanel {...system} />
	{/each}
</div>

<div class="lcars-panel mt-4 md:mt-6 p-5 border border-panel-2">
	<p class="lcars-label mb-2">Ops log</p>
	<p class="text-sm text-dim leading-relaxed">
		Skeleton systems online. Food logging, XP engine, missions and measurements come
		aboard in upcoming refits (M2–M4). All stations currently report placeholder data.
	</p>
</div>
