import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { declarationGroupSpacingRule } from './declaration-group-spacing.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

ruleTester.run('declaration-group-spacing', declarationGroupSpacingRule, {
	valid: [
		"export const PLUS_PREMIUM_OUTCOME_INSTRUMENTATION = 'v1'\nexport const PLUS_PREMIUM_OUTCOME_WINDOW_DAYS = 30\nexport const PLUS_PREMIUM_OUTCOME_EVENT_TYPE = 'app.premium_outcome'",
		'export const PLUS_PREMIUM_OUTCOME_WINDOW_DAYS = 30\n\nexport const RETENTION_HORIZON_DAYS = {\n\tOUTBOX_DEAD: 30,\n} as const satisfies Record<string, number>',
		'export const RETENTION_HORIZON_DAYS = {\n\tOUTBOX_DEAD: 30,\n} as const satisfies Record<string, number>\n\nexport const PLUS_PREMIUM_OUTCOME_WINDOW_DAYS = 30',
		'export const WEEK = 7\nexport const RETENTION_HORIZON_DAYS = {\n\tOUTBOX_DEAD: 30,\n} as const satisfies Record<string, number>\nexport const MONTH = 30',
		"const FIRST = load()\n\nconst SECOND = load(\n\t'value'\n)",
		"const FIRST = load(\n\t'value'\n)\n\nconst SECOND = load()",
		'export const FIRST = 1\n\n// Second group\nexport const SECOND = 2',
		'export const FIRST = 1\n\n/** Second group. */\nexport const SECOND = 2',
		'export const FIRST = 1\n// Second group\n\nexport const SECOND = 2',
		"import { a } from 'a'\n\nimport { b } from 'b'",
		"import { a } from 'a'\n\nconst first = a",
		'function first() {}\n\nfunction second() {}',
		'const FIRST = 1\n\nfunction second() {}\n\nconst THIRD = 3',
		'const FIRST = 1\n\nact()\n\nconst SECOND = 2',
		'let FIRST = 1\n\nconst SECOND = 2\n\nvar THIRD = 3\n\nlet FOURTH = 4',
		"export type UserId = Brand<string, 'UserId'>\n\nexport type TrackId = Brand<string, 'TrackId'>",
		'export const FIRST = 1\n\nexport type Second = string\n\nexport const THIRD = 3',
		'export const thingSchema = z.string()\n\nexport type Thing = z.infer<typeof thingSchema>\n\nexport const LIMIT = 1',
		'function run() {\n\tconst FIRST = load()\n\n\tconst SECOND = load()\n\n\treturn FIRST + SECOND\n}',
		"describe('service', () => {\n\tlet moduleRef: TestingModule\n\tlet repository: Repository\n\n\tconst findMock = vi.fn()\n\n\tconst saveMock = vi.fn()\n})",
		'switch (value) {\n\tcase 1: {\n\t\tconst FIRST = 1\n\n\t\tconst SECOND = 2\n\t}\n}',
		'class Store {\n\tstatic {\n\t\tconst FIRST = 1\n\n\t\tconst SECOND = 2\n\t}\n}',
		'export const DENSE_LABEL_MAX_FONT_SIZE_MULTIPLIER = 1.2\n\nexport const TextClassContext = createContext<string | undefined>(undefined)',
		'const first = load()\n\nconst second = load()',
		"export const logger = new Logger('billing')\n\nexport const UserContext = createContext(undefined)",
		'export const LIMIT = 1\n\nexport const limitSchema = z.number().max(LIMIT)',
		'export const limitSchema = z.number()\n\nexport const LIMIT = 1',
		'const Row = memo(Item)\n\nconst LIMIT = 1',
		'const _PRIVATE_LIMIT = 1\n\nconst LIMIT = 1',
		'const FIRST = 1, second = 2\n\nconst THIRD = 3',
		'const { FIRST } = config\n\nconst SECOND = 2',
		'const SECOND = 2\n\nconst [FIRST] = values',
	],
	invalid: [
		{
			code: "export const PLUS_PREMIUM_OUTCOME_INSTRUMENTATION = 'v1'\n\nexport const PLUS_PREMIUM_OUTCOME_WINDOW_DAYS = 30\n\nexport const PLUS_PREMIUM_OUTCOME_EVENT_TYPE = 'app.premium_outcome'",
			output:
				"export const PLUS_PREMIUM_OUTCOME_INSTRUMENTATION = 'v1'\nexport const PLUS_PREMIUM_OUTCOME_WINDOW_DAYS = 30\nexport const PLUS_PREMIUM_OUTCOME_EVENT_TYPE = 'app.premium_outcome'",
			errors: [
				{
					message:
						'Consecutive single-line module-level UPPER_SNAKE_CASE CONSTANTS stay together; remove the blank line (AGENTS.md).',
				},
				{ messageId: 'blankLineInDeclarationGroup' },
			],
		},
		{
			code: 'const FIRST = load()\n\nconst SECOND = load()',
			output: 'const FIRST = load()\nconst SECOND = load()',
			errors: [{ messageId: 'blankLineInDeclarationGroup', line: 3 }],
		},
		{
			code: 'const FIRST = 1\n\n\n\nconst SECOND = 2',
			output: 'const FIRST = 1\nconst SECOND = 2',
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: 'export const FIRST = 1 // seconds\n\nexport const SECOND = 2',
			output: 'export const FIRST = 1 // seconds\nexport const SECOND = 2',
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: 'export const FIRST = 1 /* seconds */\n\nexport const SECOND = 2',
			output: 'export const FIRST = 1 /* seconds */\nexport const SECOND = 2',
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: 'export const thingSchema = z.object({\n\tname: z.string(),\n})\n\nexport const LIMIT = 1\n\nexport const OFFSET = 0',
			output:
				'export const thingSchema = z.object({\n\tname: z.string(),\n})\n\nexport const LIMIT = 1\nexport const OFFSET = 0',
			errors: [{ messageId: 'blankLineInDeclarationGroup', line: 7 }],
		},
		{
			code: 'export const BILLING_ANOMALY_CHECK_INTERVAL_MS = 5 * 60 * 1000\n\nexport const HTTP2_MAX_RETRIES = 3',
			output:
				'export const BILLING_ANOMALY_CHECK_INTERVAL_MS = 5 * 60 * 1000\nexport const HTTP2_MAX_RETRIES = 3',
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: 'const DEFAULT_LIMIT = 20\n\nconst PAGE_LIMIT = DEFAULT_LIMIT',
			output: 'const DEFAULT_LIMIT = 20\nconst PAGE_LIMIT = DEFAULT_LIMIT',
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: "const API_URL = new URL('https://rigtch.fm')\n\nconst LOGGER = createLogger()",
			output:
				"const API_URL = new URL('https://rigtch.fm')\nconst LOGGER = createLogger()",
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: "export const TIME_RANGES = ['week', 'month'] as const\n\nexport const DEFAULT_TIME_RANGE = TIME_RANGES[0]",
			output:
				"export const TIME_RANGES = ['week', 'month'] as const\nexport const DEFAULT_TIME_RANGE = TIME_RANGES[0]",
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: 'const FIRST = 1, SECOND = 2\n\nconst THIRD = 3',
			output: 'const FIRST = 1, SECOND = 2\nconst THIRD = 3',
			errors: [{ messageId: 'blankLineInDeclarationGroup' }],
		},
		{
			code: 'const FIRST = 1\n\nexport const SECOND = 2\n\nconst THIRD = 3',
			output: 'const FIRST = 1\nexport const SECOND = 2\nconst THIRD = 3',
			errors: [
				{ messageId: 'blankLineInDeclarationGroup', line: 3 },
				{ messageId: 'blankLineInDeclarationGroup', line: 5 },
			],
		},
	],
})

