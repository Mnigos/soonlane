import { ALLOW_COPY } from '../allow-copy.constants'
import {
	type McpAccess,
	toggleAccess,
} from '../helpers/mcp-client-request.helper'

const LABELS = {
	read: ALLOW_COPY.readCheckbox,
	write: ALLOW_COPY.writeCheckbox,
} satisfies Record<McpAccess, string>

interface AccessCheckboxesProps {
	requested: McpAccess[]
	ticked: McpAccess[]
	isDisabled: boolean
	onChange: (ticked: McpAccess[]) => void
}

/** One checkbox per task access the agent asked for; unticking only narrows what it gets, and edit comes with see, which the label names when see was not asked for. */
export function AccessCheckboxes({
	requested,
	ticked,
	isDisabled,
	onChange,
}: Readonly<AccessCheckboxesProps>) {
	return (
		<fieldset className="flex flex-col gap-3">
			{requested.map(item => (
				<label className="flex cursor-pointer items-start gap-3" key={item}>
					<input
						checked={ticked.includes(item)}
						className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						disabled={isDisabled}
						onChange={() => onChange(toggleAccess(ticked, item))}
						type="checkbox"
					/>

					<span className="flex flex-col gap-0.5 text-sm">
						{item === 'write' && !requested.includes('read')
							? ALLOW_COPY.writeAloneCheckbox
							: LABELS[item]}

						{item === 'write' && (
							<span className="text-caption text-muted-foreground">
								{ALLOW_COPY.writeHelper}
							</span>
						)}
					</span>
				</label>
			))}
		</fieldset>
	)
}
