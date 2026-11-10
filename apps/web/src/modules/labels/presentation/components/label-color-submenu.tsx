import type { Label } from '@soonlane/contracts'
import { LABEL_COLORS, type LabelColor } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	MenuContent,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSubmenu,
	MenuSubmenuTrigger,
} from '@soonlane/ui/components/menu'
import { Palette, Tag } from 'lucide-react'
import {
	LABEL_COLOR_CLASSES,
	LABEL_COLOR_NAMES,
} from '../helpers/label-color.constants'
import { useUpdateLabelColorMutation } from '../hooks/use-update-label-color-mutation'

interface LabelColorSubmenuProps {
	label: Label
}

/** The "Color" row of a sidebar label's menu: Todoist's palette by name, the current color checked (charcoal without one). */
export function LabelColorSubmenu({ label }: Readonly<LabelColorSubmenuProps>) {
	const updateColor = useUpdateLabelColorMutation()
	const currentColor = label.color ?? 'charcoal'

	return (
		<MenuSubmenu>
			<MenuSubmenuTrigger>
				<Palette aria-hidden className="size-4" />
				Color
			</MenuSubmenuTrigger>

			<MenuContent align="start" className="w-40 py-1" side="right">
				<MenuRadioGroup
					onValueChange={(color: LabelColor) => {
						if (color !== currentColor)
							updateColor.mutate({ id: label.id, color })
					}}
					value={currentColor}
				>
					{LABEL_COLORS.map(color => (
						<MenuRadioItem key={color} value={color}>
							<Tag
								aria-hidden
								className={cn('size-4', LABEL_COLOR_CLASSES[color])}
							/>

							{LABEL_COLOR_NAMES[color]}
						</MenuRadioItem>
					))}
				</MenuRadioGroup>
			</MenuContent>
		</MenuSubmenu>
	)
}
