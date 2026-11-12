import { orpcQuery } from '@soonlane/app/rpc-query'
import { TODOIST_STILL_CONNECTED } from '@soonlane/auth'
import { linkTodoist } from '@soonlane/auth/client'
import { useMutation } from '@tanstack/react-query'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

/** Closes any earlier connection first, so its tokens are revoked and the 15 minutes count from this link; a connection that cannot be closed stops the link. The thrown error's message is the copy to show. */
async function connectTodoist() {
	try {
		await orpcQuery.todoist.cancel.call()
	} catch (error) {
		throw new Error(TODOIST_COPY.cancelFailed, { cause: error })
	}

	const { error } = await linkTodoist()

	if (error)
		throw new Error(
			error.code === TODOIST_STILL_CONNECTED
				? TODOIST_COPY.cancelFailed
				: TODOIST_COPY.linkFailed,
			{ cause: error }
		)
}

/** Leaves for Todoist's consent screen; Todoist sends the browser back to the import page. */
export function useConnectTodoistMutation() {
	return useMutation({ mutationFn: connectTodoist })
}
