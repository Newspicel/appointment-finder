const HUES = [250, 25, 195, 60, 315, 105, 345, 280]

export function personColor(index: number): string {
	const h = HUES[index % HUES.length]
	return `light-dark(oklch(0.58 0.14 ${h}), oklch(0.74 0.11 ${h}))`
}
