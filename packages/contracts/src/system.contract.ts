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

export const desktopSupportOutputSchema = z.object({
	isSupported: z.boolean(),
	/** The oldest desktop app version this API still serves. */
	minimumVersion: z.string(),
})
export type DesktopSupportOutput = z.infer<typeof desktopSupportOutputSchema>

export const systemContract = {
	health: oc.output(healthOutputSchema),
	/** Whether a desktop app of this version may keep calling this API; an older one asks its user to update. */
	desktopSupport: oc
		.input(z.object({ version: z.string().regex(APP_VERSION_PATTERN) }))
		.output(desktopSupportOutputSchema),
}
