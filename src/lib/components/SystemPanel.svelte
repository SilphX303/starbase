<script lang="ts">
	let {
		name,
		domain,
		status,
		color,
		href
	}: {
		name: string;
		domain: string;
		status: number | null;
		color: string;
		href: string;
	} = $props();

	const statusWord = $derived(
		status === null
			? 'AWAITING SENSOR DATA'
			: status >= 70
				? 'NOMINAL'
				: status >= 30
					? 'DEGRADED'
					: 'LOW POWER'
	);
	const statusClass = $derived(
		status === null
			? 'text-dim'
			: status >= 70
				? 'text-teal'
				: status >= 30
					? 'text-amber'
					: 'text-alert'
	);
</script>

<a
	href={href}
	class="lcars-panel flex overflow-hidden hover:brightness-110 transition-[filter] duration-150"
>
	<!-- Colour-blocked side rail with rounded cap -->
	<div class="w-3.5 shrink-0 flex flex-col gap-1 py-2 pl-1" aria-hidden="true">
		<div class="flex-1 w-2.5 rounded-full {color}"></div>
		<div class="h-4 w-2.5 rounded-full {color} opacity-40"></div>
	</div>
	<div class="p-4 md:p-5 flex-1 min-w-0">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<h2 class="font-bold tracking-[0.14em] uppercase text-sm md:text-base leading-tight">{name}</h2>
				<p class="lcars-label mt-1">{domain}</p>
			</div>
			<span
				class="lcars-readout shrink-0 bg-space border border-panel-2 rounded-lg px-2.5 py-1 text-xl md:text-2xl leading-none"
			>
				{status === null ? '——'
					: status}<span class="text-dim text-xs align-baseline">{status === null ? '' : '%'}</span>
			</span>
		</div>
		<div class="mt-3 bar-track h-2">
			<div class="bar-fill {color}" style="width: {status ?? 0}%"></div>
		</div>
		<p class="text-xs mt-2 tracking-[0.14em] font-bold {statusClass}">{statusWord}</p>
	</div>
</a>
