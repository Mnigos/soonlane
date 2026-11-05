import { format } from 'oxfmt'
import { RuleTester } from 'oxlint/plugins-dev'
import { describe, expect, test } from 'vitest'
import formatterConfig from '../../oxfmt.config.mts'
import { declarationGroupSpacingRule } from './declaration-group-spacing.rule.mts'
import { inferredTypePlacementRule } from './inferred-type-placement.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

ruleTester.run('inferred-type-placement', inferredTypePlacementRule, {
	valid: [
		`import { pgTable, text } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
\tid: text('id').primaryKey(),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export const userRelations = relations(user, ({ many }) => ({
\tsessions: many(session),
}))`,
		`import { z } from 'zod'

export const timeRangeSchema = z.enum(['week', 'month'])
export type TimeRange = z.infer<typeof timeRangeSchema>

export const userProfileSchema = z.object({
\tid: z.string(),
})
export type UserProfile = z.infer<typeof userProfileSchema>`,
		`import { z } from 'zod'

const checkoutAttemptSchema = z.object({
\tstartedAt: z.coerce.date(),
})

type CheckoutAttemptInput = z.input<typeof checkoutAttemptSchema>
type CheckoutAttempt = z.output<typeof checkoutAttemptSchema>`,
		`import { z } from 'zod'

const payloadSchema = z.string()
// Raw payload stored in the outbox.
type Payload = z.infer<typeof payloadSchema>`,
		`import { userSchema } from './user.schema'
import { z } from 'zod'

const LIMIT = 10

export type User = z.infer<typeof userSchema>`,
		`import { user } from './auth.schema'

export const session = pgTable('session', {
\tuserId: text('user_id').references(() => user.id),
})

export type User = typeof user.$inferSelect`,
		`import { z } from 'zod'

export const itemSchema = z.object({
\tid: z.string(),
})

export const LIMIT = 10

export type ItemWithRank = z.infer<typeof itemSchema> & { rank: number }
export type ItemDraft = Omit<z.infer<typeof itemSchema>, 'id'>
export type ItemList = z.infer<typeof itemSchema>[]`,
		`import * as schema from './schema'

export const LIMIT = 10

export type User = typeof schema.user.$inferSelect`,
		`import { z } from './validation'

export const idSchema = z.uuid()
export const LIMIT = 10
export type Id = z.infer<typeof idSchema>`,
		`import { z } from 'zod'

export const idSchema = z.uuid()

function parseIds(input: unknown) {
\tconst idsSchema = z.array(idSchema)
\tconst LIMIT = 10
\ttype Ids = z.infer<typeof idsSchema>
\ttype Id = z.infer<typeof idSchema>

\treturn idsSchema.max(LIMIT).parse(input) satisfies Ids
}`,
		`import { z } from 'zod'

export type Env = z.infer<typeof envSchema>`,
		`import { z } from 'zod'

const nameSchema = z.string(),
	ageSchema = z.number()
type Name = z.infer<typeof nameSchema>
type Age = z.infer<typeof ageSchema>`,
	],
	invalid: [
		{
			code: `import { pgTable, text } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
\tid: text('id').primaryKey(),
})

export const session = pgTable('session', {
\tid: text('id').primaryKey(),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
`,
			output: `import { pgTable, text } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
\tid: text('id').primaryKey(),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export const session = pgTable('session', {
\tid: text('id').primaryKey(),
})

export type Session = typeof session.$inferSelect
`,
			recursive: true,
			errors: [
				{
					message:
						'Declare type User directly under user, the table or schema it is inferred from (AGENTS.md).',
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewUser', source: 'user' },
					line: 12,
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Session', source: 'session' },
					line: 13,
				},
			],
		},
		{
			code: `export const user = pgTable('user', {
\tid: text('id').primaryKey(),
})

export const userRelations = relations(user, ({ many }) => ({
\tsessions: many(session),
}))

export type User = typeof user.$inferSelect
`,
			output: `export const user = pgTable('user', {
\tid: text('id').primaryKey(),
})

export type User = typeof user.$inferSelect

export const userRelations = relations(user, ({ many }) => ({
\tsessions: many(session),
}))
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'User', source: 'user' },
					line: 9,
				},
			],
		},
		{
			code: `import { z } from 'zod'

const payloadSchema = z.object({ id: z.string() })

function parsePayload(payload: unknown) {
\treturn payloadSchema.parse(payload)
}

type Payload = z.infer<typeof payloadSchema>
`,
			output: `import { z } from 'zod'

const payloadSchema = z.object({ id: z.string() })
type Payload = z.infer<typeof payloadSchema>

function parsePayload(payload: unknown) {
\treturn payloadSchema.parse(payload)
}
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Payload', source: 'payloadSchema' },
				},
			],
		},
		{
			code: `import { z } from 'zod'

export const envSchema = z.object({
\tPORT: z.coerce.number(),
})

const validatedEnvSchema = envSchema.refine(env => env.PORT > 0)

export type Env = z.infer<typeof envSchema>

export const parseEnv = (env: unknown) => validatedEnvSchema.parse(env)
`,
			output: `import { z } from 'zod'

export const envSchema = z.object({
\tPORT: z.coerce.number(),
})

export type Env = z.infer<typeof envSchema>

const validatedEnvSchema = envSchema.refine(env => env.PORT > 0)

export const parseEnv = (env: unknown) => validatedEnvSchema.parse(env)
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Env', source: 'envSchema' },
				},
			],
		},
		{
			code: `import { createContext } from 'react'
import { z } from 'zod'

export const themeSchema = z.object({
\tname: z.string(),
})

export const defaultTheme = themeSchema.parse({ name: 'dark' })

export type Theme = z.infer<typeof themeSchema>

export const ThemeContext = createContext(defaultTheme)
`,
			output: `import { createContext } from 'react'
import { z } from 'zod'

export const themeSchema = z.object({
\tname: z.string(),
})

export type Theme = z.infer<typeof themeSchema>

export const defaultTheme = themeSchema.parse({ name: 'dark' })

export const ThemeContext = createContext(defaultTheme)
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Theme', source: 'themeSchema' },
				},
			],
		},
		{
			code: `import { z } from 'zod'

const reportSchema = z.object({ title: z.string() })
const persistedReportSchema = z.object({ title: z.string().min(1) })
type Report = z.infer<typeof reportSchema>
type PersistedReport = z.output<typeof persistedReportSchema>
`,
			output: `import { z } from 'zod'

const reportSchema = z.object({ title: z.string() })
type Report = z.infer<typeof reportSchema>
const persistedReportSchema = z.object({ title: z.string().min(1) })
type PersistedReport = z.output<typeof persistedReportSchema>
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Report', source: 'reportSchema' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'PersistedReport', source: 'persistedReportSchema' },
				},
			],
		},
		{
			code: `import { z as zod } from 'zod'

export const idSchema = zod.uuid()
export const LIMIT = 10
export type Id = zod.infer<typeof idSchema>
`,
			output: `import { z as zod } from 'zod'

export const idSchema = zod.uuid()
export type Id = zod.infer<typeof idSchema>
export const LIMIT = 10
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Id', source: 'idSchema' },
				},
			],
		},
		{
			code: `import * as v from 'zod/v4'

export const trackSchema = v.object({ id: v.string() })
export const LIMIT = 10
export type TrackInput = v.input<typeof trackSchema>
export type Track = v.output<typeof trackSchema>
`,
			output: `import * as v from 'zod/v4'

export const trackSchema = v.object({ id: v.string() })
export type TrackInput = v.input<typeof trackSchema>
export type Track = v.output<typeof trackSchema>
export const LIMIT = 10
`,
			recursive: true,
			errors: [
				{ messageId: 'misplacedInferredType', line: 5 },
				{ messageId: 'misplacedInferredType', line: 6 },
			],
		},
		{
			code: `import validation from 'zod'

export const LIMIT = 10
export const idSchema = validation.uuid()
export const OFFSET = 0
type Id = validation.infer<typeof idSchema>
`,
			output: `import validation from 'zod'

export const LIMIT = 10
export const idSchema = validation.uuid()
type Id = validation.infer<typeof idSchema>
export const OFFSET = 0
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Id', source: 'idSchema' },
				},
			],
		},
		{
			code: `import { z } from 'zod'

export type Track = z.output<typeof trackSchema>

export const trackSchema = z.object({
\tid: z.string(),
})
`,
			output: `import { z } from 'zod'

export const trackSchema = z.object({
\tid: z.string(),
})

export type Track = z.output<typeof trackSchema>
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Track', source: 'trackSchema' },
				},
			],
		},
		{
			code: `import { z } from 'zod'

export const itemSchema = z.object({
\tid: z.string(),
})

export const ITEM_LIMIT = 10

// Item types

/** Item as returned by the API. */
export type Item = z.infer<typeof itemSchema> // public
`,
			output: `import { z } from 'zod'

export const itemSchema = z.object({
\tid: z.string(),
})

/** Item as returned by the API. */
export type Item = z.infer<typeof itemSchema> // public

export const ITEM_LIMIT = 10

// Item types
`,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Item', source: 'itemSchema' },
				},
			],
		},
		{
			code: `import { z } from 'zod'

const idSchema = z.uuid()
const LIMIT = 10; type Id = z.infer<typeof idSchema>
`,
			output: null,
			errors: [{ messageId: 'misplacedInferredType' }],
		},
		{
			code: `import { z } from 'zod'

const idSchema = z.uuid()
const LIMIT = 10
type Id = z.infer<typeof idSchema>
(globalThis as Record<string, unknown>).limit = LIMIT
`,
			output: null,
			errors: [{ messageId: 'misplacedInferredType' }],
		},
		{
			code: `import { z } from 'zod'

const idSchema = z.uuid(); const LIMIT = 10
type Id = z.infer<typeof idSchema>
`,
			output: null,
			errors: [{ messageId: 'misplacedInferredType' }],
		},
	],
})

