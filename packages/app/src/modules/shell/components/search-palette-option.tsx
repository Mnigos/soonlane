import { type CalendarDate, getDueChipLabel } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { CalendarDays, CalendarFold, Inbox, Search } from 'lucide-react'
import { PROJECT_NAME_FIELD } from '../../projects/helpers/project-sidebar.constants'
import { LabelOption } from '../../tasks/components/composer/label-options'
import { TaskMeta } from '../../tasks/components/task/task-meta'
import { CHIP_ICON_STROKE } from '../../tasks/helpers/composer-chip.constants'
import { PRIORITY_CIRCLE_CLASSES } from '../../tasks/helpers/task-priority.constants'
import type { PaletteItem } from '../search-palette.types'
import { ShortcutKeys } from './shortcut-keys'

interface SearchPaletteOptionProps {
	item: PaletteItem
	today: CalendarDate
}

const VIEW_ICONS = { inbox: Inbox, upcoming: CalendarDays, today: CalendarFold }
const ProjectIcon = PROJECT_NAME_FIELD.icon

/** A palette row's content: a view with its keys, a project, a label, a task with its due date and labels, or "Show all results". */
export function SearchPaletteOption({
	item,
	today,
}: Readonly<SearchPaletteOptionProps>) {
	if (item.kind === 'project')
		return (
			<>
				<ProjectIcon
					aria-hidden
					className={cn('size-4 shrink-0', PROJECT_NAME_FIELD.iconClassName)}
					strokeWidth={CHIP_ICON_STROKE}
				/>

				<span className="ph-mask truncate">{item.project.name}</span>
			</>
		)

	if (item.kind === 'label') return <LabelOption label={item.label} />

	if (item.kind === 'task')
		return (
			<>
				<span
					className={cn(
						'mt-0.5 size-4 shrink-0 rounded-full border-2',
						PRIORITY_CIRCLE_CLASSES[item.task.priority]
					)}
				/>

				<div className="flex min-w-0 flex-col gap-0.5">
					<span className="ph-mask truncate text-sm">{item.task.title}</span>

					<TaskMeta
						due={
							item.task.dueDate &&
							getDueChipLabel(item.task.dueDate, item.task.dueTime, today)
						}
						task={item.task}
					/>
				</div>
			</>
		)

	if (item.kind === 'all')
		return (
			<>
				<Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
				Show all results
			</>
		)

	const Icon = VIEW_ICONS[item.view.view]

	return (
		<>
			<Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />

			{item.view.name}

			<span className="ml-auto">
				<ShortcutKeys joiner="then" keys={item.view.keys} />
			</span>
		</>
	)
}
