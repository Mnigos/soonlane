import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import type { JSX } from 'react'

/** Base UI's root; its types leave out `autoHighlight="always"` (highlight the first item on open), which it supports. */
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- widens one prop to the values Base UI 1.9 handles at runtime
export const Combobox = BaseCombobox.Root as <
	TValue,
	TMultiple extends boolean | undefined = false,
>(
	props: Omit<BaseCombobox.Root.Props<TValue, TMultiple>, 'autoHighlight'> & {
		autoHighlight?: boolean | 'always'
	}
) => JSX.Element
export const ComboboxInput = BaseCombobox.Input
export const ComboboxList = BaseCombobox.List
export const ComboboxItem = BaseCombobox.Item
export const ComboboxGroup = BaseCombobox.Group
export const ComboboxGroupLabel = BaseCombobox.GroupLabel
export const ComboboxCollection = BaseCombobox.Collection
