import { type AnyORPCError, isDefinedError } from '@orpc/client'
import { LABEL_NAME_MAX_LENGTH, type LabelColor } from '@soonlane/domain'
import type { UseMutationResult } from '@tanstack/react-query'
import { Tag } from 'lucide-react'
import { useState } from 'react'
import { getLabelColor } from '../helpers/label-color.helper'

interface LabelNameFieldProps {
	label: string
	color?: LabelColor
	defaultValue?: string
	mutation: Pick<
		UseMutationResult<unknown, AnyORPCError | Error>,
		'error' | 'isPending' | 'reset'
	>
	onSave: (name: string) => void
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

	return (
		<form
			className="flex flex-col gap-1"
			onSubmit={event => {
				event.preventDefault()
				const name = value.trim()

				if (name === '') onCancel()
				else onSave(name)
			}}
		>
			<div className="flex h-8 items-center gap-2 rounded-md border border-border-strong bg-background px-2">
				<Tag
					aria-hidden
					className="size-4 shrink-0"
					style={{ color: getLabelColor(color) }}
				/>

				<input
					aria-label={label}
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
						: 'Could not save the label. Try again.'}
				</p>
			)}
		</form>
	)
}
