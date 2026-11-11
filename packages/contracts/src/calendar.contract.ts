import { oc } from '@orpc/contract'
import { z } from 'zod'
import { authErrors } from './auth.errors'

/** What the app may show about an existing link: never the link itself, which only `createSubscription` returns. */
export const calendarSubscriptionSchema = z.object({ createdAt: z.date() })

export type CalendarSubscription = z.infer<typeof calendarSubscriptionSchema>

export const createdCalendarSubscriptionSchema = z.object({
	subscription: calendarSubscriptionSchema,
	url: z.url(),
})

export type CreatedCalendarSubscription = z.infer<
	typeof createdCalendarSubscriptionSchema
>

export const calendarContract = {
	getSubscription: oc
		.errors(authErrors)
		.output(z.object({ subscription: calendarSubscriptionSchema.optional() })),
	createSubscription: oc
		.errors(authErrors)
		.output(createdCalendarSubscriptionSchema),
	revokeSubscription: oc.errors(authErrors).output(z.void()),
}
