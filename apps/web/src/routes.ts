import { index, layout, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	layout('app', 'routes/app-layout.route.tsx', [
		index('modules/tasks/presentation/routes/upcoming.route.tsx'),
		route('/today', 'modules/tasks/presentation/routes/today.route.tsx'),
	]),
	route('/api/rpc/$', 'routes/api.rpc.$.route.ts'),
])
