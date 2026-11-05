import { index, layout, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	layout('shell', 'modules/shell/presentation/routes/shell.route.tsx', [
		index('modules/tasks/presentation/routes/upcoming.route.tsx'),
		route('/today', 'modules/tasks/presentation/routes/today.route.tsx'),
	]),
	route(
		'/api/auth/$',
		'modules/identity/presentation/routes/api.auth.$.route.ts'
	),
	route('/api/rpc/$', 'routes/api.rpc.$.route.ts'),
])
