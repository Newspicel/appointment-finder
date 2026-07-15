import { DurableObject } from "cloudflare:workers"
import { asc, eq } from "drizzle-orm"
import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite"
import { migrate } from "drizzle-orm/durable-sqlite/migrator"
import migrations from "../drizzle/migrations"
import { entries, meta, persons } from "./db/schema"
import { type EntryInput, normalizeEntry } from "./lib/availability"

export type SessionEntry = {
	id: string
	startDate: string
	endDate: string
	startMin: number | null
	endMin: number | null
}

export type SessionPerson = {
	id: string
	name: string
	entries: SessionEntry[]
}

export type SessionSnapshot = {
	title: string
	meId: string | null
	isCreator: boolean
	persons: SessionPerson[]
}

const MAX_PERSONS = 50
const MAX_ENTRIES = 300

function cleanName(value: unknown, max: number): string | null {
	if (typeof value !== "string") return null
	const name = value.replace(/\s+/g, " ").trim()
	if (name.length === 0 || name.length > max) return null
	return name
}

export class SessionDurableObject extends DurableObject<Env> {
	private db: DrizzleSqliteDODatabase

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)
		this.db = drizzle(ctx.storage)
		ctx.blockConcurrencyWhile(async () => {
			await migrate(this.db, migrations)
		})
	}

	private getMeta() {
		return this.db.select().from(meta).get() ?? null
	}

	private getPerson(token: string) {
		return this.db.select().from(persons).where(eq(persons.token, token)).get() ?? null
	}

	create(token: string, title: unknown): boolean {
		if (this.getMeta()) return false
		const clean = cleanName(title, 80) ?? ""
		this.db
			.insert(meta)
			.values({
				id: 1,
				title: clean,
				creatorToken: token,
				createdAt: Date.now(),
			})
			.run()
		return true
	}

	snapshot(token: string): SessionSnapshot | null {
		const m = this.getMeta()
		if (!m) return null
		const people = this.db
			.select()
			.from(persons)
			.orderBy(asc(persons.joinedAt), asc(persons.id))
			.all()
		const allEntries = this.db
			.select()
			.from(entries)
			.orderBy(asc(entries.startDate), asc(entries.createdAt))
			.all()
		const me = people.find((p) => p.token === token) ?? null
		return {
			title: m.title,
			meId: me?.id ?? null,
			isCreator: m.creatorToken === token,
			persons: people.map((p) => ({
				id: p.id,
				name: p.name,
				entries: allEntries
					.filter((e) => e.personId === p.id)
					.map((e) => ({
						id: e.id,
						startDate: e.startDate,
						endDate: e.endDate,
						startMin: e.startMin,
						endMin: e.endMin,
					})),
			})),
		}
	}

	join(token: string, name: unknown): void {
		if (!this.getMeta()) throw new Error("not_found")
		const clean = cleanName(name, 40)
		if (!clean) throw new Error("invalid")
		const existing = this.getPerson(token)
		if (existing) {
			this.db.update(persons).set({ name: clean }).where(eq(persons.id, existing.id)).run()
			return
		}
		const count = this.db.select().from(persons).all().length
		if (count >= MAX_PERSONS) throw new Error("full")
		this.db
			.insert(persons)
			.values({
				id: crypto.randomUUID(),
				token,
				name: clean,
				joinedAt: Date.now(),
			})
			.run()
	}

	rename(token: string, name: unknown): void {
		const person = this.getPerson(token)
		if (!person) throw new Error("forbidden")
		const clean = cleanName(name, 40)
		if (!clean) throw new Error("invalid")
		this.db.update(persons).set({ name: clean }).where(eq(persons.id, person.id)).run()
	}

	addEntry(token: string, input: EntryInput): void {
		const person = this.getPerson(token)
		if (!person) throw new Error("forbidden")
		const entry = normalizeEntry(input)
		if (!entry) throw new Error("invalid")
		const count = this.db.select().from(entries).all().length
		if (count >= MAX_ENTRIES) throw new Error("full")
		this.db
			.insert(entries)
			.values({
				id: crypto.randomUUID(),
				personId: person.id,
				...entry,
				createdAt: Date.now(),
			})
			.run()
	}

	removeEntry(token: string, entryId: unknown): void {
		const person = this.getPerson(token)
		if (!person || typeof entryId !== "string") throw new Error("forbidden")
		const entry = this.db.select().from(entries).where(eq(entries.id, entryId)).get()
		if (!entry || entry.personId !== person.id) throw new Error("forbidden")
		this.db.delete(entries).where(eq(entries.id, entryId)).run()
	}

	removePerson(token: string, personId: unknown): void {
		const m = this.getMeta()
		if (!m || m.creatorToken !== token || typeof personId !== "string") {
			throw new Error("forbidden")
		}
		this.db.delete(entries).where(eq(entries.personId, personId)).run()
		this.db.delete(persons).where(eq(persons.id, personId)).run()
	}

	deleteSession(token: string): void {
		const m = this.getMeta()
		if (!m || m.creatorToken !== token) throw new Error("forbidden")
		this.db.delete(entries).run()
		this.db.delete(persons).run()
		this.db.delete(meta).run()
	}
}
