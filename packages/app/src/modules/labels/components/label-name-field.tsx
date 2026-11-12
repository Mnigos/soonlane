import { type AnyORPCError, isDefinedError } from '@orpc/client'
import { LABEL_NAME_MAX_LENGTH, type LabelColor } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import type { UseMutationResult } from '@tanstack/react-query'
import { Tag } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { describeFailure } from '../../shell/helpers/maintenance.helper'
import { LABEL_COLOR_CLASSES } from '../helpers/label-color.constants'

interface LabelNameFieldProps {
	/** The field's accessible name; it may hold the label's current name, so it is rendered as masked text. */
	label: string
	color?: LabelColor
	defaultValue?: string
	mutation: Pick<
		UseMutationResult<unknown, AnyORPCError | Error>,
		'error' | 'isPending' | 'reset'
	>
	/** Starts the save; calls `onSettled` once it succeeds or fails, or right away when nothing is sent. */
	onSave: (name: string, onSettled: () => void) => void
	onCancel: () => void
}

/** The sidebar's inline name field for a new or renamed label: Enter saves, Escape or an empty name cancels. */
export function LabelNameField({
	label,
	color,
	defaultValue = '',
	mutation,
	onSave,
	onCancel,
}: Readonly<LabelNameFieldProps>) {
	const [value, setValue] = useState(defaultValue)
	const labelId = useId()
	// isPending lags a render, so a quick second Enter would save twice.
	const isSavingRef = useRef(false)

	return (
		<form
			className="flex flex-col gap-1"
			onSubmit={event => {
				event.preventDefault()
				if (isSavingRef.current) return
				const name = value.trim()

				if (name === '') {
					onCancel()
					return
				}

				isSavingRef.current = true
				onSave(name, () => {
					isSavingRef.current = false
				})
			}}
		>
			<div className="flex h-8 items-center gap-2 rounded-md border border-border-strong bg-background px-2">
				<Tag
					aria-hidden
					className={cn(
						'size-4 shrink-0',
						LABEL_COLOR_CLASSES[color ?? 'charcoal']
					)}
				/>

				<span className="ph-mask sr-only" id={labelId}>
					{label}
				</span>

				<input
					aria-labelledby={labelId}
					autoFocus
					className="min-w-0 flex-1 bg-transparent text-sm outline-none"
					maxLength={LABEL_NAME_MAX_LENGTH}
					onChange={event => {
						setValue(event.target.value)
						if (mutation.error) mutation.reset()
					}}
					onKeyDown={event => {
						if (event.key === 'Escape') onCancel()
					}}
					readOnly={mutation.isPending}
					value={value}
				/>
			</div>

			{mutation.error && (
				<p className="px-2 text-caption text-danger" role="alert">
					{isDefinedError(mutation.error)
						? mutation.error.message
						: describeFailure(
								mutation.error,
								'Could not save the label. Try again.'
							)}
				</p>
			)}
		</form>
	)
}
