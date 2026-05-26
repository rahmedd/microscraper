import { logger } from './logger'

export function checkEnvVars() {
	const requiredEnvVars = [
		'NODE_ENV',
		'CS_URL',
		'SLACK_BOT_TOKEN',
		'SLACK_APP_TOKEN',
		'SLACK_CHANNEL_ID',
		'DB_URL',
		'API_PORT',
	]

	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			logger.error(`Error: Environment variable ${envVar} is not set.`)
			process.exit(1)
		}
	}
	logger.info('All required environment variables are set.')

}
