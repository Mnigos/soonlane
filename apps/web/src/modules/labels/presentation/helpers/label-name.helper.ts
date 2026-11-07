import type { Label } from '@soonlane/contracts'

export function isLabelNamed(label: Label, name: string | undefined) {
	return name?.toLowerCase() === label.name.toLowerCase()
}
