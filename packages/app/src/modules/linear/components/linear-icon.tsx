interface LinearIconProps {
	className?: string
}

/** A Linear issue: the composer chip's and the task row badge's icon, drawn in 1px lines like the other chip icons. */
export function LinearIcon({ className }: Readonly<LinearIconProps>) {
	return (
		<svg
			aria-hidden
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth={1.2}
			viewBox="0 0 16 16"
		>
			<circle cx={8} cy={8} r={5.6} />

			<path d="M4.6 9.6l4.8-4.8M6.4 11.4l5-5" />
		</svg>
	)
}
