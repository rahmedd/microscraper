import { App, type AllMiddlewareArgs, type SlackEventMiddlewareArgs } from '@slack/bolt'

export const app = new App({
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

const register = (app: App) => {
	app.message(/^(hi|hello|hey).*/, sampleMessageCallback)
}

export const registerListeners = (app: App) => {
	register(app)
}
