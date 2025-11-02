import 'dotenv/config'
import { App, type AllMiddlewareArgs, type SlackEventMiddlewareArgs } from '@slack/bolt'
import { db } from './db'
import { flags } from './schema'
import { eq } from 'drizzle-orm'
import { checkEnvVars } from './utils'

export const slackApp = new App({
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN
})

const sampleMessageCallback = async ({
	context,
	logger,
	say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'message'>) => {
	try {
		console.log('hello!')
		const greeting = context.matches[0]
		await say(`${greeting}, how are you?`)
	}
	catch (error) {
		logger.error(error)
	}
}

const pauseMessageCallback = async ({
	logger,
	say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'message'>) => {
	try {
		const schedulerEnabled = await db.select().from(flags).where(eq(flags.name, 'SCHEDULER'))
		await db.update(flags).set({ enabled: !schedulerEnabled[0].enabled }).where(eq(flags.name, 'SCHEDULER'))

		await say(`scheduler ${!schedulerEnabled[0].enabled ? 'enabled' : 'disabled'}`)
	}
	catch (error) {
		logger.error(error)
	}
}

const register = (app: App) => {
	app.message(/^(hi|hello|hey).*/i, sampleMessageCallback)
	app.message(/^pause/i, pauseMessageCallback)
}

export const registerListeners = (app: App) => {
	register(app)
}

export const start = async () => {
	checkEnvVars()

	// Register listeners
	registerListeners(slackApp)

	// Start your slack app
	await slackApp.start()
	slackApp.logger.info('⚡️ Bolt app is running!')
}

// Start the app only if this file is run directly
if (require.main === module) {
	start()
}
