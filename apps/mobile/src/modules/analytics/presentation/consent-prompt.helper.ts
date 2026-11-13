import { Alert } from 'react-native'
import {
	applyConsent,
	IS_ANALYTICS_ENABLED,
	readAnalyticsConsent,
} from '../infrastructure/analytics.client'
import { ANALYTICS_COPY } from './analytics-copy.constants'

/**
 * Asks once, as an iOS alert like the system's own permission questions, when
 * a user is signed in and this phone has no answer yet. Both buttons have the
 * same weight and the alert cannot be dismissed without an answer.
 */
export function askForAnalyticsConsent() {
	if (!IS_ANALYTICS_ENABLED || readAnalyticsConsent() !== 'unanswered') return

	Alert.alert(
		ANALYTICS_COPY.promptTitle,
		ANALYTICS_COPY.promptBody,
		[
			{
				text: ANALYTICS_COPY.reject,
				onPress: () => applyConsent('denied', 'prompt'),
			},
			{
				text: ANALYTICS_COPY.accept,
				onPress: () => applyConsent('granted', 'prompt'),
			},
		],
		{ userInterfaceStyle: 'dark' }
	)
}
