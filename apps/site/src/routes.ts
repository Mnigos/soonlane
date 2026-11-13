import { index, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	index('modules/site/presentation/routes/home.route.tsx'),
	route(
		'/changelog',
		'modules/changelog/presentation/routes/changelog.route.tsx'
	),
	route('/privacy', 'modules/site/presentation/routes/privacy.route.tsx'),
	route('/terms', 'modules/site/presentation/routes/terms.route.tsx'),
	route('/blog', 'modules/blog/presentation/routes/blog.route.tsx'),
	route('/blog/$slug', 'modules/blog/presentation/routes/post.route.tsx'),
	route('/404', 'modules/site/presentation/routes/not-found.route.tsx'),
	route('/robots[.]txt', 'modules/site/presentation/routes/robots.route.ts'),
	route('/sitemap[.]xml', 'modules/site/presentation/routes/sitemap.route.ts'),
	route('/blog/rss[.]xml', 'modules/blog/presentation/routes/rss.route.ts'),
])
