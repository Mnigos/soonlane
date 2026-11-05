import { RuleTester } from 'oxlint/plugins-dev'
import { describe, it } from 'vitest'
import { hookQueryNamingRule } from './hook-query-naming.rule.mts'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

ruleTester.run('hook-query-naming', hookQueryNamingRule, {
	valid: [
		'export function useRoastQuery() { return useQuery(options) }',
		'export const useProfileQuery = (username: string) => useQuery(orpcQuery.user.profile.queryOptions({ input: { username } }))',
		'export function useBillingQuery() { const built = orpcQuery.billing.get.queryOptions({}); return useQuery(built) }',
		'export function useHistoryInfiniteQuery() { return useInfiniteQuery(options) }',
		'export function useStatsQueries() { return useQueries({ queries: [] }) }',
		'export function useItemQueries() { return { statsQuery: useQuery(stats), playsQuery: useQuery(plays) } }',
		'export function useBoundQuery() { const query = useQuery(options); return query }',
		'function useTupleQueries() { return [useQuery(a), useQuery(b)] as const }',
		'function useSatisfiesQuery() { return useQuery(a) satisfies unknown }',
		'function useNonNullQuery() { const query = useQuery(a); return query! }',
		{
			code: 'function useCastQuery() { return <Q>useQuery(a) }',
			filename: 'use-cast-query.ts',
		},
		'function useParenAsQuery() { return (useQuery(a) as Q) }',
		'function useItemQueries() { const stats = useQuery(a); return { stats, plays: useQuery(b) } }',
		'function useMounted() { useMountEffect(() => {}); return useQuery(a) }',
		'function useReassigned() { let query = useQuery(a); query = other; return query }',
		'function useEarly(enabled) { if (!enabled) return undefined; return useQuery(a) }',
		'const useWrappedQuery = () => ((useQuery(a) as Q) satisfies unknown)!',
		'function useWrappedBindingQuery() { const query = (useQuery(a) as Q) satisfies unknown; return (query!) }',
		'function useBoundTupleQueries() { const stats = useQuery(a), plays = useQuery(b); return [stats, plays] as const }',
		'function useMutable() { let query = useQuery(a); return query }',
		'function useConditional(enabled) { if (enabled) { return useQuery(a) } return useQuery(b) }',
		'const query = 1; function useLocalQuery() { const query = useQuery(a); return query }',
		'export function useLibraryTracks() { const query = useInfiniteQuery(options); return { ...query, tracks: [] } }',
		'export function useReportSummary() { const { data } = useQuery(options); return data }',
		'export function useMountEffect(effect: () => void) { useEffect(effect, []) }',
		'export function helper() { return useQuery(options) }',
		'export function useProfileQuery() { return useQuery(options) } const run = () => useQuery(options)',
	],
	invalid: [
		{
			code: 'function useTuple() { return [useQuery(a), useQuery(b)] as const }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'function useBound() { const query = useQuery(a); return query }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'function useSession() { const auth = useAuth(); return useQuery({ enabled: auth.ok }) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'function useMountedQuery() { useMountEffect(() => {}); return useQuery(a) }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useReassignedQuery() { let query = useQuery(a); query = other; return query }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useShadowedQuery() { const query = useQuery(a); { const query = 1; return query } }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useParamQuery(query) { useQuery(a); return query }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useNestedQuery() { const query = useQuery(a); return items.map(item => query) }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useOuterQuery() { return outerQuery }',
			errors: [{ messageId: 'missingQueryCall' }],
		},
		{
			code: 'const useWrapped = () => ((useQuery(a) as Q) satisfies unknown)!',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'function useWrappedBinding() { const query = (useQuery(a) as Q) satisfies unknown; return (query!) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'function useMutableQuery() { let query = useQuery(a); return query }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useConditionalQuery(enabled) { if (enabled) { return useQuery(a) } return useQuery(b) }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useParamBindingQuery(query) { const local = useQuery(a); return query }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'const query = useQuery(a); function useOuterBindingQuery() { const local = useQuery(b); return query }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'function useAliasQuery() { const query = useQuery(a); const alias = query; return alias }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'export function useNoCallQuery() { return 1 }',
			errors: [{ messageId: 'missingQueryCall' }],
		},
		{
			code: 'export const useArrowNoCallQueries = () => [1, 2]',
			errors: [{ messageId: 'missingQueryCall' }],
		},
		{
			code: 'export const useExpressionQuery = function () { return 2 }',
			errors: [{ messageId: 'missingQueryCall' }],
		},
		{
			code: 'export function useDerivedQuery() { const query = useQuery(options); return query.data }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'export function useOptionsQuery() { return orpc.user.queryOptions() }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'export function useEarlyReturnQuery(enabled: boolean) { if (!enabled) return; return useQuery(options) }',
			errors: [{ messageId: 'derivedQueryResult' }],
		},
		{
			code: 'export function useRoast() { return useQuery(options) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'export function useRoast() { return (useQuery(options)) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'export function useRoast() { return useQuery<Roast>(options) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'export const useHistory = () => useInfiniteQuery(options)',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'export const useStats = () => (useQueries({ queries: [] }))',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'export const useRoast = function () { return useQuery(options) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
		{
			code: 'export function useRoast() { const built = queryOptions(options); return useQuery(built) }',
			errors: [{ messageId: 'missingQuerySuffix' }],
		},
	],
})
