import { oc } from '@orpc/contract'
import { z } from 'zod'

export const healthOutputSchema = z.object({
	ok: z.boolean(),
	db: z.enum(['ok', 'down']),
	version: z.string(),
	commit: z.string(),
})
export type HealthOutput = z.infer<typeof healthOutputSchema>

export const systemContract = {
	health: oc.output(healthOutputSchema),
}
