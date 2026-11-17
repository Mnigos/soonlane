import { z } from 'zod'

/** The tags a launch link carries (`docs/analytics.md`, Launch links). */
export const CAMPAIGN_PARAMS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
] as const

/** The router parses each value as JSON first, so `utm_campaign=2026` arrives as a number. */
const campaignParamSchema = z
	.union([z.string(), z.number(), z.boolean()])
	.optional()
	.catch(undefined)

/**
 * PostHog reads the tags from the address only once the visitor answers the consent banner, so every page keeps
 * them in its address and the links into the app carry them along.
 */
export const campaignSearchSchema = z.object({
	utm_source: campaignParamSchema,
	utm_medium: campaignParamSchema,
	utm_campaign: campaignParamSchema,
	utm_content: campaignParamSchema,
	utm_term: campaignParamSchema,
})
