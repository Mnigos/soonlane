import { ActionSheetIOS, Platform } from 'react-native'

/** What `ActionSheetIOS` takes and what the Android sheet draws: the last option is Cancel. */
export interface ActionSheetOptions {
	title: string
	options: string[]
}

interface ShownSheet extends ActionSheetOptions {
	onSelect: (index: number) => void
}

const listeners = new Set<() => void>()

let shownSheet: ShownSheet | undefined

/** The iOS action sheet, or on Android the root layout's `ActionSheet`, which React Native lacks; `onSelect` gets the picked index, Cancel's included. */
export function showActionSheet(
	sheet: ActionSheetOptions,
	onSelect: (index: number) => void
) {
	if (Platform.OS === 'ios') {
		ActionSheetIOS.showActionSheetWithOptions(
			{
				...sheet,
				cancelButtonIndex: sheet.options.length - 1,
				userInterfaceStyle: 'dark',
			},
			onSelect
		)

		return
	}

	shownSheet = { ...sheet, onSelect }
	for (const listener of listeners) listener()
}

/** Closes the Android sheet and reports the pick; Cancel and the back button pick the last option. */
export function selectInSheet(index: number) {
	const sheet = shownSheet

	shownSheet = undefined
	for (const listener of listeners) listener()
	sheet?.onSelect(index)
}

export function subscribeToSheet(onChange: () => void) {
	listeners.add(onChange)

	return () => {
		listeners.delete(onChange)
	}
}

export function getShownSheet() {
	return shownSheet
}
