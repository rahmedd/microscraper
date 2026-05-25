/**
 * Lightweight Slack Web API client.
 * Uses fetch directly to avoid importing @slack/bolt,
 * which creates a Socket Mode WebSocket connection at module load time.
 */
export async function postSlackMessage(channel: string, text: string) {
	const response = await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ channel, text }),
	})

	const data = await response.json()

	if (!data.ok) {
		throw new Error(`Slack API error: ${data.error}`)
	}

	return data
}
