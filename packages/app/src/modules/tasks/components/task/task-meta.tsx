import type { Task } from '@soonlane/contracts'
import { type DueLabel, formatRepeatRule } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Calendar, Tag } from 'lucide-react'
import { LABEL_COLOR_CLASSES } from '../../../labels/helpers/label-color.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { RepeatIcon } from '../composer/date-picker-icons'

interface TaskMetaProps {
	task: Task
	due: DueLabel | undefined
}

/** The line under a task's title: its due date, whether it repeats, and its labels. */
export function TaskMeta({ task, due }: Readonly<TaskMetaProps>) {
	const repeatText = task.repeat && formatRepeatRule(task.repeat, 'long')

	if (!due && !repeatText && task.labels.length === 0) return null

	return (
		<p className="flex flex-wrap items-center gap-x-2 text-caption">
			{(due || repeatText) && (
				<span
					className={cn(
						'flex items-center gap-1',
						due ? DUE_TONE_CLASSES[due.tone] : 'text-muted-foreground'
					)}
				>
					{due && (
						<>
							<Calendar aria-hidden className="size-3" />

							{due.text}
						</>
					)}

					{repeatText && (
						<>
							<RepeatIcon className="size-3" />

							<span className="sr-only">Repeats: {repeatText}</span>
						</>
					)}
				</span>
			)}

			{task.labels.map(label => (
				<span
					className={cn(
						'flex items-center gap-0.5',
						LABEL_COLOR_CLASSES[label.color ?? 'charcoal']
					)}
					key={label.id}
				>
					<Tag aria-hidden className="size-3" />
					<span className="ph-mask">{label.name}</span>
				</span>
			))}
		</p>
	)
}
