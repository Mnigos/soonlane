import { Button } from '@soonlane/ui/components/button'
import { ALLOW_PAGE_CLASS } from '../allow-page.constants'

interface AllowNoticeProps {
	message: string
	actionLabel?: string
	isActionDisabled?: boolean
	onAction?: () => void
}

/** The Allow page when it offers no choice: why, and the one thing the user can do about it, if any. */
export function AllowNotice({
	message,
	actionLabel,
	isActionDisabled = false,
	onAction,
}: Readonly<AllowNoticeProps>) {
	return (
		<main className={ALLOW_PAGE_CLASS}>
			<p className="text-sm font-medium" role="alert">
				{message}
			</p>

			{actionLabel && onAction && (
				<Button
					className="self-start"
					disabled={isActionDisabled}
					onClick={onAction}
					size="sm"
					variant="outline"
				>
					{actionLabel}
				</Button>
			)}
		</main>
	)
}
