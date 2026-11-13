import { type Href, Link } from 'expo-router'
import type { PropsWithChildren } from 'react'
import { StyleSheet } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'

interface TextLinkProps extends PropsWithChildren {
	href: Href
}

export function TextLink({ href, children }: Readonly<TextLinkProps>) {
	return (
		<Link href={href} style={styles.link}>
			{children}
		</Link>
	)
}

const styles = StyleSheet.create({
	link: {
		...TEXT.sm,
		marginTop: 12,
		color: COLORS.foreground,
		textDecorationLine: 'underline',
	},
})
