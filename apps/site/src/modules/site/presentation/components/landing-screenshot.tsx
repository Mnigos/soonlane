import { cn } from '@soonlane/ui/cn'
import type { LandingImage } from '../landing.constants'

const PRIORITY_IMAGE = { fetchPriority: 'high' } as const
const DEFERRED_IMAGE = { loading: 'lazy', decoding: 'async' } as const

interface LandingScreenshotProps {
	image: LandingImage
	isPriority?: boolean
	className?: string
}

export function LandingScreenshot({
	image,
	isPriority = false,
	className,
}: Readonly<LandingScreenshotProps>) {
	return (
		<img
			alt={image.alt}
			className={cn('h-auto w-full rounded-lg border', className)}
			height={image.height}
			src={image.src}
			width={image.width}
			{...(isPriority ? PRIORITY_IMAGE : DEFERRED_IMAGE)}
		/>
	)
}
