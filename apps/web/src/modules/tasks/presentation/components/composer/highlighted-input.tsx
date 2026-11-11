import { cn } from '@soonlane/ui/cn'
import { type ComponentProps, type SyntheticEvent, useRef } from 'react'

interface HighlightedInputProps extends ComponentProps<'input'> {
	value: string
	/** Non-overlapping character ranges of `value` to tint, e.g. the typed priority word. */
	highlights: { start: number; end: number }[]
}

function splitByRanges(
	text: string,
	ranges: HighlightedInputProps['highlights']
) {
	const sorted = ranges.toSorted((a, b) => a.start - b.start)

	return [
		...sorted.flatMap((range, index) => [
			text.slice(sorted[index - 1]?.end ?? 0, range.start),
			<span
				className="-mx-0.5 rounded-sm bg-primary/40 px-0.5 py-0.5"
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
	className,
	...props
}: Readonly<HighlightedInputProps>) {
	const layerRef = useRef<HTMLSpanElement>(null)

	function followScroll(event: SyntheticEvent<HTMLInputElement>) {
		layerRef.current?.style.setProperty(
			'transform',
			`translateX(${-event.currentTarget.scrollLeft}px)`
		)
	}

	return (
		<div className="relative flex flex-col">
			<div
				aria-hidden
				className={cn(
					className,
					'pointer-events-none absolute -inset-x-1 inset-y-0 flex items-center overflow-hidden px-1 text-transparent select-none'
				)}
			>
				<span className="whitespace-pre" ref={layerRef}>
					{splitByRanges(value, highlights)}
				</span>
			</div>

			<input
				{...props}
				className={cn('relative', className)}
				onScroll={followScroll}
				onSelect={followScroll}
				value={value}
			/>
		</div>
	)
}
