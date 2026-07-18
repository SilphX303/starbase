<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const meal = $derived(page.url.searchParams.get('meal') ?? 'snack');
	const d = $derived(page.url.searchParams.get('d') ?? '');

	let videoEl: HTMLVideoElement;
	let status = $state<'starting' | 'scanning' | 'looking-up' | 'error' | 'not-found'>('starting');
	let errorMsg = $state('');
	let lastCode = $state('');
	let stream: MediaStream | null = null;
	let stopLoop = false;

	async function getDetector() {
		if ('BarcodeDetector' in window) {
			const formats = await window.BarcodeDetector.getSupportedFormats();
			const wanted = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter((f) => formats.includes(f));
			if (wanted.length) return new window.BarcodeDetector({ formats: wanted });
		}
		const { BarcodeDetector } = await import('barcode-detector/ponyfill');
		return new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
	}

	onMount(async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
			videoEl.srcObject = stream;
			await videoEl.play();
			const detector = await getDetector();
			status = 'scanning';

			while (!stopLoop) {
				try {
					const codes = await detector.detect(videoEl);
					if (codes.length && codes[0].rawValue) {
						const code = codes[0].rawValue;
						if (code !== lastCode) {
							lastCode = code;
							status = 'looking-up';
							const res = await fetch(`/api/food/barcode/${encodeURIComponent(code)}`);
							if (res.ok) {
								const { food } = await res.json();
								stopLoop = true;
								goto(`/reactor/add?food=${food.id}&meal=${meal}&d=${d}`);
								return;
							}
							status = 'not-found';
							setTimeout(() => {
								if (!stopLoop) status = 'scanning';
							}, 2000);
						}
					}
				} catch {
					// per-frame detect errors are fine; keep scanning
				}
				await new Promise((r) => setTimeout(r, 150));
			}
		} catch (e) {
			status = 'error';
			errorMsg =
				e instanceof DOMException && e.name === 'NotAllowedError'
					? 'Camera permission denied. Grant camera access and reload.'
					: 'Could not start the camera. Scanning needs HTTPS (or localhost) and a camera.';
		}
	});

	onDestroy(() => {
		stopLoop = true;
		stream?.getTracks().forEach((t) => t.stop());
	});
</script>

<svelte:head>
	<title>Starbase — Barcode scan</title>
</svelte:head>

<header class="lcars-panel bg-lavender text-space px-5 py-4 mb-4">
	<h1 class="font-bold text-xl tracking-widest">TRICORDER SCAN</h1>
	<p class="text-xs tracking-wider opacity-80 uppercase">{meal} · point at a barcode</p>
</header>

<div class="lcars-panel overflow-hidden relative">
	<!-- svelte-ignore a11y_media_has_caption -->
	<video bind:this={videoEl} playsinline muted class="w-full aspect-[4/3] object-cover bg-space"></video>
	<div class="absolute inset-0 pointer-events-none flex items-center justify-center">
		<div class="w-3/4 h-24 border-2 rounded-xl {status === 'looking-up' ? 'border-amber animate-pulse' : status === 'not-found' ? 'border-alert' : 'border-teal/60'}"></div>
	</div>
</div>

<p class="lcars-label mt-3">
	{#if status === 'starting'}Initialising sensors…
	{:else if status === 'scanning'}Scanning — hold the barcode inside the frame
	{:else if status === 'looking-up'}Signal acquired — querying database…
	{:else if status === 'not-found'}Code {lastCode} not in the database — try again, or add it as a custom entry
	{:else}{errorMsg}{/if}
</p>

<div class="mt-4 flex gap-3">
	<a href="/reactor/add?meal={meal}&d={d}" class="lcars-pill bg-panel-2 text-dim font-bold text-sm px-4 py-2 hover:text-glow transition-colors">Search instead</a>
	<a href="/reactor?d={d}" class="lcars-pill bg-panel-2 text-dim font-bold text-sm px-4 py-2 hover:text-glow transition-colors">← Reactor</a>
</div>
