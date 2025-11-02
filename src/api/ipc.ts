import type { Hono } from 'hono'

export const ipcRoutes = (honoApp: Hono) => {
	honoApp.get('/jobs', (c) => {
		return c.text('Hello Jobs!')
	})
}
