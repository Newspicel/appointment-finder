import { env } from "cloudflare:workers"
import { createServerFn } from "@tanstack/react-start"
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server"
import type { EntryInput } from "@/lib/availability"
import type { SessionSnapshot } from "@/session-do"

const TOKEN_COOKIE = "afid"
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function sessionStub(sessionId: string) {
	if (!UUID_RE.test(sessionId)) throw new Error("not_found")
	return env.SESSION_DO.get(env.SESSION_DO.idFromName(sessionId))
}

function currentToken(): string {
	return getCookie(TOKEN_COOKIE) ?? ""
}

function ensureToken(): string {
	const existing = getCookie(TOKEN_COOKIE)
	if (existing && UUID_RE.test(existing)) return existing
	const token = crypto.randomUUID()
	setCookie(TOKEN_COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: true,
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	})
	return token
}

export const getLocale = createServerFn().handler(async () => {
	const cookie = getCookie("lang")
	if (cookie === "de" || cookie === "en") return cookie
	const header = getRequestHeader("accept-language") ?? ""
	return header.toLowerCase().startsWith("de") ? "de" : "en"
})

export const createSession = createServerFn({ method: "POST" })
	.inputValidator((data: { title: string }) => data)
	.handler(async ({ data }) => {
		const token = ensureToken()
		const sessionId = crypto.randomUUID()
		await sessionStub(sessionId).create(token, data.title)
		return { sessionId }
	})

export const getSession = createServerFn()
	.inputValidator((data: { sessionId: string }) => data)
	.handler(async ({ data }): Promise<SessionSnapshot | null> => {
		if (!UUID_RE.test(data.sessionId)) return null
		return sessionStub(data.sessionId).snapshot(currentToken())
	})

export const joinSession = createServerFn({ method: "POST" })
	.inputValidator((data: { sessionId: string; name: string }) => data)
	.handler(async ({ data }) => {
		const token = ensureToken()
		await sessionStub(data.sessionId).join(token, data.name)
	})

export const renameSelf = createServerFn({ method: "POST" })
	.inputValidator((data: { sessionId: string; name: string }) => data)
	.handler(async ({ data }) => {
		await sessionStub(data.sessionId).rename(currentToken(), data.name)
	})

export const addEntry = createServerFn({ method: "POST" })
	.inputValidator((data: { sessionId: string; entry: EntryInput }) => data)
	.handler(async ({ data }) => {
		await sessionStub(data.sessionId).addEntry(currentToken(), data.entry)
	})

export const removeEntry = createServerFn({ method: "POST" })
	.inputValidator((data: { sessionId: string; entryId: string }) => data)
	.handler(async ({ data }) => {
		await sessionStub(data.sessionId).removeEntry(currentToken(), data.entryId)
	})

export const removePerson = createServerFn({ method: "POST" })
	.inputValidator((data: { sessionId: string; personId: string }) => data)
	.handler(async ({ data }) => {
		await sessionStub(data.sessionId).removePerson(currentToken(), data.personId)
	})

export const deleteSession = createServerFn({ method: "POST" })
	.inputValidator((data: { sessionId: string }) => data)
	.handler(async ({ data }) => {
		await sessionStub(data.sessionId).deleteSession(currentToken())
	})
