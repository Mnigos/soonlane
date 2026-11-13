import { MDXContent } from '@content-collections/mdx/react'
import type { ComponentProps, ReactNode } from 'react'

const PROSE_COMPONENTS = {
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
	ol: (props: ComponentProps<'ol'>) => (
		<ol className="flex list-decimal flex-col gap-2 pl-5" {...props} />
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
	pre: (props: ComponentProps<'pre'>) => (
		<pre
			className="overflow-x-auto rounded-md bg-card p-4 text-label [&>code]:bg-transparent [&>code]:p-0"
			{...props}
		/>
	),
	blockquote: (props: ComponentProps<'blockquote'>) => (
		<blockquote
			className="flex flex-col gap-4 border-l-2 pl-4 text-muted-foreground"
			{...props}
		/>
	),
	hr: (props: ComponentProps<'hr'>) => <hr className="my-2" {...props} />,
}

interface ProsePageProps {
	title: string
	byline: ReactNode
	mdx: string
}

export function ProsePage({ title, byline, mdx }: Readonly<ProsePageProps>) {
	return (
		<main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-12 sm:px-6 sm:py-16">
			{/* An <img> written as JSX in MDX skips the components map. */}
			<article className="flex flex-col gap-4 leading-relaxed text-secondary-foreground [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md">
				<header className="flex flex-col gap-1.5">
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						{title}
					</h1>

					<p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
						{byline}
					</p>
				</header>

				<MDXContent code={mdx} components={PROSE_COMPONENTS} />
			</article>
		</main>
	)
}
