import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { COLORS } from '../src/tokens.gen.ts'

const ASSETS = join(import.meta.dir, '../assets')
const FAVICON = join(import.meta.dir, '../../web/public/favicon.svg')
const ICON_SIZE = 1024
const SPLASH_SIZE = 512
/** The favicon's ring and check span 12 to 52 of its 64-unit box, stroke included. */
const MARK_VIEW_BOX = '12 12 40 40'
const favicon = await Bun.file(FAVICON).text()
const mark = (/<svg[^>]*>([\s\S]*)<\/svg>/u.exec(favicon)?.[1] ?? '')
	.replace(/<rect[^>]*\/>/u, '')
	.replaceAll(/stroke="#[\da-f]{6}"/giu, `stroke="${COLORS.primary}"`)

if (!mark.includes(COLORS.primary))
	throw new Error(`No stroked mark found in ${FAVICON}`)

function render(svg: string, width: number) {
	return new Resvg(svg, { fitTo: { mode: 'width', value: width } })
		.render()
		.asPng()
}

/** iOS masks the corners itself, so the icon is a full-bleed opaque square. */
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.background}"/>${mark}</svg>`
const splash = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEW_BOX}">${mark}</svg>`

await Promise.all([
	Bun.write(join(ASSETS, 'icon.png'), render(icon, ICON_SIZE)),
	Bun.write(join(ASSETS, 'splash-icon.png'), render(splash, SPLASH_SIZE)),
])
