import { requireUser } from '@/modules/identity/presentation/require-user.middleware'
import { os } from '@/platform/rpc/rpc.base'
import { CalendarService } from '../application/calendar.service'

export const calendarRouter = {
	getSubscription: os.calendar.getSubscription
		.use(requireUser)
		.effect(function* ({ context }) {
			const calendarService = yield* CalendarService

			return {
				subscription: yield* calendarService.getSubscription(context.user.id),
			}
		}),
	createSubscription: os.calendar.createSubscription
		.use(requireUser)
		.effect(function* ({ context }) {
			const calendarService = yield* CalendarService

			return yield* calendarService.createSubscription(context.user.id)
		}),
	revokeSubscription: os.calendar.revokeSubscription
		.use(requireUser)
		.effect(function* ({ context }) {
			const calendarService = yield* CalendarService

			yield* calendarService.revokeSubscription(context.user.id)
		}),
}
