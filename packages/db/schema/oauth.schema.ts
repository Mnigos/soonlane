import type { McpConnectionId, UserId } from '@soonlane/domain'
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import { session, user } from './auth.schema'

/**
 * The tables of Better Auth's OAuth provider (`@better-auth/oauth-provider`, behind `mcp()`) and `jwt` plugins, through which agents connect.
 * Columns and nullability follow the plugins' own schema; every reference declares `onDelete`, so deleting a user or a client removes what hangs off it.
 */
export const oauthClient = pgTable(
	'oauth_client',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		clientId: text('client_id').notNull().unique(),
		/** Hashed; public clients, every CIMD one included, have none. */
		clientSecret: text('client_secret'),
		clientDiscoveryId: text('client_discovery_id'),
		disabled: boolean('disabled').default(false),
		skipConsent: boolean('skip_consent'),
		enableEndSession: boolean('enable_end_session'),
		subjectType: text('subject_type'),
		scopes: text('scopes').array(),
		clientCredentialsScopes: text('client_credentials_scopes')
			.array()
			.default([]),
		userId: uuid('user_id')
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at'),
		updatedAt: timestamp('updated_at'),
		name: text('name'),
		uri: text('uri'),
		icon: text('icon'),
		contacts: text('contacts').array(),
		tos: text('tos'),
		policy: text('policy'),
		softwareId: text('software_id'),
		softwareVersion: text('software_version'),
		softwareStatement: text('software_statement'),
		redirectUris: text('redirect_uris').array().notNull(),
		postLogoutRedirectUris: text('post_logout_redirect_uris').array(),
		backchannelLogoutUri: text('backchannel_logout_uri'),
		backchannelLogoutSessionRequired: boolean(
			'backchannel_logout_session_required'
		),
		tokenEndpointAuthMethod: text('token_endpoint_auth_method'),
		applicationType: text('application_type'),
		jwks: text('jwks'),
		jwksUri: text('jwks_uri'),
		grantTypes: text('grant_types').array(),
		responseTypes: text('response_types').array(),
		requirePKCE: boolean('require_pkce'),
		dpopBoundAccessTokens: boolean('dpop_bound_access_tokens').default(false),
		referenceId: text('reference_id'),
		metadata: jsonb('metadata'),
	},
	table => [index('oauth_client_user_idx').on(table.userId)]
)

/** A protected resource tokens are issued for; the only row is the MCP server, seeded from the provider's configuration. */
export const oauthResource = pgTable('oauth_resource', {
	id: uuid('id').primaryKey().defaultRandom(),
	identifier: text('identifier').notNull().unique(),
	name: text('name').notNull(),
	accessTokenTtl: integer('access_token_ttl'),
	refreshTokenTtl: integer('refresh_token_ttl'),
	signingAlgorithm: text('signing_algorithm'),
	signingKeyId: text('signing_key_id'),
	allowedScopes: text('allowed_scopes').array(),
	customClaims: jsonb('custom_claims'),
	dpopBoundAccessTokensRequired: boolean(
		'dpop_bound_access_tokens_required'
	).default(false),
	disabled: boolean('disabled').default(false),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at'),
	policyVersion: integer('policy_version').default(1),
	metadata: jsonb('metadata'),
})

export const oauthClientResource = pgTable(
	'oauth_client_resource',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		resourceId: text('resource_id')
			.notNull()
			.references(() => oauthResource.identifier, { onDelete: 'cascade' }),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at'),
	},
	table => [
		index('oauth_client_resource_client_idx').on(table.clientId),
		index('oauth_client_resource_resource_idx').on(table.resourceId),
		uniqueIndex('oauth_client_resource_client_resource_idx').on(
			table.clientId,
			table.resourceId
		),
	]
)

