<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Starbase — Authorisation</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<!-- Console header: elbow cap + segment bar -->
		<div class="flex items-stretch gap-1.5 mb-1.5">
			<div class="bg-amber text-space rounded-tl-[2.5rem] rounded-tr-xl px-6 pt-5 pb-3 flex-1">
				<h1 class="font-bold text-xl tracking-[0.18em] leading-none">STARBASE</h1>
				<p class="text-[10px] tracking-[0.16em] opacity-80 mt-1.5">SHIP OPERATIONS CONSOLE</p>
			</div>
			<div class="flex flex-col gap-1.5 w-8" aria-hidden="true">
				<div class="flex-1 bg-orange rounded-tr-xl"></div>
				<div class="h-3 bg-lavender"></div>
				<div class="h-3 bg-mauve rounded-br-md"></div>
			</div>
		</div>

		<form method="POST" class="lcars-panel rounded-tl-none p-6 flex flex-col gap-4">
			<div class="flex items-baseline justify-between gap-2">
				<p class="lcars-label">Officer authorisation required</p>
				<span class="lcars-code">SBS 03-2261</span>
			</div>

			{#if form?.error}
				<p class="text-alert text-sm border border-alert/40 bg-alert/10 rounded-xl px-3 py-2">
					{form.error}
				</p>
			{/if}

			<label class="flex flex-col gap-1">
				<span class="lcars-label">Email</span>
				<input
					name="email"
					type="email"
					required
					autocomplete="username"
					value={form?.email ?? ''}
					class="lcars-input px-4 py-3 text-glow outline-none focus:ring-2 focus:ring-amber"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="lcars-label">Password</span>
				<input
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="lcars-input px-4 py-3 text-glow outline-none focus:ring-2 focus:ring-amber"
				/>
			</label>

			<button
				type="submit"
				class="lcars-pill bg-orange text-space font-bold tracking-[0.14em] uppercase py-3 mt-2 hover:bg-amber transition-colors cursor-pointer"
			>
				Engage
			</button>

			<div class="lcars-divider mt-1" aria-hidden="true">
				<span class="w-8 bg-amber/60"></span>
				<span class="flex-1 bg-rail"></span>
				<span class="w-3 bg-rail"></span>
			</div>
		</form>
	</div>
</div>
