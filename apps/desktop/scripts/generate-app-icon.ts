import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const FAVICON = join(import.meta.dir, '../../web/public/favicon.svg')
const ICONSET = join(import.meta.dir, '../.cache/icon.iconset')
/** Apple's macOS icon grid: on a 1024 canvas the tile is 824 wide, 100 in from each edge, with a 185.4 corner radius and a drop shadow 10 down, 10 blur, black at 30%. */
const CANVAS = 1024
const TILE_INSET = 100
const TILE_SIZE = 824
const TILE_RADIUS = 185.4
const SHADOW =
	'<filter id="shadow" color-interpolation-filters="sRGB"><feDropShadow dy="10" stdDeviation="5" flood-opacity="0.3"/></filter>'
/** The point sizes an `.iconset` holds, each at 1x and 2x. */
const ICON_SIZES = [16, 32, 128, 256, 512]
const favicon = await Bun.file(FAVICON).text()
const [, viewBox = '', body = ''] =
	/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/u.exec(favicon) ?? []
const [tile = ''] = /<rect[^>]*\/>/u.exec(body) ?? []
const tileFill = /fill="(#[\da-f]{6})"/iu.exec(tile)?.[1]
const mark = body.replace(tile, '')

if (!(viewBox && tileFill && mark.includes('stroke=')))
	throw new Error(`No tile and stroked mark found in ${FAVICON}`)

/** The favicon's tile redrawn in the macOS shape, with the mark scaled onto it. */
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}">${SHADOW}<rect x="${TILE_INSET}" y="${TILE_INSET}" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="${TILE_RADIUS}" fill="${tileFill}" filter="url(#shadow)"/><svg x="${TILE_INSET}" y="${TILE_INSET}" width="${TILE_SIZE}" height="${TILE_SIZE}" viewBox="${viewBox}">${mark}</svg></svg>`

function render(width: number) {
	return new Resvg(icon, { fitTo: { mode: 'width', value: width } })
		.render()
		.asPng()
}

await rm(ICONSET, { recursive: true, force: true })
await mkdir(ICONSET, { recursive: true })
await Promise.all(
	ICON_SIZES.flatMap(size => [
		Bun.write(join(ICONSET, `icon_${size}x${size}.png`), render(size)),
		Bun.write(join(ICONSET, `icon_${size}x${size}@2x.png`), render(size * 2)),
	])
)
