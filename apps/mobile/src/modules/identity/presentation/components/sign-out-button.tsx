import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { useSignOutMutation } from '../hooks/use-sign-out-mutation'

export function SignOutButton() {
	const { mutate, isPending } = useSignOutMutation()

	return (
		<OutlineButton disabled={isPending} onPress={() => mutate()}>
			Sign out
		</OutlineButton>
	)
}