const placementCases = {
	valid: [
		{
			name: 'accepts consecutive infer input and output aliases with mixed exports',
			code: `import { z } from 'zod'

const valueSchema = z.string()
export type Value = z.infer<typeof valueSchema>
type ValueInput = z.input<typeof valueSchema>
export type ValueOutput = z.output<typeof valueSchema>
`,
		},
		{
			name: 'exempts all five inference forms for imported sources',
			code: `import { table, valueSchema } from './sources'
import { z as validation } from 'zod'

const LIMIT = 1

type Row = typeof table.$inferSelect
export type NewRow = typeof table.$inferInsert
type Value = validation.infer<typeof valueSchema>
export type ValueInput = validation.input<typeof valueSchema>
type ValueOutput = validation.output<typeof valueSchema>
`,
		},
	],
	invalid: [
		{
			name: 'converges when fourteen aliases are grouped at EOF',
			code: `const account = pgTable('account', {})
const session = pgTable('session', {})
const track = pgTable('track', {})
const playlist = pgTable('playlist', {})
const album = pgTable('album', {})
const artist = pgTable('artist', {})
const event = pgTable('event', {})

type Account = typeof account.$inferSelect
type NewAccount = typeof account.$inferInsert
type Session = typeof session.$inferSelect
type NewSession = typeof session.$inferInsert
type Track = typeof track.$inferSelect
type NewTrack = typeof track.$inferInsert
type Playlist = typeof playlist.$inferSelect
type NewPlaylist = typeof playlist.$inferInsert
type Album = typeof album.$inferSelect
type NewAlbum = typeof album.$inferInsert
type Artist = typeof artist.$inferSelect
type NewArtist = typeof artist.$inferInsert
type Event = typeof event.$inferSelect
type NewEvent = typeof event.$inferInsert
`,
			output: `const account = pgTable('account', {})
type Account = typeof account.$inferSelect
type NewAccount = typeof account.$inferInsert
const session = pgTable('session', {})
type Session = typeof session.$inferSelect
type NewSession = typeof session.$inferInsert
const track = pgTable('track', {})
type Track = typeof track.$inferSelect
type NewTrack = typeof track.$inferInsert
const playlist = pgTable('playlist', {})
type Playlist = typeof playlist.$inferSelect
type NewPlaylist = typeof playlist.$inferInsert
const album = pgTable('album', {})
type Album = typeof album.$inferSelect
type NewAlbum = typeof album.$inferInsert
const artist = pgTable('artist', {})
type Artist = typeof artist.$inferSelect
type NewArtist = typeof artist.$inferInsert
const event = pgTable('event', {})

type Event = typeof event.$inferSelect
type NewEvent = typeof event.$inferInsert
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Account', source: 'account' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewAccount', source: 'account' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Session', source: 'session' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewSession', source: 'session' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Track', source: 'track' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewTrack', source: 'track' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Playlist', source: 'playlist' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewPlaylist', source: 'playlist' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Album', source: 'album' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewAlbum', source: 'album' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Artist', source: 'artist' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewArtist', source: 'artist' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Event', source: 'event' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewEvent', source: 'event' },
				},
			],
		},
		{
			name: 'groups interleaved aliases under two sources',
			code: `import { z } from 'zod'

const firstSchema = z.string()
const secondSchema = z.number()

type First = z.infer<typeof firstSchema>
type Second = z.infer<typeof secondSchema>
export type FirstInput = z.input<typeof firstSchema>
export type SecondOutput = z.output<typeof secondSchema>
`,
			output: `import { z } from 'zod'

const firstSchema = z.string()
type First = z.infer<typeof firstSchema>
export type FirstInput = z.input<typeof firstSchema>
const secondSchema = z.number()

type Second = z.infer<typeof secondSchema>
export type SecondOutput = z.output<typeof secondSchema>
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'First', source: 'firstSchema' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Second', source: 'secondSchema' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'FirstInput', source: 'firstSchema' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'SecondOutput', source: 'secondSchema' },
				},
			],
		},
		{
			name: 'extends an existing alias group past an unrelated type',
			code: `const user = pgTable('user', {})
type User = typeof user.$inferSelect
type Identifier = string
export type NewUser = typeof user.$inferInsert
`,
			output: `const user = pgTable('user', {})
type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
type Identifier = string
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewUser', source: 'user' },
				},
			],
		},
		{
			name: 'moves private Drizzle insert before relations',
			code: `const user = pgTable('user', {})
const userRelations = relations(user, () => ({}))
type NewUser = typeof user.$inferInsert
`,
			output: `const user = pgTable('user', {})
type NewUser = typeof user.$inferInsert
const userRelations = relations(user, () => ({}))
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'NewUser', source: 'user' },
				},
			],
		},
		{
			name: 'moves renamed input and output aliases before an expression',
			code: `import { z as validation } from 'zod'

const valueSchema = validation.string()
register(valueSchema)
type ValueInput = validation.input<typeof valueSchema>
export type ValueOutput = validation.output<typeof valueSchema>
`,
			output: `import { z as validation } from 'zod'

const valueSchema = validation.string()
type ValueInput = validation.input<typeof valueSchema>
export type ValueOutput = validation.output<typeof valueSchema>
register(valueSchema)
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'ValueInput', source: 'valueSchema' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'ValueOutput', source: 'valueSchema' },
				},
			],
		},
		{
			name: 'moves namespace inference before unrelated statements',
			code: `import * as validation from 'zod'

const valueSchema = validation.string()
const LIMIT = 1
export type Value = validation.infer<typeof valueSchema>
`,
			output: `import * as validation from 'zod'

const valueSchema = validation.string()
export type Value = validation.infer<typeof valueSchema>
const LIMIT = 1
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Value', source: 'valueSchema' },
				},
			],
		},
		{
			name: 'moves leading line and block comments with the alias',
			code: `import { z } from 'zod'

const valueSchema = z.string()
const LIMIT = 1

// Public value.
/* Keep this description. */
export type Value = z.infer<typeof valueSchema>
`,
			output: `import { z } from 'zod'

const valueSchema = z.string()
// Public value.
/* Keep this description. */
export type Value = z.infer<typeof valueSchema>
const LIMIT = 1
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Value', source: 'valueSchema' },
				},
			],
		},
		{
			name: 'preserves source and unrelated trailing comments',
			code: `import { z } from 'zod'

const valueSchema = z.string() // Source comment.
const LIMIT = 1 // Limit comment.

/** Public value. */
type Value = z.infer<typeof valueSchema> // Alias comment.
`,
			output: `import { z } from 'zod'

const valueSchema = z.string() // Source comment.
/** Public value. */
type Value = z.infer<typeof valueSchema> // Alias comment.
const LIMIT = 1 // Limit comment.
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Value', source: 'valueSchema' },
				},
			],
		},
		{
			name: 'hoists a commented Drizzle alias after its source at the start of a file',
			code: `/** Stored user. */
type User = typeof user.$inferSelect

const user = pgTable('user', {})
`,
			output: `const user = pgTable('user', {})
/** Stored user. */
type User = typeof user.$inferSelect
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'User', source: 'user' },
				},
			],
		},
		{
			name: 'moves multiple aliases from before a source without losing comments',
			code: `import { z } from 'zod'

/** Accepted value. */
export type ValueInput = z.input<typeof valueSchema>
// Parsed value.
type ValueOutput = z.output<typeof valueSchema>

const valueSchema = z.string()
`,
			output: `import { z } from 'zod'

const valueSchema = z.string()
/** Accepted value. */
export type ValueInput = z.input<typeof valueSchema>
// Parsed value.
type ValueOutput = z.output<typeof valueSchema>
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'ValueInput', source: 'valueSchema' },
				},
				{
					messageId: 'misplacedInferredType',
					data: { name: 'ValueOutput', source: 'valueSchema' },
				},
			],
		},
		{
			name: 'keeps a blank line after a multiline source and joins vacated consts',
			code: `import { z } from 'zod'

const valueSchema = z.object({
	value: z.string(),
})

const LIMIT = 1

export type Value = z.infer<typeof valueSchema>

const OFFSET = 0
`,
			output: `import { z } from 'zod'

const valueSchema = z.object({
	value: z.string(),
})

export type Value = z.infer<typeof valueSchema>

const LIMIT = 1
const OFFSET = 0
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: { name: 'Value', source: 'valueSchema' },
				},
			],
		},
		{
			name: 'preserves multiline aliases consecutively under a multiline table',
			code: `const analyticsUserLeaderboardTimeRange = pgTable('leaderboard', {
	id: text('id'),
})

const LIMIT = 1

export type AnalyticsUserLeaderboardTimeRange =
	typeof analyticsUserLeaderboardTimeRange.$inferSelect
export type AnalyticsUserLeaderboardTimeRangeInsert =
	typeof analyticsUserLeaderboardTimeRange.$inferInsert
`,
			output: `const analyticsUserLeaderboardTimeRange = pgTable('leaderboard', {
	id: text('id'),
})

export type AnalyticsUserLeaderboardTimeRange =
	typeof analyticsUserLeaderboardTimeRange.$inferSelect
export type AnalyticsUserLeaderboardTimeRangeInsert =
	typeof analyticsUserLeaderboardTimeRange.$inferInsert

const LIMIT = 1
`,
			recursive: true,
			errors: [
				{
					messageId: 'misplacedInferredType',
					data: {
						name: 'AnalyticsUserLeaderboardTimeRange',
						source: 'analyticsUserLeaderboardTimeRange',
					},
				},
				{
					messageId: 'misplacedInferredType',
					data: {
						name: 'AnalyticsUserLeaderboardTimeRangeInsert',
						source: 'analyticsUserLeaderboardTimeRange',
					},
				},
			],
		},
	],
} satisfies RuleTester.TestCases

ruleTester.run(
	'inferred-type-placement requirement coverage',
	inferredTypePlacementRule,
	placementCases
)

ruleTester.run(
	'inferred-type-placement fixed output is stable',
	inferredTypePlacementRule,
	{
		valid: placementCases.invalid.map(({ name, output }) => ({
			name,
			code: output,
		})),
		invalid: [],
	}
)

ruleTester.run(
	'inferred-type-placement fixes satisfy declaration-group-spacing',
	declarationGroupSpacingRule,
	{
		valid: placementCases.invalid.map(({ name, output }) => ({
			name,
			code: output,
		})),
		invalid: [],
	}
)

test.each(placementCases.invalid)(
	'$name: fixed output satisfies the formatter',
	async ({ output }) => {
		const formatted = await format(
			'inferred-type-placement.fixture.ts',
			output,
			formatterConfig
		)

		expect(formatted.errors).toEqual([])
		expect(formatted.code).toBe(output)
	}
)

ruleTester.run(
	'inferred-type-placement independent constant boundaries',
	inferredTypePlacementRule,
	{
		valid: [],
		invalid: [
			...[
				{
					name: 'joins single-letter constants across export boundaries',
					before: 'const A = 1',
					after: 'export const X1 = 2',
					separator: '\n',
				},
				{
					name: 'joins exported and private typed constants',
					before: 'export const HTTP2_MAX: number = 5',
					after: 'const MIN: number = 1',
					separator: '\n',
				},
				{
					name: 'joins declare constants',
					before: 'declare const FIRST: number',
					after: 'export declare const SECOND: number',
					separator: '\n',
				},
				{
					name: 'joins object assertions and satisfies expressions',
					before: 'const DEFAULTS = { MAX: 5 } as const',
					after: 'const LIMITS = { MIN: 1 } satisfies Record<string, number>',
					separator: '\n',
				},
				{
					name: 'joins declarations with multiple uppercase bindings',
					before: 'const FIRST = 1, SECOND = 2',
					after: 'const THIRD = 3, FOURTH = 4',
					separator: '\n',
				},
				{
					name: 'preserves a trailing line comment while joining constants',
					before: 'const FIRST = 1 // first',
					after: 'const SECOND = 2',
					separator: '\n',
				},
				{
					name: 'does not join a constant to a PascalCase context',
					before: 'export const DENSE_LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.2',
					after:
						'export const TextClassContext = createContext<string | undefined>(undefined)',
					separator: '\n\n',
				},
				{
					name: 'does not join a camelCase binding to a constant',
					before: 'const firstValue = load()',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'does not join leading-underscore names',
					before: 'const _PRIVATE_LIMIT = 1',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'does not join double-underscore names',
					before: 'const FIRST = 1',
					after: 'const MAX__DOUBLE = 2',
					separator: '\n\n',
				},
				{
					name: 'does not join dollar-prefixed names',
					before: 'const $CONST = 1',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'checks every binding before the alias',
					before: 'const FIRST = 1, second = 2',
					after: 'const THIRD = 3',
					separator: '\n\n',
				},
				{
					name: 'checks every binding after the alias',
					before: 'const FIRST = 1',
					after: 'const SECOND = 2, third = 3',
					separator: '\n\n',
				},
				{
					name: 'does not join object destructuring',
					before: 'const { FIRST } = config',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'does not join array destructuring',
					before: 'const FIRST = 1',
					after: 'const [SECOND] = values',
					separator: '\n\n',
				},
				{
					name: 'does not join a const enum',
					before: 'const enum STATUS { READY }',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'does not join a multiline declaration',
					before: 'const FIRST = {\n\tMAX: 1,\n}',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'preserves the blank line before an own-line comment separator',
					before: 'const FIRST = 1',
					after: '// Second group\nconst SECOND = 2',
					separator: '\n\n',
				},
				{
					name: 'preserves the blank line after a detached own-line comment',
					before: 'const FIRST = 1\n\n// Separate groups',
					after: 'const SECOND = 2',
					separator: '\n\n',
				},
			].map(({ name, before, after, separator }) => ({
				name,
				code: `const table = pgTable('table', {})\n\n${before}\n\ntype Row = typeof table.$inferSelect\n\n${after}\n`,
				output: `const table = pgTable('table', {})\ntype Row = typeof table.$inferSelect\n\n${before}${separator}${after}\n`,
				errors: [{ messageId: 'misplacedInferredType' }],
			})),
			{
				name: 'joins constants and moves the alias without changing CRLF',
				code: "const table = pgTable('table', {})\r\n\r\nconst FIRST = 1\r\n\r\n\r\ntype Row = typeof table.$inferSelect\r\n\r\nconst SECOND = 2\r\n",
				output:
					"const table = pgTable('table', {})\r\ntype Row = typeof table.$inferSelect\r\n\r\nconst FIRST = 1\r\nconst SECOND = 2\r\n",
				errors: [{ messageId: 'misplacedInferredType' }],
			},
		],
	}
)
