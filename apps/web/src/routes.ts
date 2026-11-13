import { index, layout, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	layout('site', 'modules/site/presentation/routes/site.route.tsx', [
		index('modules/site/presentation/routes/home.route.tsx'),
		route(
			'/changelog',
			'modules/changelog/presentation/routes/changelog.route.tsx'
		),
		route('/privacy', 'modules/site/presentation/routes/privacy.route.tsx'),
		route('/terms', 'modules/site/presentation/routes/terms.route.tsx'),
		route('/blog', 'modules/blog/presentation/routes/blog.route.tsx'),
		route('/blog/$slug', 'modules/blog/presentation/routes/post.route.tsx'),
	]),
	layout('session', 'modules/identity/presentation/routes/session.route.tsx', [
		route('/app', 'modules/shell/presentation/routes/shell.route.tsx', [
			index('modules/tasks/presentation/routes/upcoming.route.tsx'),
			route('/inbox', 'modules/tasks/presentation/routes/inbox.route.tsx'),
			route('/today', 'modules/tasks/presentation/routes/today.route.tsx'),
			route('/search', 'modules/tasks/presentation/routes/search.route.tsx'),
			route(
				'/projects/$name',
				'modules/projects/presentation/routes/project.route.tsx'
			),
			route(
				'/completed',
				'modules/tasks/presentation/routes/completed.route.tsx'
			),
			route(
				'/labels/$name',
				'modules/labels/presentation/routes/label.route.tsx'
			),
			route(
				'/todoist',
				'modules/todoist/presentation/routes/todoist.route.tsx'
			),
		]),
		route('/login', 'modules/identity/presentation/routes/login.route.tsx'),
		route(
			'/desktop/sign-in',
			'modules/identity/presentation/routes/desktop-sign-in.route.tsx'
		),
	]),
	route('/today', 'modules/shell/presentation/routes/legacy-today.route.tsx'),
	route('/robots[.]txt', 'modules/site/presentation/routes/robots.route.ts'),
	route('/sitemap[.]xml', 'modules/site/presentation/routes/sitemap.route.ts'),
	route('/blog/rss[.]xml', 'modules/blog/presentation/routes/rss.route.ts'),
	route('/ingest/$', 'modules/analytics/presentation/routes/ingest.$.route.ts'),
	route('/health', 'modules/hosting/presentation/routes/health.route.ts'),
])
