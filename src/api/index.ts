import { Hono } from 'hono'
import { apiRoutes } from './api'
import { ipcRoutes } from './ipc'

export const honoApp = new Hono()

apiRoutes(honoApp)
ipcRoutes(honoApp)
