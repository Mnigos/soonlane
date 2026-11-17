import { realpathSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import versionFile from '../../version.json' with { type: 'json' }
import { electrobunViteAliases } from './.hutch/devkit/api/config/electrobun-vite'

const SHORT_SHA_LENGTH = 7
const { APP_URL, API_URL, LANDING_URL } = process.env

if (!(APP_URL && API_URL && LANDING_URL))
	throw new Error(
		'Set APP_URL, API_URL and LANDING_URL to build the desktop page'
	)

const API_ORIGIN = new URL(API_URL).origin
/** A real path, because Vite compares the real paths of the files it loads. */
const SOURCE_ROOT = realpathSync(resolve(import.meta.dirname, 'src'))
/** The page's files under `src`: its entries, its routes, the modules' `presentation/` layers and the two RPC clients. */
const PAGE_FILES =
	/^(?:view\.tsx|router\.tsx|index\.html|styles\.css|build-info\.types\.ts|routes\/.+|modules\/[^/]+\/presentation\/.+|platform\/rpc\/[^/]+\.client\.ts)$/u
/** Main-process packages and the Electrobun main SDK, matched on resolved paths so an alias or a re-export cannot hide them. */
const MAIN_PROCESS_PATHS =
	/\/node_modules\/(?:effect|@effect\/[^/]+)\/|\/\.hutch\/devkit\/api\/sdks\/main\//u
const BUN_SPECIFIER = /^bun(?::|$)/u

function failPageBoundary(id: string): never {
	throw new Error(`The desktop page must not bundle main-process code: ${id}`)
}

/**
 * Fails the page build when its module graph reaches main-process code: Effect,
 * the Electrobun main SDK, Bun or Node built-ins, or any file under `src` that
 * is not the page's. Type-only imports, such as the RPC contract, never reach the graph.
 */
function pageBoundary(): Plugin {
	return {
		name: 'desktop-page-boundary',
		enforce: 'pre',
		resolveId: source => {
			if (isBuiltin(source) || BUN_SPECIFIER.test(source))
				failPageBoundary(source)
		},
		load: id => {
			const path = id.split('?')[0] ?? id
			const isMainProcessSource =
				path.startsWith(`${SOURCE_ROOT}/`) &&
				!PAGE_FILES.test(path.slice(SOURCE_ROOT.length + 1))

			if (isMainProcessSource || MAIN_PROCESS_PATHS.test(path))
				failPageBoundary(path)
		},
	}
}

/**
 * The bundled page: one HTML file and its assets, which electrobun.config.ts
 * copies into `views://app`. Its CSP lets scripts reach only the API and
 * Electrobun's RPC socket, because any script on the page can ask for the token.
 */
export default defineConfig({
	root: 'src',
	base: './',
	// The npm `electrobun` package is only a stub in 2.x; `bun run sdk` projects the real SDK into .hutch/devkit.
	resolve: { alias: electrobunViteAliases('.hutch/devkit') },
	plugins: [
		pageBoundary(),
		react(),
		tailwindcss(),
		{
			name: 'api-origin-in-csp',
			transformIndexHtml: html => html.replace('%API_ORIGIN%', API_ORIGIN),
		},
	],
	define: {
		'import.meta.env.APP_URL': JSON.stringify(new URL(APP_URL).origin),
		'import.meta.env.API_URL': JSON.stringify(API_ORIGIN),
		'import.meta.env.LANDING_URL': JSON.stringify(new URL(LANDING_URL).origin),
		'import.meta.env.APP_VERSION': JSON.stringify(versionFile.version),
		'import.meta.env.APP_COMMIT': JSON.stringify(
			(process.env.GITHUB_SHA ?? 'dev').slice(0, SHORT_SHA_LENGTH)
		),
	},
	// One bundle read from disk: no network to split it for.
	build: {
		outDir: '../dist/view',
		emptyOutDir: true,
		chunkSizeWarningLimit: 2000,
	},
})
