import { NativeTabs } from 'expo-router/native-tabs'
import { COLORS } from '@/tokens.gen'

const TABS = [
	{ name: 'index', label: 'Today', icon: 'calendar' },
	{ name: 'upcoming', label: 'Upcoming', icon: 'calendar.day.timeline.left' },
	{ name: 'inbox', label: 'Inbox', icon: 'tray' },
	{ name: 'browse', label: 'Browse', icon: 'square.grid.2x2' },
] as const

export default function TabsLayout() {
	return (
		<NativeTabs tintColor={COLORS.danger}>
			{TABS.map(tab => (
				<NativeTabs.Trigger key={tab.name} name={tab.name}>
					<NativeTabs.Trigger.Icon sf={tab.icon} />

					<NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
			))}
		</NativeTabs>
	)
}
