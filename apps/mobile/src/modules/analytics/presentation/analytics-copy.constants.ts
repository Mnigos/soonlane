import { CONSENT_COPY } from '@soonlane/analytics/consent-copy'

/** The iPhone app's consent text: the web's title, buttons and switch label, with its own body, because a rejection here sends nothing (docs/analytics.md quotes it). */
export const ANALYTICS_COPY = {
	promptTitle: CONSENT_COPY.bannerTitle,
	promptBody:
		'Can we link usage analytics for actions you take to your account, without your tasks, projects, labels, name, or email? If you reject, we send nothing, and you can change this in Settings.',
	accept: CONSENT_COPY.accept,
	reject: CONSENT_COPY.reject,
	switchLabel: CONSENT_COPY.analyticsLabel,
	switchDescription:
		'Usage analytics for actions you take, linked to your account without your tasks, projects, labels, name, or email. When off, we send no analytics.',
} as const
