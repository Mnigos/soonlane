import { index, layout, rootRoute, route } from '@tanstack/virtual-file-routes'

export const routes = rootRoute('routes/__root.tsx', [
	layout('session', 'modules/identity/presentation/routes/session.route.tsx', [
		layout('shell', 'modules/shell/presentation/routes/shell.route.tsx', [
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
		route(
			'/quick-add',
			'modules/tasks/presentation/routes/quick-add.route.tsx'
		),
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
	route('/health', 'modules/hosting/presentation/routes/health.route.ts'),
])
