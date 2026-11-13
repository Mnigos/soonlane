import path from 'node:path'
import { createBuilder } from '@content-collections/core'

const builder = await createBuilder(
	path.resolve(import.meta.dirname, '../content-collections.ts')
)

await builder.build()
