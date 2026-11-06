import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { allPosts } from 'content-collections'
import satori from 'satori'
import {
	OG_IMAGE_SIZE,
	POST_OG_IMAGE_DIR,
} from '@/modules/blog/presentation/blog.constants'
import { getPostOgImagePath } from '@/modules/blog/presentation/helpers/post.helper'
import {
	DATE_FORMAT,
	SITE_NAME,
} from '@/modules/site/presentation/site.constants'

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../public')
const FONTS_DIR = path.resolve(import.meta.dirname, 'assets/fonts')
const OUTPUT_DIR = path.join(PUBLIC_DIR, POST_OG_IMAGE_DIR)

const [regular, bold, logo] = await Promise.all([
	readFile(path.join(FONTS_DIR, 'Inter-Regular.ttf')),
	readFile(path.join(FONTS_DIR, 'Inter-Bold.ttf')),
	readFile(path.join(PUBLIC_DIR, 'favicon.svg')),
])
const logoUrl = `data:image/svg+xml;base64,${logo.toString('base64')}`

// Images of posts that left the data (drafts on production settings) must not linger from an earlier build.
await rm(OUTPUT_DIR, { recursive: true, force: true })
await mkdir(OUTPUT_DIR, { recursive: true })

await Promise.all(
	allPosts.map(async ({ slug, title, date }) => {
		const svg = await satori(
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					boxSizing: 'border-box',
					width: '100%',
					height: '100%',
					padding: '72px 80px',
					backgroundColor: '#1e1e1e',
					fontFamily: 'Inter',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
					{/* The ring starts 12/64 into the favicon tile; pull it back so it lines up with the title. */}
					<img
						alt=""
						height={56}
						src={logoUrl}
						style={{ marginLeft: -(56 * 12) / 64 }}
						width={56}
					/>

					<span style={{ fontSize: 32, fontWeight: 700, color: '#e8e8e8' }}>
						{SITE_NAME}
					</span>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div
						style={{
							display: 'block',
							lineClamp: 3,
							fontSize: 64,
							fontWeight: 700,
							lineHeight: 1.15,
							letterSpacing: '-0.02em',
							color: '#e8e8e8',
						}}
					>
						{title}
					</div>

					<div
						style={{ height: 1, marginTop: 48, backgroundColor: '#333333' }}
					/>

					<span style={{ marginTop: 32, fontSize: 28, color: '#a3a3a3' }}>
						{DATE_FORMAT.format(new Date(date))}
					</span>
				</div>
			</div>,
			{
				...OG_IMAGE_SIZE,
				fonts: [
					{ name: 'Inter', data: regular, weight: 400, style: 'normal' },
					{ name: 'Inter', data: bold, weight: 700, style: 'normal' },
				],
			}
		)
		const outputPath = path.join(PUBLIC_DIR, getPostOgImagePath(slug))

		await writeFile(outputPath, new Resvg(svg).render().asPng())
		console.log(`Wrote ${path.relative(PUBLIC_DIR, outputPath)}`)
	})
)
