import type { SVGProps } from 'react'

type IconProps = Readonly<SVGProps<SVGSVGElement>>

const ICON_PROPS = {
	'aria-hidden': true,
	fill: 'none',
	height: 24,
	stroke: 'currentColor',
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	viewBox: '0 0 24 24',
	width: 24,
} as const satisfies SVGProps<SVGSVGElement>

export function TomorrowIcon(props: IconProps) {
	return (
		<svg {...ICON_PROPS} {...props}>
			<circle cx="12" cy="12" r="4.5" />

			<path d="M14.41 6.18l1.26-3.05M17.82 9.59l3.05-1.26M17.82 14.41l3.05 1.26M14.41 17.82l1.26 3.05M9.59 17.82l-1.26 3.05M6.18 14.41l-3.05 1.26M6.18 9.59L3.13 8.33M9.59 6.18L8.33 3.13" />
		</svg>
	)
}

export function NextWeekIcon(props: IconProps) {
	return (
		<svg {...ICON_PROPS} {...props}>
			<rect height="17" rx="2.5" width="17" x="3.5" y="3.5" />

			<path d="M6.5 8h11M8 13.5h8M13.5 11l2.5 2.5-2.5 2.5" />
		</svg>
	)
}

export function WeekendIcon(props: IconProps) {
	return (
		<svg {...ICON_PROPS} {...props}>
			<path d="M5.5 10V7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3M5.5 13.5h13M5.5 13.5v-2a1.5 1.5 0 0 0-3 0V16A1.5 1.5 0 0 0 4 17.5h16a1.5 1.5 0 0 0 1.5-1.5v-4.5a1.5 1.5 0 0 0-3 0v2M6 17.5v1M18 17.5v1" />
		</svg>
	)
}

export function RepeatIcon(props: IconProps) {
	return (
		<svg {...ICON_PROPS} {...props}>
			<path d="M6 5h7.5A4.5 4.5 0 0 1 18 9.5V13M15 10.5l3 3 3-3M18 19h-7.5A4.5 4.5 0 0 1 6 14.5V11M3 13.5l3-3 3 3" />
		</svg>
	)
}
