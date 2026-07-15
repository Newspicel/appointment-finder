import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const meta = sqliteTable("meta", {
	id: integer("id").primaryKey(),
	title: text("title").notNull(),
	creatorToken: text("creator_token").notNull(),
	createdAt: integer("created_at").notNull(),
})

export const persons = sqliteTable("persons", {
	id: text("id").primaryKey(),
	token: text("token").notNull().unique(),
	name: text("name").notNull(),
	joinedAt: integer("joined_at").notNull(),
})

export const entries = sqliteTable("entries", {
	id: text("id").primaryKey(),
	personId: text("person_id").notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date").notNull(),
	startMin: integer("start_min"),
	endMin: integer("end_min"),
	createdAt: integer("created_at").notNull(),
})
