import { ANDROID_PACKAGE } from '@soonlane/auth'
import { createFileRoute } from '@tanstack/react-router'

/** A certificate's SHA-256 as Play Console and `keytool` print it. */
const FINGERPRINT_PATTERN = /^(?:[\dA-F]{2}:){31}[\dA-F]{2}$/u

/** Android opens `/android/callback` in the app only when a certificate in `ANDROID_CERT_FINGERPRINTS` (read per request) signed it; without one, no app. */
export const Route = createFileRoute('/.well-known/assetlinks.json')({
	server: {
		handlers: {
			GET: () => {
				const fingerprints = (process.env.ANDROID_CERT_FINGERPRINTS ?? '')
					.split(',')
					.map(fingerprint => fingerprint.trim().toUpperCase())
					.filter(fingerprint => FINGERPRINT_PATTERN.test(fingerprint))

				return Response.json(
					fingerprints.length > 0
						? [
								{
									relation: ['delegate_permission/common.handle_all_urls'],
									target: {
										namespace: 'android_app',
										package_name: ANDROID_PACKAGE,
										sha256_cert_fingerprints: fingerprints,
									},
								},
							]
						: []
				)
			},
		},
	},
})
