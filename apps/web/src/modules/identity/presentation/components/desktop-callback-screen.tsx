import { Button, buttonVariants } from '@soonlane/ui/components/button'
import { Link } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { SignInLayout } from './sign-in-layout'

interface DesktopCallbackScreenProps {
	failed: boolean
}

export function DesktopCallbackScreen({
	failed,
}: Readonly<DesktopCallbackScreenProps>) {
	if (!failed)
		return (
			<SignInLayout>
				<Button disabled size="lg" variant="outline">
					<LoaderCircle
						aria-hidden
						className="animate-spin motion-reduce:animate-none"
					/>
					Signing in…
				</Button>
			</SignInLayout>
		)

	return (
		<SignInLayout>
			<div className="flex flex-col gap-1 text-sm" role="alert">
				<p className="font-semibold">Sign-in did not finish</p>

				<p className="text-muted-foreground">
					The sign-in link expired or was already used. Start again from the
					sign-in screen.
				</p>
			</div>

			<Link
				className={buttonVariants({
					variant: 'outline',
					className: 'self-start',
				})}
				replace
				to="/login"
			>
				Back to sign-in
			</Link>
		</SignInLayout>
	)
}
