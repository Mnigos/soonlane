export const REPOSITORY = 'mnigos/soonlane'
export const LINEAR_TEAM_KEY = 'SOON'
const TICKET_BRANCH_PATTERN = /^soon-(\d+)(?:-|$)/iu

export interface PriorityLabel {
	name: string
	color: string
	description: string
}

/** One label per Linear priority value; Linear's 0 ("No priority") has no label. */
export const PRIORITY_LABELS: Record<number, PriorityLabel> = {
	1: {
		name: 'Urgent Priority',
		color: 'FC7840',
		description: 'Linear priority of the linked SOON ticket: Urgent.',
	},
	2: {
		name: 'High Priority',
		color: '5E6AD2',
		description: 'Linear priority of the linked SOON ticket: High.',
	},
	3: {
		name: 'Medium Priority',
		color: '949CEB',
		description: 'Linear priority of the linked SOON ticket: Medium.',
	},
	4: {
		name: 'Low Priority',
		color: 'C9CDF5',
		description: 'Linear priority of the linked SOON ticket: Low.',
	},
}
const PRIORITY_LABEL_NAMES = new Set(
	Object.values(PRIORITY_LABELS).map(label => label.name)
)

/** Returns the SOON ticket number a Linear-generated branch name (`soon-123-...`) points at. */
export function getTicketNumber(branch: string) {
	const match = TICKET_BRANCH_PATTERN.exec(branch)
	return match ? Number(match[1]) : undefined
}

export interface LabelChanges {
	add?: PriorityLabel
	remove: string[]
}

/** Plans the priority label changes for one PR; labels outside the priority set are never touched. */
export function planLabelChanges(
	currentLabels: string[],
	priority: number
): LabelChanges {
	const wanted = PRIORITY_LABELS[priority]
	const remove = currentLabels.filter(
		name => PRIORITY_LABEL_NAMES.has(name) && name !== wanted?.name
	)
	const add =
		wanted && !currentLabels.includes(wanted.name) ? wanted : undefined

	return { add, remove }
}
