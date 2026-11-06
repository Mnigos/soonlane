import type { Task } from '@soonlane/contracts'
import { GOAL_TARGET_MAX } from '@soonlane/domain'
import { Button, buttonVariants } from '@soonlane/ui/components/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { Diff } from 'lucide-react'
import { type KeyboardEvent, type Ref, useRef, useState } from 'react'
import { useLogProgress } from '../../hooks/use-log-progress'
import { GoalField } from './goal-field'

interface LogProgressControlsProps {
	task: Task
}

interface LogAmountFieldProps {
	onLog: (amount: number) => void
	inputRef: Ref<HTMLInputElement>
}

function LogAmountField({ onLog, inputRef }: Readonly<LogAmountFieldProps>) {
	const [text, setText] = useState('')
	const amount = Number(text)
	const isValid =
		Number.isInteger(amount) &&
		amount !== 0 &&
		Math.abs(amount) <= GOAL_TARGET_MAX

	function logOnEnter(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return

		event.preventDefault()
		if (isValid) onLog(amount)
	}

	return (
		<GoalField
			aria-invalid={text !== '' && !isValid}
			enterKeyHint="done"
			label="Amount"
			onChange={event => setText(event.target.value)}
			onKeyDown={logOnEnter}
			placeholder="10"
			ref={inputRef}
			step={1}
			type="number"
			value={text}
		/>
	)
}

/** "+1" and "Log amount" on the right of a goal's row: on hover or focus, always without hover. */
export function LogProgressControls({
	task,
}: Readonly<LogProgressControlsProps>) {
	const { logProgress } = useLogProgress()
	const [isOpen, setIsOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div className="-my-1 flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-focus-within/task:opacity-100 group-hover/task:opacity-100 has-data-popup-open:opacity-100 [@media(hover:none)]:opacity-100">
			<Button
				aria-label={`Add 1 to ${task.title}`}
				className="h-7 px-2"
				onClick={() => logProgress({ id: task.id, amount: 1 })}
				size="sm"
				variant="ghost"
			>
				+1
			</Button>

			<Popover onOpenChange={setIsOpen} open={isOpen}>
				<PopoverTrigger
					aria-label={`Log amount for ${task.title}`}
					className={buttonVariants({
						variant: 'ghost',
						size: 'icon',
						className: 'size-7 data-popup-open:bg-hover',
					})}
				>
					<Diff aria-hidden strokeWidth={1.5} />
				</PopoverTrigger>

				<PopoverContent
					align="end"
					aria-label="Log amount"
					className="w-44 p-3"
					initialFocus={inputRef}
				>
					<LogAmountField
						inputRef={inputRef}
						onLog={amount => {
							logProgress({ id: task.id, amount })
							setIsOpen(false)
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}
