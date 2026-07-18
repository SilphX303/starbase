<script lang="ts">
	import '../app.css';
	import '@fontsource/antonio/400.css';
	import '@fontsource/antonio/700.css';
	import '@fontsource/jetbrains-mono/400.css';
	import '@fontsource/jetbrains-mono/700.css';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutServerData } from './$types';

	let { data, children }: { data: LayoutServerData; children: Snippet } = $props();

	const nav = [
		{ href: '/', label: 'Bridge', short: 'Bridge', color: 'bg-amber', code: '01' },
		{ href: '/reactor', label: 'Reactor Core', short: 'Reactor', color: 'bg-orange', code: '02' },
		{ href: '/hull', label: 'Hull Integrity', short: 'Hull', color: 'bg-salmon', code: '03' },
		{ href: '/propulsion', label: 'Propulsion', short: 'Propulsion', color: 'bg-lavender', code: '04' },
		{ href: '/life-support', label: 'Life Support', short: 'Life Support', color: 'bg-teal', code: '05' },
		{ href: '/replicator', label: 'Replicator', short: 'Replicator', color: 'bg-mauve', code: '06' },
		{ href: '/settings', label: 'Config', short: 'Config', color: 'bg-butter', code: '07' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<title>Starbase — Ship Operations</title>
</svelte:head>

{#if data.user}
	<div class="min-h-dvh md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
		<!-- ===== Desktop left rail (LCARS frame) ===== -->
		<aside class="hidden md:flex flex-col gap-1 pl-3 py-3 sticky top-0 h-dvh overflow-y-auto">
			<!-- Elbow header: curves into the top bar of the content column -->
			<div class="bg-amber text-space rounded-tl-[2.5rem] shrink-0 h-16 flex items-end justify-end px-4 pb-1.5">
				<span class="font-bold tracking-[0.18em] text-lg leading-none">STARBASE</span>
			</div>

			<nav class="flex flex-col gap-1">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						class="block {item.color} text-space text-right pr-4 py-2.5 font-bold text-sm uppercase tracking-[0.12em] transition-opacity
							{isActive(item.href) ? 'opacity-100' : 'opacity-40 hover:opacity-80'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Inert structural segments with register codes -->
			<div class="bg-rail h-8 shrink-0 flex items-end justify-end pr-4 pb-1">
				<span class="lcars-code">SBS 03-2261</span>
			</div>
			<div class="flex-1 bg-rail min-h-6 flex items-end justify-end pr-4 pb-1.5">
				<span class="lcars-code">DECK 07 · OPS</span>
			</div>

			<form method="POST" action="/logout">
				<button
					type="submit"
					class="block w-full bg-panel-2 text-dim text-right pr-4 py-2.5 font-bold text-sm uppercase tracking-[0.12em] hover:text-glow transition-colors cursor-pointer"
				>
					Log out
				</button>
			</form>

			<!-- Bottom cap -->
			<div class="bg-mauve rounded-bl-[2.5rem] shrink-0 h-9 flex items-center justify-end pr-4">
				<span class="lcars-code text-space/70">SBS 47-0518</span>
			</div>
		</aside>

		<!-- ===== Content column ===== -->
		<div class="flex flex-col min-w-0">
			<!-- Desktop top frame bar: continues the elbow -->
			<div class="hidden md:block pt-3 pr-4">
				<div class="flex items-center gap-1.5 h-4">
					<div class="h-full flex-1 min-w-16 bg-amber"></div>
					<span class="lcars-code px-1 flex items-center gap-2">
						<span class="alive-dot"></span>
						SBS 03-2261 · SHIP OPERATIONS
					</span>
					<div class="h-full w-16 bg-orange"></div>
					<div class="h-full w-8 bg-mauve"></div>
					<div class="h-full w-24 bg-lavender rounded-r-full"></div>
				</div>
				<!-- Concave inner curve of the elbow -->
				<div class="relative h-5 w-10" aria-hidden="true">
					<div class="absolute inset-0 bg-amber"></div>
					<div class="absolute inset-0 bg-space rounded-tl-[1.25rem]"></div>
				</div>
			</div>

			<!-- Mobile top strip -->
			<header class="md:hidden flex items-center gap-1.5 px-3 pt-3">
				<div class="bg-amber text-space rounded-l-full pl-4 pr-3 py-1 font-bold tracking-[0.16em] text-sm">
					STARBASE
				</div>
				<div class="h-3 flex-1 bg-rail"></div>
				<span class="lcars-code flex items-center gap-1.5"><span class="alive-dot"></span>SBS 03-2261</span>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="lcars-pill bg-panel-2 text-dim text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 hover:text-glow transition-colors cursor-pointer"
					>
						Exit
					</button>
				</form>
			</header>

			<!-- Main viewport -->
			<main
				class="flex-1 w-full max-w-5xl px-3 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-2 md:pb-8"
			>
				{@render children()}
			</main>
		</div>

		<!-- ===== Mobile bottom tab bar ===== -->
		<nav
			class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-panel border-t border-panel-2 pb-[env(safe-area-inset-bottom)]"
			aria-label="Primary"
		>
			<div class="flex items-stretch px-1 pt-1 pb-1">
				{#each nav.slice(0, 5) as item (item.href)}
					{@const active = isActive(item.href)}
					<a
						href={item.href}
						class="flex-1 min-w-0 min-h-14 flex items-center justify-center px-0.5"
					>
						<span
							class="w-full flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors
								{active ? `${item.color} text-space` : 'text-dim'}"
						>
							<span
								class="h-1 w-7 rounded-full {active ? 'bg-space/40' : item.color} {active ? '' : 'opacity-40'}"
							></span>
							<span class="text-[9px] font-bold uppercase tracking-[0.1em] leading-none whitespace-nowrap">
								{item.short}
							</span>
						</span>
					</a>
				{/each}
			</div>
		</nav>
	</div>
{:else}
	{@render children()}
{/if}
