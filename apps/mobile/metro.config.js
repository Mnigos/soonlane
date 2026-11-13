const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativewind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

/**
 * Packages that must exist once in the bundle. Bun's isolated layout gives
 * every workspace package its own peer-resolved copy, so `@soonlane/app`
 * would get the catalog's React and its own react-query next to the app's.
 * Resolving these from the app's directory keeps one instance of each.
 */
const SINGLETONS = ['react', 'react-native', '@tanstack/react-query']

const isSingleton = moduleName =>
	SINGLETONS.some(
		name => moduleName === name || moduleName.startsWith(`${name}/`)
	)

config.resolver.resolveRequest = (context, moduleName, platform) =>
	context.resolveRequest(
		isSingleton(moduleName)
			? { ...context, originModulePath: path.join(__dirname, 'index.ts') }
			: context,
		moduleName,
		platform
	)

/** NativeWind wraps `resolveRequest` and calls the one above as its parent. */
module.exports = withNativewind(config)
