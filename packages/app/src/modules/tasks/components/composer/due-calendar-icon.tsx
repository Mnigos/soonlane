import type { SVGProps } from 'react'

/** Todoist's date chip icon: a calendar page with a filled header and a dot for the day. */
export function DueCalendarIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
	return (
		<svg
			aria-hidden
			fill="none"
			height="16"
			viewBox="0 0 16 16"
			width="16"
			{...props}
		>
			<rect
				height="11"
				rx="1.5"
				stroke="currentColor"
				width="11"
				x="2.5"
				y="2.5"
			/>

			<path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2H2z" fill="currentColor" />

			<rect
				fill="currentColor"
				height="1.5"
				rx="0.5"
				width="1.5"
				x="10"
				y="10"
			/>
		</svg>
	)
}
