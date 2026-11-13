import type { Task } from '@soonlane/contracts'
import { type DueLabel, formatRepeatRule } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Calendar, Hash, Tag } from 'lucide-react'
import { use } from 'react'
import { LABEL_COLOR_CLASSES } from '../../../labels/helpers/label-color.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { ProjectViewContext } from '../../project-view.context'
import { RepeatIcon } from '../composer/date-picker-icons'

interface TaskMetaProps {
	task: Task
	due: DueLabel | undefined
}

/** The line under a task's title: its due date, whether it repeats, its labels and its project (left out in that project's view). */
export function TaskMeta({ task, due }: Readonly<TaskMetaProps>) {
	const repeatText = task.repeat && formatRepeatRule(task.repeat, 'long')
	const viewProjectId = use(ProjectViewContext)
	const project = task.project?.id === viewProjectId ? undefined : task.project

	if (!due && !repeatText && task.labels.length === 0 && !project) return null

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

							{due.spokenText ? (
								<>
									<span aria-hidden>{due.text}</span>

									<span className="sr-only">{due.spokenText}</span>
								</>
							) : (
								due.text
							)}
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

			{project && (
				<span className="flex items-center gap-0.5 text-muted-foreground">
					<Hash aria-hidden className="size-3" />
					<span className="ph-mask">{project.name}</span>
				</span>
			)}
		</p>
	)
}
