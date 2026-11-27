import { cn } from '@soonlane/ui/cn'
import { splitDescriptionLinks } from '../../helpers/description-link.helper'

interface TaskDescriptionProps {
	description: string
	className?: string
}

/** A task's description with its line breaks kept and its web addresses as links that open outside the app; links sit above a row's click area. */
export function TaskDescription({
	description,
	className,
}: Readonly<TaskDescriptionProps>) {
	return (
		<p
			className={cn(
				'ph-mask text-sm leading-6 break-words whitespace-pre-wrap text-secondary-foreground',
				className
			)}
		>
			{splitDescriptionLinks(description).map((part, index) =>
				part.href ? (
					<a
						className="relative z-10 text-primary underline underline-offset-2 hover:text-primary-hover"
						href={part.href}
						// oxlint-disable-next-line react/no-array-index-key -- the parts never reorder
						key={index}
						rel="noreferrer"
						target="_blank"
					>
						{part.text}
					</a>
				) : (
					part.text
				)
			)}
		</p>
	)
}
