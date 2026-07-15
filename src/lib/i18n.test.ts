import { describe, expect, it } from "vitest"
import { messages } from "./i18n"

describe("messages", () => {
	it("has identical keys in both locales", () => {
		expect(Object.keys(messages.de).toSorted()).toEqual(Object.keys(messages.en).toSorted())
	})

	it("has seven weekdays and twelve months", () => {
		for (const locale of ["de", "en"] as const) {
			expect(messages[locale].weekdays).toHaveLength(7)
			expect(messages[locale].weekdaysLong).toHaveLength(7)
			expect(messages[locale].months).toHaveLength(12)
		}
	})
})
