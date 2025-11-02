// Initalize database

import 'dotenv/config'
import { flags } from './schema'
import { db } from './db'

async function main() {
	const user: typeof flags.$inferInsert = {
		name: 'SCHEDULER',
		enabled: true,
	}

	await db.insert(flags).values(user)
}

main()
