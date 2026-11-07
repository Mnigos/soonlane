import type { SVGProps } from 'react'

interface PriorityFlagIconProps extends SVGProps<SVGSVGElement> {
	isFilled?: boolean
}

/** Todoist's priority flag: a short pole and a waving cloth, filled for P1 to P3. */
export function PriorityFlagIcon({
	isFilled = false,
	...props
}: Readonly<PriorityFlagIconProps>) {
	return (
		<svg
			aria-hidden
			fill="none"
			height="16"
			stroke="currentColor"
			strokeLinejoin="round"
			viewBox="0 0 16 16"
			width="16"
			{...props}
		>
			<path d="M2.5 14.5V3" strokeLinecap="round" />

			<path
				d="M2.5 3c1.8-.9 3.7-.9 5.5 0s3.7.9 5.5 0v7c-1.8.9-3.7.9-5.5 0s-3.7-.9-5.5 0z"
				fill={isFilled ? 'currentColor' : 'none'}
			/>
		</svg>
	)
}
