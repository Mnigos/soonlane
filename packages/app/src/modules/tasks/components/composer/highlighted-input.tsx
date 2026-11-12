import { cn } from '@soonlane/ui/cn'
import {
	type ComponentProps,
	type KeyboardEvent,
	type MouseEvent,
	type SyntheticEvent,
	useRef,
} from 'react'

interface TextRange {
	start: number
	end: number
}

interface HighlightedInputProps extends ComponentProps<'input'> {
	value: string
	/** Non-overlapping character ranges of `value` to tint, e.g. the typed priority word. */
	highlights: TextRange[]
	/** One of `highlights` that Backspace right after it or a click on it turns off. */
	dismissible?: TextRange
	onDismiss?: () => void
}

function splitByRanges(
	text: string,
	ranges: TextRange[],
	dismissible?: TextRange
) {
	const sorted = ranges.toSorted((a, b) => a.start - b.start)

	return [
		...sorted.flatMap((range, index) => [
			text.slice(sorted[index - 1]?.end ?? 0, range.start),
			<span
				className="-mx-0.5 rounded-sm bg-primary/40 px-0.5 py-0.5"
				data-dismissible={range.start === dismissible?.start ? '' : undefined}
				key={range.start}
			>
				{text.slice(range.start, range.end)}
			</span>,
		]),
		text.slice(sorted.at(-1)?.end ?? 0),
	]
}

/**
 * A native text input with a tint behind some of its words, like Todoist's
 * task name. The tint is a copy of the text in transparent ink under the
 * input, so caret, selection and IME stay the input's own.
 */
export function HighlightedInput({
	value,
	highlights,
	dismissible,
	onDismiss,
	className,
	onSelect,
	onKeyDown,
	onClick,
	...props
}: Readonly<HighlightedInputProps>) {
	const layerRef = useRef<HTMLSpanElement>(null)

	function followScroll(event: SyntheticEvent<HTMLInputElement>) {
		layerRef.current?.style.setProperty(
			'transform',
			`translateX(${-event.currentTarget.scrollLeft}px)`
		)
	}

	function dismissOnBackspace(event: KeyboardEvent<HTMLInputElement>) {
		const { selectionStart, selectionEnd } = event.currentTarget
		const isDismissal =
			event.key === 'Backspace' &&
			!(event.altKey || event.ctrlKey || event.metaKey) &&
			!event.nativeEvent.isComposing &&
			selectionStart === selectionEnd &&
			selectionEnd === dismissible?.end
		if (!isDismissal) {
			onKeyDown?.(event)
			return
		}

		event.preventDefault()
		onDismiss?.()
	}

	function dismissOnClick(event: MouseEvent<HTMLInputElement>) {
		onClick?.(event)
		const box = layerRef.current
			?.querySelector('[data-dismissible]')
			?.getBoundingClientRect()
		const { selectionStart, selectionEnd } = event.currentTarget
		if (
			box &&
			selectionStart === selectionEnd &&
			event.clientX >= box.left &&
			event.clientX <= box.right
		)
			onDismiss?.()
	}

	return (
		<div className="relative flex flex-col">
			<div
				aria-hidden
				className={cn(
					className,
					'ph-mask pointer-events-none absolute -inset-x-1 inset-y-0 flex items-center overflow-hidden px-1 text-transparent select-none'
				)}
			>
				<span className="whitespace-pre" ref={layerRef}>
					{splitByRanges(value, highlights, dismissible)}
				</span>
			</div>

			<input
				{...props}
				className={cn('relative', className)}
				onClick={dismissOnClick}
				onKeyDown={dismissOnBackspace}
				onScroll={followScroll}
				onSelect={event => {
					followScroll(event)
					onSelect?.(event)
				}}
				value={value}
			/>
		</div>
	)
}
