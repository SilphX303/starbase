<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Starbase — Authorisation</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<div class="lcars-panel bg-amber text-space px-6 py-4 rounded-t-[2.5rem] rounded-b-none">
			<h1 class="font-bold text-xl tracking-widest">STARBASE</h1>
			<p class="text-xs tracking-wider opacity-80">SHIP OPERATIONS CONSOLE</p>
		</div>
		<form method="POST" class="lcars-panel rounded-t-none p-6 flex flex-col gap-4">
			<p class="lcars-label">Officer authorisation required</p>

			{#if form?.error}
				<p class="text-alert text-sm">{form.error}</p>
			{/if}

			<label class="flex flex-col gap-1">
				<span class="lcars-label">Email</span>
				<input
					name="email"
					type="email"
					required
					autocomplete="username"
					value={form?.email ?? ''}
					class="bg-panel-2 rounded-xl px-4 py-3 text-glow outline-none focus:ring-2 focus:ring-amber"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="lcars-label">Password</span>
				<input
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="bg-panel-2 rounded-xl px-4 py-3 text-glow outline-none focus:ring-2 focus:ring-amber"
				/>
			</label>

			<button
				type="submit"
				class="lcars-pill bg-orange text-space font-bold py-3 mt-2 hover:bg-amber transition-colors cursor-pointer"
			>
				Engage
			</button>
		</form>
	</div>
</div>
