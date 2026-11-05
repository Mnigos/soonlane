import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { propsWithChildrenRule } from './props-with-children.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'tsx' } },
})

ruleTester.run('props-with-children', propsWithChildrenRule, {
	valid: [
		`import type { PropsWithChildren, ReactNode } from 'react'
		interface ViewTemplateProps extends PropsWithChildren {
			title?: string
			className?: string
			headerActions?: ReactNode
			titleClassName?: string
		}
		function ViewTemplate({ children }: Readonly<ViewTemplateProps>) {
			return <section>{children}</section>
		}`,
		`import type { HTMLAttributes, PropsWithChildren } from 'react'
		type ProgressBackgroundProps<TSlotProps extends HTMLAttributes<HTMLDivElement>> =
			Readonly<PropsWithChildren<TSlotProps & { value: number; maxValue: number }>>`,
		"import type { PropsWithChildren } from 'react'; type LayoutProps = PropsWithChildren",
		`export const findSlot = <TProps extends Record<string, unknown>>(
			children: ReactNode,
			type: ComponentType<TProps>,
			additionalChecks?: (child: ReactElement | ReactPortal) => boolean
		) => Children.toArray(children).find(
			child => typeof child === 'object' && 'type' in child &&
				child.type === type && (additionalChecks ? additionalChecks(child) : true)
		)`,
		'function findSlot(children: ReactNode, type: ComponentType) { return Children.toArray(children) }',
		'interface RenderProps { children: (value: number) => ReactNode }',
		'type RenderProps = { children?: () => React.ReactNode }',
		'interface ItemImageProps { children: ReactElement }',
		'type ItemImageProps = { children?: React.ReactElement }',
		'interface P { children: Foo.ReactNode }',
		'interface LayoutProps { children: ReactNode | undefined }',
		'type LayoutProps = { children?: React.ReactNode | undefined }',
		'interface LabelProps { children: string }',
		'type ViewTemplateProps = { headerActions?: ReactNode }',
	],
	invalid: [
		{
			code: `import type { ReactNode } from 'react'
			interface ViewTemplateProps {
				title?: string
				children: ReactNode
				className?: string
				headerActions?: ReactNode
				titleClassName?: string
			}
			function ViewTemplate({ children }: Readonly<ViewTemplateProps>) {
				return <section>{children}</section>
			}`,
			errors: [
				{
					message:
						"Extend PropsWithChildren (import type { PropsWithChildren } from 'react') instead of declaring children: ReactNode (AGENTS.md).",
				},
			],
		},
		{
			code: 'interface ViewTemplateProps { children?: ReactNode; headerActions?: ReactNode }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: `import type { MotionProps } from 'motion/react'
			interface BlurFadeProps extends MotionProps {
				children: React.ReactNode
				className?: string
			}`,
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: 'interface BlurFadeProps extends MotionProps { children?: React.ReactNode; className?: string }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: `import type { HTMLAttributes, ReactNode } from 'react'
			type ProgressBackgroundProps<TSlotProps extends HTMLAttributes<HTMLDivElement>> = Readonly<
				TSlotProps & {
					value: number
					maxValue: number
					color?: \`bg-\${string}\`
					withBackground?: boolean
					children: ReactNode
				}
			>`,
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: 'type ProgressBackgroundProps = { value: number; maxValue: number; children?: ReactNode }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: 'type BlurFadeProps = { children: React.ReactNode; className?: string }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: 'type BlurFadeProps = { children?: React.ReactNode; className?: string }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: 'interface P { children: React . ReactNode }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
		{
			code: 'type P = { children?: React /* comment */ .ReactNode }',
			errors: [{ messageId: 'childrenReactNode' }],
		},
	],
})
