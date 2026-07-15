import { describe, expect, it } from "vitest"
import { dayWindows, mergeWindows, normalizeEntry, windowOn } from "./availability"

describe("normalizeEntry", () => {
	it("accepts a plain all-day entry", () => {
		expect(normalizeEntry({ startDate: "2026-07-15" })).toEqual({
			startDate: "2026-07-15",
			endDate: "2026-07-15",
			startMin: null,
			endMin: null,
		})
	})

	it("defaults missing bounds to start and end of day", () => {
		expect(normalizeEntry({ startDate: "2026-07-15", startMin: 720 })).toEqual({
			startDate: "2026-07-15",
			endDate: "2026-07-15",
			startMin: 720,
			endMin: 1440,
		})
	})

	it("collapses full-day times to all-day", () => {
		expect(normalizeEntry({ startDate: "2026-07-15", startMin: 0, endMin: 1440 })).toEqual({
			startDate: "2026-07-15",
			endDate: "2026-07-15",
			startMin: null,
			endMin: null,
		})
	})

	it("rejects inverted same-day times", () => {
		expect(normalizeEntry({ startDate: "2026-07-15", startMin: 900, endMin: 600 })).toBeNull()
	})

	it("allows inverted times across days", () => {
		expect(
			normalizeEntry({
				startDate: "2026-07-15",
				endDate: "2026-07-17",
				startMin: 900,
				endMin: 600,
			}),
		).toMatchObject({ startMin: 900, endMin: 600 })
	})

	it("rejects invalid dates and ranges", () => {
		expect(normalizeEntry({ startDate: "2026-02-30" })).toBeNull()
		expect(normalizeEntry({ startDate: "2026-07-15", endDate: "2026-07-14" })).toBeNull()
		expect(normalizeEntry({ startDate: "2026-07-15", startMin: 12.5 })).toBeNull()
	})
})

describe("windowOn", () => {
	const range = {
		startDate: "2026-07-15",
		endDate: "2026-07-17",
		startMin: 840,
		endMin: 720,
	}

	it("clips the first day at the start time", () => {
		expect(windowOn(range, "2026-07-15")).toEqual({ start: 840, end: 1440 })
	})

	it("covers middle days fully", () => {
		expect(windowOn(range, "2026-07-16")).toEqual({ start: 0, end: 1440 })
	})

	it("clips the last day at the end time", () => {
		expect(windowOn(range, "2026-07-17")).toEqual({ start: 0, end: 720 })
	})

	it("returns null outside the range", () => {
		expect(windowOn(range, "2026-07-14")).toBeNull()
		expect(windowOn(range, "2026-07-18")).toBeNull()
	})

	it("handles same-day timed entries", () => {
		const e = { startDate: "2026-07-15", endDate: "2026-07-15", startMin: 720, endMin: 1080 }
		expect(windowOn(e, "2026-07-15")).toEqual({ start: 720, end: 1080 })
	})
})

describe("mergeWindows", () => {
	it("merges overlapping and adjacent windows", () => {
		expect(
			mergeWindows([
				{ start: 600, end: 720 },
				{ start: 700, end: 800 },
				{ start: 800, end: 900 },
				{ start: 1000, end: 1100 },
			]),
		).toEqual([
			{ start: 600, end: 900 },
			{ start: 1000, end: 1100 },
		])
	})
})

describe("dayWindows", () => {
	it("combines multiple entries for one day", () => {
		const entries = [
			{ startDate: "2026-07-15", endDate: "2026-07-15", startMin: 600, endMin: 720 },
			{ startDate: "2026-07-15", endDate: "2026-07-15", startMin: 660, endMin: 840 },
			{ startDate: "2026-07-14", endDate: "2026-07-14", startMin: null, endMin: null },
		]
		expect(dayWindows(entries, "2026-07-15")).toEqual([{ start: 600, end: 840 }])
		expect(dayWindows(entries, "2026-07-14")).toEqual([{ start: 0, end: 1440 }])
		expect(dayWindows(entries, "2026-07-16")).toEqual([])
	})
})
