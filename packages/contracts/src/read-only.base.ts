import { defineMeta, oc } from '@orpc/contract'

const [readOnlyMeta, getReadOnlyMeta] = defineMeta(
	'readOnly',
	(incoming: true) => incoming
)

/** The builder for procedures that only read. Maintenance mode refuses every procedure built without it. */
export const query = oc.meta(readOnlyMeta(true))

/** Whether a procedure was built from `query`; one without the flag counts as a write. */
export function isReadOnly(procedure: Parameters<typeof getReadOnlyMeta>[0]) {
	return getReadOnlyMeta(procedure) === true
}
