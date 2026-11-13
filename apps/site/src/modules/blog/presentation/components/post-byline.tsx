import type { Post } from 'content-collections'
import { FormattedDate } from '@/modules/site/presentation/components/formatted-date'

interface PostBylineProps {
	post: Post
}

export function PostByline({ post }: Readonly<PostBylineProps>) {
	return (
		<>
			<FormattedDate date={post.date} />

			{post.updated && (
				<span>
					· Updated <FormattedDate date={post.updated} />
				</span>
			)}

			{!post.published && (
				<span className="rounded-sm border px-1.5 text-caption font-medium text-secondary-foreground">
					Draft
				</span>
			)}
		</>
	)
}
