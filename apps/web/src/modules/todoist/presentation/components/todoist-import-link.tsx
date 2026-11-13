import { isDesktopShell } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { TODOIST_IMPORT_PATH } from '@soonlane/auth'
import { Link } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
import { toast } from 'sonner'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

interface TodoistImportLinkProps extends PropsWithChildren {
	className: string
}

/**
 * The desktop app opens the import in the system browser, which holds the OAuth state cookie and the session; the
 * window keeps its page.
 */
export function TodoistImportLink({
	className,
	children,
}: Readonly<TodoistImportLinkProps>) {
	const isDesktop = isDesktopShell()

	return (
		<Link
			className={className}
			onClick={() => {
				if (isDesktop) toast(TODOIST_COPY.desktopOpenedInBrowser)
			}}
			target={isDesktop ? '_blank' : undefined}
			to={TODOIST_IMPORT_PATH}
		>
			{children}
		</Link>
	)
}
