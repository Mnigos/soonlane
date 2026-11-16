import { oc } from '@orpc/contract'
import { z } from 'zod'

export const healthOutputSchema = z.object({
	ok: z.boolean(),
	db: z.enum(['ok', 'down']),
	version: z.string(),
	commit: z.string(),
})
export type HealthOutput = z.infer<typeof healthOutputSchema>

/** A SemVer 2.0 version (semver.org's own pattern): `1.2.3`, a prerelease such as `0.2.0-nightly.20261112.1`, build metadata such as `+build.1`. */
export const APP_VERSION_PATTERN =
	/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*))*)?(?:\+[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*)?$/u

export const appSupportOutputSchema = z.object({
	isSupported: z.boolean(),
	/** The oldest version of that app this API still serves. */
	minimumVersion: z.string(),
})
export type AppSupportOutput = z.infer<typeof appSupportOutputSchema>

const appSupportInputSchema = z.object({
	version: z.string().regex(APP_VERSION_PATTERN),
})

export const systemContract = {
	health: oc.output(healthOutputSchema),
	/** Whether a desktop app of this version may keep calling this API; an older one asks its user to update. */
	desktopSupport: oc
		.input(appSupportInputSchema)
		.output(appSupportOutputSchema),
	/** The same for the iPhone and Android app, which share one version. */
	mobileSupport: oc.input(appSupportInputSchema).output(appSupportOutputSchema),
}
