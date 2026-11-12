import { PROJECT_NAME_MAX_LENGTH } from '@soonlane/domain'
import { Hash } from 'lucide-react'
import type { SidebarNameFieldOptions } from '../../shell/components/sidebar-name-field'

export const PROJECT_NAME_FIELD = {
	icon: Hash,
	iconClassName: 'text-muted-foreground',
	maxLength: PROJECT_NAME_MAX_LENGTH,
	saveError: 'Could not save the project. Try again.',
} satisfies SidebarNameFieldOptions
