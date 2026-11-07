import { cn } from '../utils/cn.util'

const AVATAR_SIZE_PX = 26

interface AvatarProps {
	name: string
	src?: string
	className?: string
}

export function Avatar({ name, src, className }: Readonly<AvatarProps>) {
	if (src)
		return (
			<img
				alt=""
				className={cn('size-6.5 shrink-0 rounded-full', className)}
				height={AVATAR_SIZE_PX}
				referrerPolicy="no-referrer"
				src={src}
				width={AVATAR_SIZE_PX}
			/>
		)

	return (
		<span
			aria-hidden
			className={cn(
				'flex size-6.5 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground',
				className
			)}
		>
			{name.trim().charAt(0).toUpperCase() || '?'}
		</span>
	)
}
