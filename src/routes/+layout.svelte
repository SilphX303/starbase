<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutServerData } from './$types';

	let { data, children }: { data: LayoutServerData; children: Snippet } = $props();

	const nav = [
		{ href: '/', label: 'Bridge', color: 'bg-amber' },
		{ href: '/reactor', label: 'Reactor Core', color: 'bg-orange' },
		{ href: '/hull', label: 'Hull Integrity', color: 'bg-salmon' },
		{ href: '/propulsion', label: 'Propulsion', color: 'bg-lavender' },
		{ href: '/life-support', label: 'Life Support', color: 'bg-teal' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<title>Starbase — Ship Operations</title>
</svelte:head>

{#if data.user}
	<div class="min-h-dvh flex flex-col md:flex-row">
		<!-- Sidebar rail -->
		<aside class="md:w-56 shrink-0 p-3 md:p-4 flex md:flex-col gap-2 md:gap-3">
			<div
				class="hidden md:block lcars-panel bg-amber text-space px-4 py-5 rounded-tl-[3rem] font-bold text-lg tracking-widest"
			>
				STARBASE
			</div>
			<nav class="flex md:flex-col gap-2 md:gap-3 flex-1 overflow-x-auto">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						class="lcars-pill px-4 py-2 md:py-3 text-space font-bold text-sm whitespace-nowrap
							{item.color} {isActive(item.href) ? 'opacity-100' : 'opacity-50 hover:opacity-80'} transition-opacity"
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<form method="POST" action="/logout" class="md:mt-auto">
				<button
					type="submit"
					class="lcars-pill px-4 py-2 md:py-3 w-full bg-panel-2 text-dim font-bold text-sm hover:text-glow transition-colors cursor-pointer"
				>
					Log out
				</button>
			</form>
		</aside>

		<!-- Main viewport -->
		<main class="flex-1 p-3 md:p-6 md:pl-2 max-w-5xl">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
