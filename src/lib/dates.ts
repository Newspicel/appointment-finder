export type GridDay = {
	iso: string
	day: number
	inMonth: boolean
}

const pad = (n: number) => String(n).padStart(2, "0")

export function todayIso(): string {
	const d = new Date()
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isIsoDate(s: unknown): s is string {
	if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
	const [y, m, d] = s.split("-").map(Number)
	if (m < 1 || m > 12 || d < 1) return false
	return d <= new Date(y, m, 0).getDate()
}

export function dayDiff(a: string, b: string): number {
	return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

export function monthOf(iso: string): [number, number] {
	const [y, m] = iso.split("-").map(Number)
	return [y, m - 1]
}

export function addMonths(year: number, month0: number, delta: number): [number, number] {
	const d = new Date(year, month0 + delta, 1)
	return [d.getFullYear(), d.getMonth()]
}

export function monthGrid(year: number, month0: number): GridDay[][] {
	const firstWeekday = (new Date(year, month0, 1).getDay() + 6) % 7
	const daysInMonth = new Date(year, month0 + 1, 0).getDate()
	const cells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
	const weeks: GridDay[][] = []
	for (let i = 0; i < cells; i++) {
		const d = new Date(year, month0, 1 - firstWeekday + i)
		if (i % 7 === 0) weeks.push([])
		weeks[weeks.length - 1].push({
			iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
			day: d.getDate(),
			inMonth: d.getMonth() === month0,
		})
	}
	return weeks
}

export function fmtDate(iso: string): string {
	const [y, m, d] = iso.split("-")
	return `${d}/${m}/${y}`
}

export function fmtTime(min: number): string {
	return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function parseTime(value: string): number | null {
	const m = /^(\d{2}):(\d{2})$/.exec(value)
	if (!m) return null
	const min = Number(m[1]) * 60 + Number(m[2])
	return min >= 0 && min < 1440 ? min : null
}
