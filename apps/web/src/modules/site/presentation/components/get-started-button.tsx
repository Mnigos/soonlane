import { signInWithGoogle } from '@soonlane/auth/client'
import { buttonVariants } from '@soonlane/ui/components/button'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { TermsAgreement } from './terms-agreement'

const SIGN_UP_REDIRECTS = { callbackURL: '/app', errorCallbackURL: '/login' }

interface GetStartedButtonProps {
	compact?: boolean
}

export function GetStartedButton({
	compact = false,
}: Readonly<GetStartedButtonProps>) {
	const navigate = useNavigate()
	const { mutate, reset, isPending, isSuccess } = useMutation(
		mutationOptions({
			mutationFn: async () => {
				const { error } = await signInWithGoogle(SIGN_UP_REDIRECTS)

				if (error) throw new Error(error.message)
			},
			// /login explains a failed or disabled sign-in.
			onError: async () => await navigate({ to: '/login' }),
		})
	)
	const isRedirecting = isPending || isSuccess

	const button = (
		<Link
			aria-disabled={isRedirecting}
			className={buttonVariants({ size: compact ? 'sm' : 'lg' })}
			onClick={event => {
				const opensElsewhere =
					event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
				// Google refuses the desktop app's webview; /login hands the sign-in to the system browser.
				const isDesktopShell =
					document.documentElement.dataset.shell === 'desktop'

				if (opensElsewhere || isDesktopShell) return

				event.preventDefault()

				if (isRedirecting) return

				// Back from Google restores this page from the bfcache with the mutation still redirecting.
				window.addEventListener(
					'pageshow',
					pageShow => {
						if (pageShow.persisted) reset()
					},
					{ once: true }
				)
				mutate()
			}}
			to="/login"
		>
			{isRedirecting ? 'Redirecting…' : 'Get started'}
		</Link>
	)

	if (compact) return button

	return (
		<div className="flex flex-col items-start gap-3">
			{button}

			<TermsAgreement />
		</div>
	)
}
