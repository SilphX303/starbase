<script lang="ts">
	interface Point {
		d: string;
		value: number;
		ema: number;
	}

	let {
		points,
		unit,
		color = 'var(--color-salmon)'
	}: { points: Point[]; unit: string; color?: string } = $props();

	const W = 600;
	const H = 180;
	const PAD = { l: 44, r: 10, t: 10, b: 22 };

	const geom = $derived.by(() => {
		if (points.length === 0) return null;
		const vals = points.flatMap((p) => [p.value, p.ema]);
		let lo = Math.min(...vals);
		let hi = Math.max(...vals);
		const span = Math.max(hi - lo, 1);
		lo -= span * 0.1;
		hi += span * 0.1;
		const x = (i: number) =>
			PAD.l + (points.length === 1 ? 0.5 : i / (points.length - 1)) * (W - PAD.l - PAD.r);
		const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
		const emaPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.ema)}`).join(' ');
		return { x, y, lo, hi, emaPath };
	});

	const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
</script>

{#if geom && points.length > 0}
	<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="Trend chart">
		<!-- y axis labels -->
		{#each [geom.lo + (geom.hi - geom.lo) * 0.1, (geom.lo + geom.hi) / 2, geom.hi - (geom.hi - geom.lo) * 0.1] as v (v)}
			<text x={PAD.l - 6} y={geom.y(v) + 4} text-anchor="end" font-size="11" fill="var(--color-dim)" font-family="monospace">{fmt(v)}</text>
			<line x1={PAD.l} y1={geom.y(v)} x2={W - PAD.r} y2={geom.y(v)} stroke="var(--color-panel-2)" stroke-width="1" />
		{/each}
		<!-- raw points -->
		{#each points as p, i (p.d)}
			<circle cx={geom.x(i)} cy={geom.y(p.value)} r="3" fill={color} opacity="0.45" />
		{/each}
		<!-- EMA line -->
		<path d={geom.emaPath} fill="none" stroke={color} stroke-width="2.5" stroke-linecap="round" />
		<!-- x labels: first + last -->
		<text x={PAD.l} y={H - 6} font-size="11" fill="var(--color-dim)" font-family="monospace">{points[0].d.slice(5)}</text>
		<text x={W - PAD.r} y={H - 6} text-anchor="end" font-size="11" fill="var(--color-dim)" font-family="monospace">{points[points.length - 1].d.slice(5)}</text>
	</svg>
	<p class="text-dim text-xs mt-1">Dots: readings ({unit}) · Line: 7-day trend (EMA)</p>
{:else}
	<p class="text-dim text-sm">No sensor data yet.</p>
{/if}
