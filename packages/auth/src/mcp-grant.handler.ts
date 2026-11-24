import type { GenericEndpointContext } from 'better-auth'

type AuthAdapter = GenericEndpointContext['context']['adapter']

export interface McpGrantOwner {
	userId: string
	clientId: string
}

/** How the provider's authorization codes start in `verification.value`: it writes them with `JSON.stringify`, `type` first. */
const AUTHORIZATION_CODE_PREFIX = '{"type":"authorization_code",'
/** Rows one `findMany` reads; the adapter reads 100 when no limit is given and never more than asked. */
const CODE_PAGE_SIZE = 100

function isCodeFor(value: string, { userId, clientId }: McpGrantOwner) {
	try {
		const code: unknown = JSON.parse(value)

		return (
			typeof code === 'object' &&
			code !== null &&
			'userId' in code &&
			code.userId === userId &&
			'query' in code &&
			typeof code.query === 'object' &&
			code.query !== null &&
			'client_id' in code.query &&
			code.query.client_id === clientId
		)
	} catch {
		return false
	}
}

/**
 * The ids of the user's unexchanged codes for the client, every page of them: `findMany` reads at most `CODE_PAGE_SIZE` rows, so it pages by id
 * (`id > last`, ascending), which a concurrent insert or delete cannot make skip a row. The pattern narrows to the user's codes only; the parsed
 * value decides the client, since a client id may hold LIKE wildcards or a backslash LIKE would read as an escape.
 */
async function findCodesFor(
	adapter: AuthAdapter,
	owner: McpGrantOwner,
	afterId?: string
): Promise<string[]> {
	const page = await adapter.findMany<{ id: string; value: string }>({
		model: 'verification',
		where: [
			{
				field: 'value',
				operator: 'starts_with',
				value: AUTHORIZATION_CODE_PREFIX,
			},
			{
				field: 'value',
				operator: 'contains',
				value: `"userId":${JSON.stringify(owner.userId)}`,
			},
			...(afterId === undefined
				? []
				: [{ field: 'id', operator: 'gt' as const, value: afterId }]),
		],
		sortBy: { field: 'id', direction: 'asc' },
		limit: CODE_PAGE_SIZE,
	})
	const matches = page
		.filter(({ value }) => isCodeFor(value, owner))
		.map(({ id }) => id)
	const last = page.at(-1)

	if (page.length < CODE_PAGE_SIZE || !last) return matches

	return [...matches, ...(await findCodesFor(adapter, owner, last.id))]
}

/**
 * Before a user allows an agent they have no connection to, deletes everything still issued to that agent for them: refresh tokens, stored access
 * tokens and unexchanged authorization codes. The provider's code exchange and refresh grant never read the connection, so a code or refresh token
 * from before a Disconnect would otherwise mint tokens dated after the new connection, which it would accept. Nothing is deleted while a connection
 * exists (allowing it again with other scopes), since those credentials belong to it.
 */
export async function clearEarlierMcpGrants(
	adapter: AuthAdapter,
	owner: McpGrantOwner
) {
	const ownedBy = [
		{ field: 'userId', value: owner.userId },
		{ field: 'clientId', value: owner.clientId },
	]
	const connection = await adapter.findOne({
		model: 'oauthConsent',
		where: ownedBy,
	})

	if (connection) return

	await adapter.deleteMany({ model: 'oauthAccessToken', where: ownedBy })
	await adapter.deleteMany({ model: 'oauthRefreshToken', where: ownedBy })

	const stale = await findCodesFor(adapter, owner)

	if (stale.length > 0)
		await adapter.deleteMany({
			model: 'verification',
			where: [{ field: 'id', operator: 'in', value: stale }],
		})
}
