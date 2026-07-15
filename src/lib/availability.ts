import { dayDiff, isIsoDate } from "./dates"

export type EntryWindow = {
	startDate: string
	endDate: string
	startMin: number | null
	endMin: number | null
}

export type DayWindow = { start: number; end: number }

export type EntryInput = {
	startDate: unknown
	endDate?: unknown
	startMin?: unknown
	endMin?: unknown
}

const isMinute = (v: unknown): v is number =>
	typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 1440

export function normalizeEntry(input: EntryInput): EntryWindow | null {
	if (!isIsoDate(input.startDate)) return null
	const startDate = input.startDate
	const endDate = input.endDate == null ? startDate : input.endDate
	if (!isIsoDate(endDate)) return null
	const span = dayDiff(startDate, endDate)
	if (span < 0 || span > 400) return null

	const rawStart = input.startMin ?? null
	const rawEnd = input.endMin ?? null
	if (rawStart === null && rawEnd === null) {
		return { startDate, endDate, startMin: null, endMin: null }
	}
	if (rawStart !== null && !isMinute(rawStart)) return null
	if (rawEnd !== null && !isMinute(rawEnd)) return null
	const startMin = rawStart === null ? 0 : rawStart
	const endMin = rawEnd === null ? 1440 : rawEnd
	if (startMin >= 1440 || endMin <= 0) return null
	if (span === 0 && endMin <= startMin) return null
	if (startMin === 0 && endMin === 1440) {
		return { startDate, endDate, startMin: null, endMin: null }
	}
	return { startDate, endDate, startMin, endMin }
}

export function windowOn(entry: EntryWindow, iso: string): DayWindow | null {
	if (iso < entry.startDate || iso > entry.endDate) return null
	if (entry.startMin === null && entry.endMin === null) return { start: 0, end: 1440 }
	const first = iso === entry.startDate
	const last = iso === entry.endDate
	const start = first ? (entry.startMin ?? 0) : 0
	const end = last ? (entry.endMin ?? 1440) : 1440
	if (end <= start) return null
	return { start, end }
}

export function mergeWindows(windows: DayWindow[]): DayWindow[] {
	const sorted = windows.toSorted((a, b) => a.start - b.start)
	const merged: DayWindow[] = []
	for (const w of sorted) {
		const prev = merged[merged.length - 1]
		if (prev && w.start <= prev.end) {
			prev.end = Math.max(prev.end, w.end)
		} else {
			merged.push({ ...w })
		}
	}
	return merged
}

export function dayWindows(entries: EntryWindow[], iso: string): DayWindow[] {
	const windows: DayWindow[] = []
	for (const e of entries) {
		const w = windowOn(e, iso)
		if (w) windows.push(w)
	}
	return mergeWindows(windows)
}
