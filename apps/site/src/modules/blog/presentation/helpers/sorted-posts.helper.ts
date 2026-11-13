import { allPosts } from 'content-collections'

export const sortedPosts = allPosts.toSorted((left, right) =>
	right.date.localeCompare(left.date)
)
