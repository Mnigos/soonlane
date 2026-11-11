import { findLabelQuery } from '@soonlane/domain'
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- a styled text input as an ARIA combobox; select and datalist cannot show label rows */
import { Popover, PopoverContent } from '@soonlane/ui/components/popover'
import { useQuery } from '@tanstack/react-query'
import {
	type ChangeEvent,
	type ComponentProps,
	type KeyboardEvent,
	type MouseEvent,
	type RefObject,
	type SyntheticEvent,
	useCallback,
	useId,
	useState,
} from 'react'
import { flushSync } from 'react-dom'
import { useCreateLabelMutation } from '@/modules/labels/presentation/hooks/use-create-label-mutation'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { LABEL_ROW_CLASS } from '../../helpers/composer-chip.constants'
import { searchLabels } from '../../helpers/label-search.helper'
import { HighlightedInput } from './highlighted-input'
import { CreateLabelOption, LabelListNotes, LabelOption } from './label-options'

interface TitleFieldProps extends Pick<
	ComponentProps<typeof HighlightedInput>,
	'highlights' | 'className'
> {
	value: string
	onChange: (title: string) => void
	onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
	inputRef: RefObject<HTMLInputElement | null>
	autoFocus: boolean
	/** Called as the "@" suggestions open and close, so Quick Add can grow its window. */
	onSuggestionsToggle?: (isOpen: boolean) => void
}

function getTextRect(input: HTMLInputElement, index: number) {
	const style = getComputedStyle(input)
	const context = document.createElement('canvas').getContext('2d')
	if (context)
		context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
	const width = context?.measureText(input.value.slice(0, index)).width ?? 0
	const box = input.getBoundingClientRect()

	return new DOMRect(
		box.left + width - input.scrollLeft,
		box.top,
		0,
		box.height
	)
}

