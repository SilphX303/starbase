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
</script>

<a href={href} class="lcars-panel flex overflow-hidden hover:brightness-110 transition-[filter]">
	<div class="w-3 shrink-0 {color}"></div>
	<div class="p-4 md:p-5 flex-1">
		<div class="flex items-baseline justify-between gap-2">
			<h2 class="font-bold tracking-widest uppercase text-sm md:text-base">{name}</h2>
			<span class="font-mono text-2xl md:text-3xl tabular-nums">
				{status === null ? '——' : status}<span class="text-dim text-sm">{status === null ? '' : '%'}</span>
			</span>
		</div>
		<p class="lcars-label mt-1">{domain}</p>
		<div class="mt-3 h-2 rounded-full bg-panel-2 overflow-hidden">
			<div class="h-full rounded-full {color}" style="width: {status ?? 0}%"></div>
		</div>
		<p class="text-dim text-xs mt-2 tracking-wider">
			{status === null ? 'AWAITING SENSOR DATA' : 'NOMINAL'}
		</p>
	</div>
</a>
