import { describe, expect, it } from "vitest"
import { addMonths, dayDiff, fmtDate, fmtTime, isIsoDate, monthGrid, parseTime } from "./dates"

describe("monthGrid", () => {
	it("starts weeks on Monday", () => {
		const weeks = monthGrid(2026, 6)
		expect(weeks[0][0].iso).toBe("2026-06-29")
		expect(weeks[0][2].iso).toBe("2026-07-01")
	})

	it("covers the full month with padding days", () => {
		const weeks = monthGrid(2026, 6)
		const days = weeks.flat()
		expect(days.length % 7).toBe(0)
		expect(days.filter((d) => d.inMonth)).toHaveLength(31)
		expect(days.at(-1)?.iso).toBe("2026-08-02")
	})

	it("handles February in a leap year", () => {
		const days = monthGrid(2024, 1).flat()
		expect(days.filter((d) => d.inMonth)).toHaveLength(29)
	})
})

describe("formatting", () => {
	it("formats dates as DD/MM/YYYY", () => {
		expect(fmtDate("2026-07-15")).toBe("15/07/2026")
	})

	it("formats times as 24h HH:MM", () => {
		expect(fmtTime(0)).toBe("00:00")
		expect(fmtTime(840)).toBe("14:00")
		expect(fmtTime(1440)).toBe("24:00")
	})

	it("parses HH:MM into minutes", () => {
		expect(parseTime("00:00")).toBe(0)
		expect(parseTime("23:59")).toBe(1439)
		expect(parseTime("24:00")).toBeNull()
		expect(parseTime("nope")).toBeNull()
	})
})

describe("date helpers", () => {
	it("validates ISO dates", () => {
		expect(isIsoDate("2026-07-15")).toBe(true)
		expect(isIsoDate("2026-02-30")).toBe(false)
		expect(isIsoDate("15/07/2026")).toBe(false)
	})

	it("computes day differences", () => {
		expect(dayDiff("2026-07-15", "2026-07-18")).toBe(3)
		expect(dayDiff("2026-07-31", "2026-08-01")).toBe(1)
	})

	it("adds months with year rollover", () => {
		expect(addMonths(2026, 11, 1)).toEqual([2027, 0])
		expect(addMonths(2026, 0, -1)).toEqual([2025, 11])
	})
})
