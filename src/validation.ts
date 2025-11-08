import { object, string, pipe, regex, boolean, number, optional, url } from 'valibot'

export const idParamSchema = object({
	id: pipe(string(), regex(/^[0-9]+$/, 'ID must be a number')),
})

export const updateFlagSchema = object({
	enabled: optional(boolean()),
})

export const createFlagSchema = object({
	name: string(),
	enabled: optional(boolean()),
})

export const createProductSchema = object({
	url: pipe(string(), url()),
	threshold: number(),
	enabled: optional(boolean()),
})

export const updateProductSchema = object({
	url: optional(pipe(string(), url())),
	threshold: optional(number()),
	enabled: optional(boolean()),
})
