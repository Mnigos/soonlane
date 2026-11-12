import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { electrobunViteAliases } from '../../.hutch/devkit/api/config/electrobun-vite'

const root = fileURLToPath(new URL('.', import.meta.url))

/** SPIKE SOON-141: the bundled page, built to spike/view/dist and copied into the app as views://app. */
export default defineConfig({
	root,
	base: './',
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: electrobunViteAliases(
			fileURLToPath(new URL('../../.hutch/devkit', import.meta.url))
		),
	},
	define: {
		'import.meta.env.VITE_API_URL': JSON.stringify(
			process.env.VITE_API_URL ?? 'http://localhost:4141'
		),
	},
	build: { outDir: 'dist', emptyOutDir: true },
})