/** The composer's "Task name" field: typing "@" lists the owner's labels under the word to pick or create one. */
export function TitleField({
	value,
	onChange,
	onKeyDown,
	inputRef,
	autoFocus,
	onSuggestionsToggle,
	...props
}: Readonly<TitleFieldProps>) {
	const listId = useId()
	const [caret, setCaret] = useState(0)
	const [closedAt, setClosedAt] = useState<number>()
	const [activeIndex, setActiveIndex] = useState(0)
	const { data, isError } = useQuery(orpcQuery.labels.list.queryOptions())
	const createLabel = useCreateLabelMutation()
	const labels = data?.labels ?? []
	const typing = findLabelQuery(value, caret)
	const query = typing?.query ?? ''
	const { name, matches, isNewName } = searchLabels(labels, query)
	const count = matches.length + Number(isNewName)
	const isOpen =
		typing !== undefined &&
		typing.start !== closedAt &&
		(data !== undefined || isError) &&
		!/^\s/u.test(query) &&
		(!/\s/u.test(query) ||
			matches.some(label =>
				label.name.toLowerCase().includes(query.toLowerCase())
			))
	const active = Math.min(activeIndex, count - 1)
	// A reset or a removed word can take away the closed "@" without a change event.
	if (closedAt !== undefined && value[closedAt] !== '@') setClosedAt(undefined)
	// Stable, so a re-render (a picked priority) does not pull focus back to the title.
	const attach = useCallback(
		(input: HTMLInputElement | null) => {
			inputRef.current = input
			if (autoFocus) input?.focus()
		},
		[autoFocus, inputRef]
	)
	const toggle = useCallback(() => {
		onSuggestionsToggle?.(true)

		return () => onSuggestionsToggle?.(false)
	}, [onSuggestionsToggle])

	function followCaret(event: SyntheticEvent<HTMLInputElement>) {
		setCaret(event.currentTarget.selectionStart ?? 0)
	}

	function change(event: ChangeEvent<HTMLInputElement>) {
		const nextCaret = event.target.selectionStart ?? 0
		setCaret(nextCaret)
		setActiveIndex(0)
		if (createLabel.isError) createLabel.reset()
		onChange(event.target.value)
	}

	/** Writes "@name " over `word` at `start`, unless more typing changed it while a create was pending. */
	function insert(labelName: string, start: number, word: string) {
		const input = inputRef.current
		if (input?.value.slice(start, start + word.length) !== word) return

		const end = start + labelName.length + 2
		const rest = input.value.slice(start + word.length).replace(/^\s/u, '')
		flushSync(() => {
			onChange(`${input.value.slice(0, start)}@${labelName} ${rest}`)
			setClosedAt(start)
			setCaret(end)
		})
		input.setSelectionRange(end, end)
	}

	function pick(index: number) {
		if (!typing) return

		const word = value.slice(typing.start, caret)
		const label = matches[index]
		if (label) insert(label.name, typing.start, word)
		else if (isNewName && !createLabel.isPending)
			createLabel.mutate(
				{ name },
				{
					onSuccess: ({ label: created }) =>
						insert(created.name, typing.start, word),
				}
			)
	}

	function move(index: number) {
		setActiveIndex(index)
		document
			.querySelector(`#${CSS.escape(`${listId}-${index}`)}`)
			?.scrollIntoView({ block: 'nearest' })
	}

	function navigate(event: KeyboardEvent<HTMLInputElement>) {
		if (!isOpen) return false

		if (event.key === 'ArrowDown' && count > 0) move((active + 1) % count)
		else if (event.key === 'ArrowUp' && count > 0)
			move((active - 1 + count) % count)
		else if (event.key === 'Enter' || (event.key === 'Tab' && count > 0))
			pick(active)
		else if (event.key === 'Escape') {
			event.stopPropagation()
			setClosedAt(typing.start)
		} else return false

		event.preventDefault()
		return true
	}

	function optionProps(index: number) {
		return {
			'aria-selected': index === active,
			className: LABEL_ROW_CLASS,
			'data-highlighted': index === active ? '' : undefined,
			id: `${listId}-${index}`,
			onClick: () => pick(index),
			onMouseDown: (event: MouseEvent) => event.preventDefault(),
			onMouseMove: () => setActiveIndex(index),
			role: 'option',
		}
	}

	return (
		<>
			<HighlightedInput
				{...props}
				aria-activedescendant={
					isOpen && active >= 0 ? `${listId}-${active}` : undefined
				}
				aria-autocomplete="list"
				aria-controls={isOpen ? listId : undefined}
				aria-expanded={isOpen}
				aria-label="Task name"
				maxLength={500}
				onChange={change}
				onKeyDown={event => {
					if (!(event.nativeEvent.isComposing || navigate(event)))
						onKeyDown(event)
				}}
				onSelect={followCaret}
				placeholder="Task name"
				ref={attach}
				role="combobox"
				value={value}
			/>

			<Popover
				onOpenChange={isNextOpen => {
					if (!isNextOpen) setClosedAt(typing?.start)
				}}
				open={isOpen}
			>
				<PopoverContent
					anchor={{
						getBoundingClientRect: () =>
							inputRef.current
								? getTextRect(inputRef.current, typing?.start ?? 0)
								: new DOMRect(),
					}}
					className="w-62"
					finalFocus={false}
					initialFocus={false}
					ref={toggle}
				>
					<div
						aria-label="Labels"
						className="max-h-56 overflow-y-auto py-1 empty:hidden"
						id={listId}
						role="listbox"
					>
						{matches.map((label, index) => (
							<div key={label.id} {...optionProps(index)}>
								<LabelOption label={label} />
							</div>
						))}

						{isNewName && (
							<div
								{...optionProps(matches.length)}
								aria-disabled={createLabel.isPending}
								data-disabled={createLabel.isPending ? '' : undefined}
							>
								<CreateLabelOption name={name} />
							</div>
						)}
					</div>

					<LabelListNotes
						createLabel={createLabel}
						isEmpty={data !== undefined && labels.length === 0 && name === ''}
						isLoadError={isError}
					/>
				</PopoverContent>
			</Popover>
		</>
	)
}