ruleTester.run(
	'declaration-group-spacing independent boundary coverage',
	declarationGroupSpacingRule,
	{
		valid: [
			{
				name: 'double underscores are not UPPER_SNAKE_CASE',
				code: 'const MAX__DOUBLE = 1\n\nconst LIMIT = 2',
			},
			{
				name: 'dollar-prefixed identifiers are not constants',
				code: 'const LIMIT = 1\n\nconst $CONST = 2',
			},
			{
				name: 'trailing underscores are not constants',
				code: 'const MAX_ = 1\n\nconst LIMIT = 2',
			},
			{
				name: 'non-ASCII uppercase identifiers are not constants',
				code: 'const Ä_MAX = 1\n\nconst LIMIT = 2',
			},
			{
				name: 'every binding in the next declaration must qualify',
				code: 'const FIRST = 1\n\nconst SECOND = 2, third = 3',
			},
			{
				name: 'object destructuring terminates a mixed declaration',
				code: 'const FIRST = 1\n\nconst SECOND = 2, { THIRD } = config',
			},
			{
				name: 'array destructuring terminates a mixed declaration',
				code: 'const [FIRST] = values, SECOND = 2\n\nconst THIRD = 3',
			},
			{
				name: 'a camelCase middle declaration separates both constant groups',
				code: 'const FIRST = 1\n\nconst middleValue = load()\n\nconst THIRD = 3',
			},
			{
				name: 'declare does not make camelCase bindings eligible',
				code: 'declare const firstValue: number\n\ndeclare const SECOND: number',
			},
			{
				name: 'const enums separate constant groups',
				code: 'const FIRST = 1\n\nconst enum STATUS { READY }\n\nconst LAST = 2',
			},
			{
				name: 'a multiline export wrapper terminates a group',
				code: 'const FIRST = 1\n\nexport\nconst SECOND = 2',
			},
			{
				name: 'a multiline type annotation terminates a group',
				code: 'const FIRST = 1\n\nconst SECOND:\nnumber = 2',
			},
			{
				name: 'a trailing comment does not override an own-line comment separator',
				code: 'const FIRST = 1 // first\n\n// Second group\n\nconst SECOND = 2',
			},
			{
				name: 'CRLF own-line comments separate constant groups',
				code: 'const FIRST = 1\r\n\r\n/* Second group */\r\n\r\nconst SECOND = 2',
			},
		],
		invalid: [
			{
				name: 'single-letter and digit-bearing names qualify',
				code: 'const A = 1\n\nconst X1 = 2\n\nconst HTTP2_MAX = 3',
				output: 'const A = 1\nconst X1 = 2\nconst HTTP2_MAX = 3',
				errors: [
					{ messageId: 'blankLineInDeclarationGroup' },
					{ messageId: 'blankLineInDeclarationGroup' },
				],
			},
			{
				name: 'declare constants group across export boundaries',
				code: 'declare const FIRST: number\n\nexport declare const SECOND: number\n\nconst THIRD = 3',
				output:
					'declare const FIRST: number\nexport declare const SECOND: number\nconst THIRD = 3',
				errors: [
					{ messageId: 'blankLineInDeclarationGroup' },
					{ messageId: 'blankLineInDeclarationGroup' },
				],
			},
			{
				name: 'typed constants group regardless of initializer',
				code: 'const MAX: number = 5\n\nconst MIN: number = load()',
				output: 'const MAX: number = 5\nconst MIN: number = load()',
				errors: [{ messageId: 'blankLineInDeclarationGroup' }],
			},
			{
				name: 'single-line object assertions and satisfies remain eligible',
				code: 'const DEFAULTS = { MAX: 5 } as const\n\nconst LIMITS = { MIN: 1 } as const satisfies Record<string, number>',
				output:
					'const DEFAULTS = { MAX: 5 } as const\nconst LIMITS = { MIN: 1 } as const satisfies Record<string, number>',
				errors: [{ messageId: 'blankLineInDeclarationGroup' }],
			},
			{
				name: 'all bindings in both declarations qualify',
				code: 'const FIRST = 1, SECOND = 2\n\nconst THIRD = 3, FOURTH = 4',
				output: 'const FIRST = 1, SECOND = 2\nconst THIRD = 3, FOURTH = 4',
				errors: [{ messageId: 'blankLineInDeclarationGroup' }],
			},
			{
				name: 'grouping resumes after an ineligible middle declaration',
				code: 'const FIRST = 1\n\nconst middleValue = load()\n\nconst THIRD = 3\n\nconst FOURTH = 4',
				output:
					'const FIRST = 1\n\nconst middleValue = load()\n\nconst THIRD = 3\nconst FOURTH = 4',
				errors: [{ messageId: 'blankLineInDeclarationGroup', line: 7 }],
			},
			{
				name: 'autofix preserves CRLF line endings and trailing comments',
				code: 'const FIRST = 1 // first\r\n\r\n\r\nconst SECOND = 2\r\n',
				output: 'const FIRST = 1 // first\r\nconst SECOND = 2\r\n',
				errors: [{ messageId: 'blankLineInDeclarationGroup' }],
			},
		],
	}
)
