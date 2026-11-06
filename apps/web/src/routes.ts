import { index, layout, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	layout('site', 'modules/site/presentation/routes/site.route.tsx', [
		index('modules/site/presentation/routes/home.route.tsx'),
	]),
	layout('session', 'modules/identity/presentation/routes/session.route.tsx', [
		route('/app', 'modules/shell/presentation/routes/shell.route.tsx', [
			index('modules/tasks/presentation/routes/upcoming.route.tsx'),
			route('/today', 'modules/tasks/presentation/routes/today.route.tsx'),
			route(
				'/labels/$name',
				'modules/labels/presentation/routes/label.route.tsx'
			),
		]),
		route('/login', 'modules/identity/presentation/routes/login.route.tsx'),
		route(
			'/desktop/sign-in',
			'modules/identity/presentation/routes/desktop-sign-in.route.tsx'
		),
		route(
			'/desktop/callback',
			'modules/identity/presentation/routes/desktop-callback.route.tsx'
		),
	]),
	route('/today', 'modules/shell/presentation/routes/legacy-today.route.tsx'),
	route('/robots[.]txt', 'modules/site/presentation/routes/robots.route.ts'),
	route('/sitemap[.]xml', 'modules/site/presentation/routes/sitemap.route.ts'),
	route(
		'/api/auth/$',
		'modules/identity/presentation/routes/api.auth.$.route.ts'
	),
	route('/api/rpc/$', 'routes/api.rpc.$.route.ts'),
])
