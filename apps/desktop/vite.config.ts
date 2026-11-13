import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import versionFile from '../../version.json' with { type: 'json' }
import { electrobunViteAliases } from './.hutch/devkit/api/config/electrobun-vite'

const SHORT_SHA_LENGTH = 7
const { APP_URL, API_URL } = process.env

if (!(APP_URL && API_URL))
	throw new Error('Set APP_URL and API_URL to build the desktop page')

const API_ORIGIN = new URL(API_URL).origin

/**
 * The bundled page: one HTML file and its assets, which electrobun.config.ts
 * copies into `views://app`. Its CSP lets scripts reach only the API and
 * Electrobun's RPC socket, because any script on the page can ask for the token.
 */
export default defineConfig({
	root: 'src/view',
	base: './',
	// The npm `electrobun` package is only a stub in 2.x; `bun run sdk` projects the real SDK into .hutch/devkit.
	resolve: { alias: electrobunViteAliases('.hutch/devkit') },
	plugins: [
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
		'import.meta.env.APP_VERSION': JSON.stringify(versionFile.version),
		'import.meta.env.APP_COMMIT': JSON.stringify(
			(process.env.GITHUB_SHA ?? 'dev').slice(0, SHORT_SHA_LENGTH)
		),
	},
	// One bundle read from disk: no network to split it for.
	build: {
		outDir: '../../dist/view',
		emptyOutDir: true,
		chunkSizeWarningLimit: 2000,
	},
})
