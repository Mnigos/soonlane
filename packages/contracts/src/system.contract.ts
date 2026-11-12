import { z } from 'zod'
import { query } from './read-only.base'

export const healthOutputSchema = z.object({
	ok: z.boolean(),
	db: z.enum(['ok', 'down']),
	maintenance: z.boolean(),
	version: z.string(),
	commit: z.string(),
})
export type HealthOutput = z.infer<typeof healthOutputSchema>

export const systemContract = {
	health: query.output(healthOutputSchema),
}
