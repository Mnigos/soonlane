import { cn } from '@soonlane/ui/cn'
import type { HomeImage } from '../home.constants'

const PRIORITY_IMAGE = { fetchPriority: 'high' } as const
const DEFERRED_IMAGE = { loading: 'lazy', decoding: 'async' } as const

interface HomeScreenshotProps {
	image: HomeImage
	isPriority?: boolean
	className?: string
}

export function HomeScreenshot({
	image,
	isPriority = false,
	className,
}: Readonly<HomeScreenshotProps>) {
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
