// Minimal typings for the native BarcodeDetector (Chromium) used with the ponyfill fallback.
interface DetectedBarcode {
	rawValue: string;
	format: string;
}

declare class BarcodeDetector {
	constructor(options?: { formats: string[] });
	static getSupportedFormats(): Promise<string[]>;
	detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface Window {
	BarcodeDetector: typeof BarcodeDetector;
}
