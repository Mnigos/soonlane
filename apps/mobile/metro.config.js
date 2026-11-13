const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

/** Bun's isolated install gives each workspace package its own copy of these, so they resolve from this app only. */
const SINGLETONS = ['react', 'react-native', '@tanstack/react-query']
const config = getDefaultConfig(__dirname)
const appOrigin = path.join(__dirname, 'package.json')

config.resolver.resolveRequest = (context, moduleName, platform) =>
	context.resolveRequest(
		SINGLETONS.some(
			name => moduleName === name || moduleName.startsWith(`${name}/`)
		)
			? { ...context, originModulePath: appOrigin }
			: context,
		moduleName,
		platform
	)

module.exports = config
