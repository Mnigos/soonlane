import { MDXContent } from '@content-collections/mdx/react'
import type { Legal } from 'content-collections'
import type { ComponentProps } from 'react'

const UPDATED_FORMAT = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
})

const MDX_COMPONENTS = {
	h2: ({ children, ...props }: ComponentProps<'h2'>) => (
		<h2 className="mt-6 text-lg font-semibold text-foreground" {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }: ComponentProps<'h3'>) => (
		<h3 className="mt-2 text-base font-semibold text-foreground" {...props}>
			{children}
		</h3>
	),
	ul: (props: ComponentProps<'ul'>) => (
		<ul className="flex list-disc flex-col gap-2 pl-5" {...props} />
	),
	a: ({ children, ...props }: ComponentProps<'a'>) => (
		<a
			className="rounded-sm text-foreground underline underline-offset-4"
			{...props}
		>
			{children}
		</a>
	),
	strong: (props: ComponentProps<'strong'>) => (
		<strong className="font-semibold text-foreground" {...props} />
	),
	code: (props: ComponentProps<'code'>) => (
		<code className="rounded-sm bg-hover px-1 py-0.5 text-label" {...props} />
	),
}

interface LegalPageProps {
	legal: Legal
}

export function LegalPage({ legal }: Readonly<LegalPageProps>) {
	return (
		<main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-12 sm:px-6 sm:py-16">
			<article className="flex flex-col gap-4 leading-relaxed text-secondary-foreground">
				<header className="flex flex-col gap-1.5">
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						{legal.title}
					</h1>

					<p className="text-sm text-muted-foreground">
						Last updated{' '}
						<time dateTime={legal.updated}>
							{UPDATED_FORMAT.format(new Date(legal.updated))}
						</time>
					</p>
				</header>

				<MDXContent code={legal.mdx} components={MDX_COMPONENTS} />
			</article>
		</main>
	)
}
