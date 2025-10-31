import 'dotenv/config'

import { app, registerListeners } from './slack'
import { startScheduler } from './scheduler'
import { checkEnvVars } from './utils'

checkEnvVars();

(async () => {
	// Register listeners
	registerListeners(app)

	// Start your app
	await app.start(process.env.PORT || 3000)
	app.logger.info('⚡️ Bolt app is running!')

	// Start the scheduler
	startScheduler()
})()
