import { isDefinedError } from '@orpc/client'
import type { LinearPin, Task } from '@soonlane/contracts'
import { LINEAR_PINS_PER_TASK_MAX } from '@soonlane/domain'
import {
	Combobox,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@soonlane/ui/components/combobox'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { type Ref, useState } from 'react'
import { useHostApp } from '../../../hooks/use-host-app'
import { orpcQuery } from '../../../rpc-query.client'
import { PickerCheckbox } from '../../tasks/components/composer/picker-options'
import {
	LABEL_ROW_CLASS,
	PICKER_FIELD_CLASS,
	PICKER_FIELD_ROW_CLASS,
	PICKER_NOTE_CLASS,
} from '../../tasks/helpers/composer-chip.constants'
import { useDebouncedValue } from '../../tasks/hooks/use-debounced-value'
import { LINEAR_COPY } from '../helpers/linear-copy.constants'
import type { useLinearPinMutations } from '../hooks/use-linear-pin-mutations'
import { LinearStatusIcon } from './linear-status-icon'

const LINEAR_URL = 'https://linear.app'
const SEARCH_DELAY_MS = 250
const SECTION_COPY = {
	assigned: LINEAR_COPY.sectionAssigned,
	search: LINEAR_COPY.sectionResults,
	link: LINEAR_COPY.sectionFromLink,
	otherLink: undefined,
}

interface LinearIssuePickerProps {
	task: Task
	mutations: ReturnType<typeof useLinearPinMutations>
	inputRef: Ref<HTMLInputElement>
}

/** The Linear chip's popover: the user's assigned issues, or what the field searches or links, each ticked to pin it and unticked to unpin it at once. */
export function LinearIssuePicker({
	task,
	mutations,
	inputRef,
}: Readonly<LinearIssuePickerProps>) {
	const [query, setQuery] = useState('')
	const [isAtLimit, setIsAtLimit] = useState(false)
	const { linearConnectHref } = useHostApp()
	const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DELAY_MS)
	const { data, isError } = useQuery(
		orpcQuery.linear.searchIssues.queryOptions({
			input: { query: debouncedQuery },
			placeholderData: keepPreviousData,
		})
	)
	const { pin, unpin } = mutations
	const isLimitError =
		isAtLimit || (isDefinedError(pin.error) && pin.error.code === 'CONFLICT')

	if (data && data.state !== 'connected')
		return (
			<div className="px-4 pt-4.5 pb-4">
				<p className="text-label text-secondary-foreground">
					{LINEAR_COPY.connectPrompt}
				</p>

				<p className="mt-1 text-caption text-faint-foreground">
					{LINEAR_COPY.connectHint}
				</p>

				<a
					className="mt-3.5 inline-flex h-8 items-center rounded-md bg-primary px-3 text-label font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
					href={linearConnectHref}
				>
					{data.state === 'lapsed'
						? LINEAR_COPY.reconnect
						: LINEAR_COPY.connectButton}
				</a>
			</div>
		)

	const issues = data?.issues ?? []
	const section = data && SECTION_COPY[data.match]

	return (
		<Combobox
			autoHighlight
			filter={null}
			inline
			inputValue={query}
			isItemEqualToValue={(item, picked) => item.issueId === picked.issueId}
			itemToStringLabel={issue => issue.identifier}
			items={issues}
			multiple
			onInputValueChange={setQuery}
			onValueChange={(nextPins: LinearPin[]) => {
				const added = nextPins.find(
					next =>
						!task.linearPins.some(({ issueId }) => issueId === next.issueId)
				)
				const removed = task.linearPins.find(
					pinned => !nextPins.some(({ issueId }) => issueId === pinned.issueId)
				)

				setIsAtLimit(
					added !== undefined &&
						task.linearPins.length >= LINEAR_PINS_PER_TASK_MAX
				)
				pin.reset()
				if (removed) unpin.mutate({ id: task.id, issueId: removed.issueId })
				if (added && task.linearPins.length < LINEAR_PINS_PER_TASK_MAX)
					pin.mutate({ id: task.id, issueId: added.issueId })
			}}
			open
			value={task.linearPins}
		>
			<div className={PICKER_FIELD_ROW_CLASS}>
				<ComboboxInput
					aria-label={LINEAR_COPY.searchPlaceholder}
					className={PICKER_FIELD_CLASS}
					placeholder={LINEAR_COPY.searchPlaceholder}
					ref={inputRef}
				/>
			</div>

			{section && issues.length > 0 && (
				<p className="px-3 pt-2.5 pb-1 text-caption font-semibold text-secondary-foreground">
					{section}
				</p>
			)}

			<ComboboxList className="max-h-72 overflow-y-auto pb-1 empty:hidden">
				{(issue: (typeof issues)[number]) => (
					<ComboboxItem
						className={LABEL_ROW_CLASS}
						key={issue.issueId}
						value={issue}
					>
						<LinearStatusIcon state={issue.state} />

						<span className="min-w-17 shrink-0 text-secondary-foreground tabular-nums">
							{issue.identifier}
						</span>

						<span className="ph-mask truncate">{issue.title}</span>

						<PickerCheckbox />
					</ComboboxItem>
				)}
			</ComboboxList>

			{data?.match === 'otherLink' && (
				<p className={PICKER_NOTE_CLASS}>{LINEAR_COPY.notAnIssueLink}</p>
			)}

			{data && data.match !== 'otherLink' && issues.length === 0 && (
				<p className={PICKER_NOTE_CLASS}>{LINEAR_COPY.noResults}</p>
			)}

			{isError && <p className={PICKER_NOTE_CLASS}>{LINEAR_COPY.loadFailed}</p>}

			{(isLimitError || pin.isError) && (
				<p className="px-3 py-2 text-caption text-danger" role="alert">
					{isLimitError ? LINEAR_COPY.limitReached : LINEAR_COPY.pinFailed}
				</p>
			)}

			<div className="mt-1.5 flex items-center justify-between border-t px-3 py-2 text-caption text-faint-foreground">
				<span>
					{LINEAR_COPY.pinnedCount.replace(
						'{count}',
						String(task.linearPins.length)
					)}
				</span>

				<a
					className="flex items-center gap-1 text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
					href={LINEAR_URL}
					rel="noreferrer"
					target="_blank"
				>
					{LINEAR_COPY.openLinear}
					<ExternalLink aria-hidden className="size-3" />
				</a>
			</div>
		</Combobox>
	)
}
