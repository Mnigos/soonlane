import { LABEL_NAME_MAX_LENGTH } from '@soonlane/domain'
import { Tag } from 'lucide-react'
import type { SidebarNameFieldOptions } from '../../shell/components/sidebar-name-field'
import { LABEL_COLOR_CLASSES } from './label-color.constants'

export const LABEL_NAME_FIELD = {
	icon: Tag,
	iconClassName: LABEL_COLOR_CLASSES.charcoal,
	maxLength: LABEL_NAME_MAX_LENGTH,
	saveError: 'Could not save the label. Try again.',
} satisfies SidebarNameFieldOptions
