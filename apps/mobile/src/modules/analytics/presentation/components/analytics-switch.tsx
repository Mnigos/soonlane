import { useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import {
	applyConsent,
	readAnalyticsConsent,
} from '../../infrastructure/analytics.client'
import { ANALYTICS_COPY } from '../analytics-copy.constants'

/** The Settings row that changes the answer the first prompt stored; off until the user grants. */
export function AnalyticsSwitch() {
	const [isGranted, setIsGranted] = useState(
		() => readAnalyticsConsent() === 'granted'
	)

	function onChange(value: boolean) {
		applyConsent(value ? 'granted' : 'denied', 'settings')
		setIsGranted(value)
	}

	return (
		<View style={styles.row}>
			<View style={styles.text}>
				<Text style={styles.label}>{ANALYTICS_COPY.switchLabel}</Text>

				<Text style={styles.description}>
					{ANALYTICS_COPY.switchDescription}
				</Text>
			</View>

			<Switch
				accessibilityHint={ANALYTICS_COPY.switchDescription}
				accessibilityLabel={ANALYTICS_COPY.switchLabel}
				onValueChange={onChange}
				trackColor={{ true: COLORS.primary, false: COLORS.control }}
				value={isGranted}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
	text: { flex: 1, gap: 2 },
	label: { ...TEXT.base, fontWeight: '600', color: COLORS.foreground },
	description: { ...TEXT.sm, color: COLORS.mutedForeground },
})
