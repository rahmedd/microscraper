import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// export const usersTable = sqliteTable('users_table', {
// 	id: int().primaryKey({ autoIncrement: true }),
// 	username: text().notNull().unique(),
// 	password: text().notNull(),
// 	createdAt: int({ mode: 'timestamp' })
// 		.notNull()
// 		.default(sql`(strftime('%s', 'now'))`),
// 	updatedAt: int({ mode: 'timestamp' })
// 		.notNull()
// 		.default(sql`(strftime('%s', 'now'))`),
// })

export const flags = sqliteTable('flags', {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	enabled: int({ mode: 'boolean' }).notNull().default(false),
})

export const products = sqliteTable('products', {
	id: int().primaryKey({ autoIncrement: true }),
	name: text(), // not a source of truth, just for user convenience
	url: text().notNull(),
	store: text().notNull().default('micro'),
	threshold: int().notNull(),
	enabled: int({ mode: 'boolean' }).notNull().default(true),
	createdAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
	updatedAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
})

// export const conditions = ['NEW', 'OPENBOX', 'REFURB', 'USED'] as const

export const prices = sqliteTable('prices', {
	id: int().primaryKey({ autoIncrement: true }),
	productId: int().references(() => products.id),
	price: int(),
	sale: int({ mode: 'boolean' }).notNull().default(false),
	condition: text({ enum: ['NEW', 'OPENBOX', 'REFURB', 'USED'] }).notNull(),
	createdAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
})

export type PRICE_COND = typeof prices.condition.enumValues[number]
export const conditions = prices.condition.enumValues
export type Product = typeof products.$inferSelect
export type Price = typeof prices.$inferSelect