export const oauthRefreshToken = pgTable(
	'oauth_refresh_token',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		/** Hashed. */
		token: text('token').notNull().unique(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		sessionId: uuid('session_id').references(() => session.id, {
			onDelete: 'set null',
		}),
		userId: uuid('user_id')
			.notNull()
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		referenceId: text('reference_id'),
		authorizationCodeId: text('authorization_code_id'),
		resources: text('resources').array(),
		requestedUserInfoClaims: text('requested_user_info_claims').array(),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at'),
		revoked: timestamp('revoked'),
		rotatedAt: timestamp('rotated_at'),
		/** Encrypted with the auth secret: the previous token response, replayed to a retried refresh within the reuse window. */
		rotationReplayResponse: text('rotation_replay_response'),
		rotationReplayExpiresAt: timestamp('rotation_replay_expires_at'),
		authTime: timestamp('auth_time'),
		confirmation: jsonb('confirmation'),
		scopes: text('scopes').array().notNull(),
	},
	table => [
		index('oauth_refresh_token_client_idx').on(table.clientId),
		index('oauth_refresh_token_session_idx').on(table.sessionId),
		index('oauth_refresh_token_user_idx').on(table.userId),
		index('oauth_refresh_token_authorization_code_idx').on(
			table.authorizationCodeId
		),
	]
)

/** Only opaque access tokens are stored; the JWTs issued for the MCP server never are. */
export const oauthAccessToken = pgTable(
	'oauth_access_token',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		/** Hashed. */
		token: text('token').unique(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		sessionId: uuid('session_id').references(() => session.id, {
			onDelete: 'set null',
		}),
		userId: uuid('user_id')
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		referenceId: text('reference_id'),
		authorizationCodeId: text('authorization_code_id'),
		resources: text('resources').array(),
		requestedUserInfoClaims: text('requested_user_info_claims').array(),
		refreshId: uuid('refresh_id').references(() => oauthRefreshToken.id, {
			onDelete: 'cascade',
		}),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at'),
		revoked: timestamp('revoked'),
		confirmation: jsonb('confirmation'),
		scopes: text('scopes').array().notNull(),
	},
	table => [
		index('oauth_access_token_client_idx').on(table.clientId),
		index('oauth_access_token_session_idx').on(table.sessionId),
		index('oauth_access_token_user_idx').on(table.userId),
		index('oauth_access_token_authorization_code_idx').on(
			table.authorizationCodeId
		),
		index('oauth_access_token_refresh_idx').on(table.refreshId),
	]
)

/** An MCP connection: what one user allowed one client. One row per pair, so the list never shows an agent twice. */
export const oauthConsent = pgTable(
	'oauth_consent',
	{
		id: uuid('id').primaryKey().defaultRandom().$type<McpConnectionId>(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.$type<UserId>()
			.references(() => user.id, { onDelete: 'cascade' }),
		referenceId: text('reference_id'),
		resources: text('resources').array(),
		requestedUserInfoClaims: text('requested_user_info_claims').array(),
		scopes: text('scopes').array().notNull(),
		createdAt: timestamp('created_at'),
		updatedAt: timestamp('updated_at'),
	},
	table => [
		index('oauth_consent_client_idx').on(table.clientId),
		uniqueIndex('oauth_consent_user_client_idx').on(
			table.userId,
			table.clientId
		),
	]
)

/** A spent `private_key_jwt` assertion; its deterministic id makes a replay collide on the primary key. */
export const oauthClientAssertion = pgTable('oauth_client_assertion', {
	id: uuid('id').primaryKey().defaultRandom(),
	expiresAt: timestamp('expires_at').notNull(),
})

/** The `jwt` plugin's signing keys; the private key is encrypted with the auth secret. */
export const jwks = pgTable('jwks', {
	id: uuid('id').primaryKey().defaultRandom(),
	publicKey: text('public_key').notNull(),
	privateKey: text('private_key').notNull(),
	createdAt: timestamp('created_at').notNull(),
	expiresAt: timestamp('expires_at'),
	alg: text('alg'),
	crv: text('crv'),
})
