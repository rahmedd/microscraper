export function checkEnvVars() {
	const requiredEnvVars = [
		'NODE_ENV',
		'CS_URL',
		'SLACK_BOT_TOKEN',
		'SLACK_APP_TOKEN',
		'SLACK_CHANNEL_ID',
		'DB_URL',
	]

	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			console.error(`Error: Environment variable ${envVar} is not set.`)
			process.exit(1)
		}
	}
	console.log('All required environment variables are set.')

}
