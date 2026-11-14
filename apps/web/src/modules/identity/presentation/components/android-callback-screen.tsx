import {
	ANDROID_CALLBACK_PATH,
	ANDROID_PACKAGE,
	SIGN_IN_CODE_PARAM,
} from '@soonlane/auth'
import { buttonVariants } from '@soonlane/ui/components/button'
import { SignInLayout } from './sign-in-layout'

interface AndroidCallbackScreenProps {
	code?: string
}

/** Where Android left the App Link in the browser; it never spends the code, and its `intent:` link opens only our package (Play when it is missing). */
export function AndroidCallbackScreen({
	code,
}: Readonly<AndroidCallbackScreenProps>) {
	if (!code)
		return (
			<SignInLayout
				description="There is no sign-in to finish here. Open the Soonlane Android app and choose Continue with Google."
				heading="Start from the Android app"
			/>
		)

	return (
		<SignInLayout
			description="Your browser opened this page instead of Soonlane. Open the app to finish signing in."
			heading="Finish signing in"
		>
			<a
				className={buttonVariants({ size: 'lg' })}
				href={`intent://${window.location.host}${ANDROID_CALLBACK_PATH}?${SIGN_IN_CODE_PARAM}=${code}#Intent;scheme=https;package=${ANDROID_PACKAGE};end`}
			>
				Open the Android app
			</a>
		</SignInLayout>
	)
}
