// Initalize database

import 'dotenv/config'
import { flags } from './db/schema'
import { db } from './db/db'

async function main() {
	const user: typeof flags.$inferInsert = {
		name: 'SCHEDULER',
		enabled: true,
	}

	await db.insert(flags).values(user)
}

main()
