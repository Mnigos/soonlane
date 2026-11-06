import type { Label } from '@soonlane/contracts'

/** Names are unique per owner ignoring case, so /labels/$name matches a label in any casing. */
export function isLabelNamed(label: Label, name: string | undefined) {
	return name?.toLowerCase() === label.name.toLowerCase()
}
