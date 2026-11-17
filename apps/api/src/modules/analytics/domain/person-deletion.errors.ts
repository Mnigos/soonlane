import { Data } from 'effect'

/** PostHog did not accept a person deletion; `reason` is an HTTP status or an error name, never a message, which can hold the Authorization header. */
export class PersonDeletionFailed extends Data.TaggedError(
	'PersonDeletionFailed'
)<{ readonly reason: string }> {}
