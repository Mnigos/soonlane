import { index, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	index('modules/shell/presentation/routes/root-redirect.route.tsx'),
	route('/app', 'modules/shell/presentation/routes/shell.route.tsx', [
		index('modules/tasks/presentation/routes/upcoming.route.tsx'),
		route('/today', 'modules/tasks/presentation/routes/today.route.tsx'),
	]),
	route('/today', 'modules/shell/presentation/routes/legacy-today.route.tsx'),
	route('/login', 'modules/identity/presentation/routes/login.route.tsx'),
	route(
		'/desktop/sign-in',
		'modules/identity/presentation/routes/desktop-sign-in.route.tsx'
	),
	route(
		'/desktop/callback',
		'modules/identity/presentation/routes/desktop-callback.route.tsx'
	),
	route(
		'/api/auth/$',
		'modules/identity/presentation/routes/api.auth.$.route.ts'
	),
	route('/api/rpc/$', 'routes/api.rpc.$.route.ts'),
])
