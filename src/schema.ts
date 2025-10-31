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

export const products = sqliteTable('products', {
	id: int().primaryKey({ autoIncrement: true }),
	url: text().notNull(),
	threshold: int().notNull(),
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
	oldPrice: int().notNull(),
	newPrice: int().notNull(),
	createdAt: int({ mode: 'timestamp' })
		.notNull()
		.default(sql`(strftime('%s', 'now'))`),
})
