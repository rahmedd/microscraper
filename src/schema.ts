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
	url: text().notNull(),
	threshold: int().notNull(),
	enabled: int({ mode: 'boolean' }).notNull().default(true),
	createdAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
	updatedAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
})

export const prices = sqliteTable('prices', {
	id: int().primaryKey({ autoIncrement: true }),
	productId: int().references(() => products.id),
	price: int().notNull(),
	sale: int({ mode: 'boolean' }).notNull().default(false),
	condition: text({ enum: ['NEW', 'OPENBOX', 'REFURB', 'USED'] }).notNull(),
	createdAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
})

export type PRICE_COND = typeof prices.condition.enumValues[number]
